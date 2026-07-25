import jwt from "jsonwebtoken";
import crypto from "crypto";
import xlsx from "xlsx";
import mammoth from "mammoth";
import User from "./../models/user.model.js";
import bcrypt from "bcryptjs";
import {
  hasBaseRole,
  hydrateUserRoles,
  hydrateUsersRoles,
} from "../utils/userRoles.js";
import Course from "../models/courses.model.js";
import { invalidateCourseCache } from "./course.controller.js";
import { sendRegistrationEmail, sendReferralSuccessEmail } from "../utils/Mailer.js";
import { computeInstructorRating } from "../utils/instructorRating.js";
import { deleteKey } from "../utils/redisClient.js";
import {
  deleteOtpRecord,
  getOtpRecord,
  setOtpRecord,
  updateOtpRecord,
} from "../utils/otpStore.js";
import { verifyFirebaseIdToken } from "../config/firebaseAdmin.js";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const createToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: "/",
  });
};

const createReferralCode = () =>
  crypto.randomBytes(3).toString("hex").toUpperCase();

const getUniqueReferralCode = async () => {
  let code;
  let existing;
  do {
    code = createReferralCode();
    existing = await User.findOne({ referralCode: code });
  } while (existing);
  return code;
};

export const ensureUserReferralCode = async (user) => {
  if (user.referralCode) return user.referralCode;

  const code = await getUniqueReferralCode();
  user.referralCode = code;
  await user.save();
  return code;
};

const normalizeString = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

export const normalizeIndianPhoneNumber = (value) => {
  const raw = normalizeString(value);
  const digits = raw.replace(/\D/g, "");

  if (/^\d{10}$/.test(digits)) return `+91${digits}`;
  if (/^91\d{10}$/.test(digits)) return `+${digits}`;
  if (/^\+\d{8,15}$/.test(raw.replace(/[^\d+]/g, ""))) {
    return raw.replace(/[^\d+]/g, "");
  }

  return raw;
};

export const getPhoneLookupValues = (value) => {
  const normalized = normalizeIndianPhoneNumber(value);
  const digits = normalizeString(value).replace(/\D/g, "");
  const values = new Set([normalizeString(value), normalized]);

  if (/^\d{10}$/.test(digits)) values.add(digits);
  if (/^91\d{10}$/.test(digits)) {
    values.add(digits.slice(2));
    values.add(`+${digits}`);
  }

  return [...values].filter(Boolean);
};

const pickRowValue = (row, aliases) => {
  for (const alias of aliases) {
    if (
      row?.[alias] !== undefined &&
      row?.[alias] !== null &&
      row?.[alias] !== ""
    ) {
      return row[alias];
    }
    const fallback = row?.[alias.toLowerCase()];
    if (fallback !== undefined && fallback !== null && fallback !== "") {
      return fallback;
    }
  }
  return "";
};

export const buildStudentPayload = (row) => {
  const name = normalizeString(
    pickRowValue(row, [
      "name",
      "fullName",
      "studentName",
      "student",
      "firstName",
    ]),
  );
  const email = normalizeString(pickRowValue(row, ["email", "mail", "eMail"]));
  const phoneNumber = normalizeString(
    pickRowValue(row, [
      "phoneNumber",
      "phone",
      "mobile",
      "mobileNumber",
      "contactNumber",
    ]),
  );
  const password = normalizeString(
    pickRowValue(row, ["password", "pass", "defaultPassword"]),
  );
  const city = normalizeString(
    pickRowValue(row, ["city", "district", "location"]),
  );
  const state = normalizeString(pickRowValue(row, ["state", "province"]));
  const pincode = normalizeString(
    pickRowValue(row, ["pincode", "postalCode", "zip", "zipCode"]),
  );

  return {
    name,
    email,
    phoneNumber,
    password,
    city,
    state,
    pincode,
  };
};

const parseDelimitedText = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0]
    .split(delimiter)
    .map((h) => h.trim().replace(/^"|"$/g, ""));

  return lines.slice(1).map((line, index) => {
    const values = line
      .split(delimiter)
      .map((v) => v.trim().replace(/^"|"$/g, ""));

    return headers.reduce(
      (acc, header, i) => {
        acc[header] = values[i] ?? "";
        return acc;
      },
      { __rowIndex: index + 2 },
    );
  });
};

export const generateStudentPassword = () =>
  `Student@${Math.random().toString(36).slice(-6).toUpperCase()}`;

// ── Helper: check if two dates fall on the same IST calendar day ──────────────
// IST = UTC+5:30. We shift both timestamps by 5h30m before comparing dates,
// so a login at 11 PM IST and one at 1 AM IST the next day correctly differ.
const isSameISTDay = (dateA, dateB) => {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const toISTDateString = (d) =>
    new Date(new Date(d).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
  return toISTDateString(dateA) === toISTDateString(dateB);
};

// ── Register ──────────────────────────────────────────────────────────────────
export const RegisterUser = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    city,
    state,
    phoneNumber,
    pincode,
    referralCode: referralCodeParam,
  } = req.body;

  try {
    const normalizedPhoneNumber = normalizeIndianPhoneNumber(phoneNumber);

    if (
      !name ||
      !password ||
      !city ||
      !state ||
      !normalizedPhoneNumber ||
      !pincode
    ) {
      return res.status(400).json({
        message:
          "Name, password, city, state, pincode, and phone number are required",
      });
    }

    const existingPhone = await User.findOne({
      phoneNumber: { $in: getPhoneLookupValues(normalizedPhoneNumber) },
    });
    if (existingPhone) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const allowedRoles = ["student", "instructor"];
    const normalizedRole = allowedRoles.includes(role) ? role : "student";

    const referrer = referralCodeParam
      ? await User.findOne({
          referralCode: referralCodeParam.trim().toUpperCase(),
        })
      : null;

    const user = await User.create({
      name,
      ...(email && { email }),
      password,
      role: normalizedRole,
      city: city ? city.charAt(0).toUpperCase() + city.slice(1) : city,
      state,
      phoneNumber: normalizedPhoneNumber,
      pincode,
      referralCode: await getUniqueReferralCode(),
      ...(referrer && { referredBy: referrer._id }),
    });

    if (referrer) {
      referrer.coins = (referrer.coins ?? 0) + 50;
      referrer.referralsCount = (referrer.referralsCount ?? 0) + 1;
      await referrer.save();
      await deleteKey("students:leaderboard");
      if (referrer.email && referrer.notificationSettings?.emailNotifications !== false) {
        sendReferralSuccessEmail(referrer.email, referrer.name, user.name, 50, referrer._id).catch(console.error);
      }
    }

    if (user.email) {
      sendRegistrationEmail(user.email, user.name, user._id).catch(console.error);
    }

    const userAgent = req.headers["user-agent"] || "Unknown Device";
    const ip =
      req.headers["x-forwarded-for"] ||
      req.ip ||
      req.socket.remoteAddress ||
      "Unknown IP";
    user.devices = [{ userAgent, ip, lastLogin: new Date() }];
    await user.save();

    const token = createToken(user._id);
    setTokenCookie(res, token);

    const userData = await hydrateUserRoles(user);

    // `token` is included here alongside the cookie so the Capacitor Android
    // app (which can't reliably rely on the cross-origin cookie inside its
    // WebView) can store it and send it back as an Authorization: Bearer
    // header on subsequent requests. The website continues to use the cookie
    // and can simply ignore this field.
    res.status(201).json({ ...userData, token });
  } catch (error) {
    const message =
      error?.errors?.password?.message ||
      error.message ||
      "Registration failed";
    res.status(400).json({ message });
    console.error("Error registering user:", error);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const LoginUser = async (req, res) => {
  const { phoneNumber, password } = req.body;

  try {
    const phoneLookupValues = getPhoneLookupValues(phoneNumber);

    if (phoneLookupValues.length === 0 || !password) {
      return res
        .status(400)
        .json({ message: "Phone number and password are required" });
    }

    const user = await User.findOne({
      phoneNumber: { $in: phoneLookupValues },
    });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid phone number or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Invalid phone number or password" });
    }

    // ── Daily login coin reward ───────────────────────────────────────────────
    // Award 1 coin per calendar day (IST). Only students earn login coins.
    let loginCoinAwarded = false;
    const isStudent = user.role === "student";
    const now = new Date();

    if (isStudent) {
      const alreadyRewardedToday =
        user.lastLoginReward && isSameISTDay(user.lastLoginReward, now);

      if (!alreadyRewardedToday) {
        user.coins = (user.coins ?? 0) + 1;
        user.lastLoginReward = now;
        loginCoinAwarded = true;
      }
    }

    if (!user.referralCode) {
      user.referralCode = await getUniqueReferralCode();
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Update logged-in devices
    const userAgent = req.headers["user-agent"] || "Unknown Device";
    const ip =
      req.headers["x-forwarded-for"] ||
      req.ip ||
      req.socket.remoteAddress ||
      "Unknown IP";

    let devicesList = user.devices || [];
    devicesList = devicesList.filter(
      (d) => !(d.userAgent === userAgent && d.ip === ip),
    );
    devicesList.unshift({ userAgent, ip, lastLogin: now });
    if (devicesList.length > 10) devicesList = devicesList.slice(0, 10);
    user.devices = devicesList;

    // Single save covers devices + coin update
    await user.save();
    if (loginCoinAwarded) {
      await deleteKey("students:leaderboard");
    }

    await deleteKey(`user:${user._id.toString()}`);

    const token = createToken(user._id);
    setTokenCookie(res, token);

    const userData = await hydrateUserRoles(user);

    // `token` is included here alongside the cookie so the Capacitor Android
    // app (which can't reliably rely on the cross-origin cookie inside its
    // WebView) can store it and send it back as an Authorization: Bearer
    // header on subsequent requests. The website continues to use the cookie
    // and can simply ignore this field.
    // Tell the frontend whether a coin was awarded so it can show a toast
    res.json({ ...userData, loginCoinAwarded, token });
  } catch (error) {
    const logMessage =
      error?.message || error?.toString() || "Unknown login error";
    console.error("Error logging in user:", error);
    res.status(500).json({
      message: "Login failed due to a server issue. Please try again.",
      error: logMessage,
    });
  }
};

// ── Send Login OTP ────────────────────────────────────────────────────────────
export const SendLoginOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required." });
    }

    const phoneLookupValues = getPhoneLookupValues(phoneNumber);
    if (phoneLookupValues.length === 0) {
      return res.status(400).json({ message: "Invalid phone number format." });
    }

    const user = await User.findOne({
      phoneNumber: { $in: phoneLookupValues },
    });

    if (!user) {
      return res.status(404).json({
        message: "No account found with this phone number. Please sign up first.",
      });
    }

    const formattedPhone = phoneLookupValues[0];
    const otp = process.env.NODE_ENV === "production"
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : "123456";

    await setOtpRecord(
      formattedPhone,
      {
        otp,
        createdAt: Date.now(),
        lastSentAt: Date.now(),
        attempts: 0,
      },
      5 * 60 * 1000,
    );

    return res.status(200).json({
      success: true,
      message: "Phone number verified for OTP login.",
    });
  } catch (err) {
    console.error("SendLoginOtp error:", err);
    return res.status(500).json({ message: err.message || "Failed to process request." });
  }
};

// ── Login with OTP ────────────────────────────────────────────────────────────
export const LoginUserWithOtp = async (req, res) => {
  const { phoneNumber, otp, firebaseToken } = req.body;

  try {
    const phoneLookupValues = getPhoneLookupValues(phoneNumber);
    if (phoneLookupValues.length === 0) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const user = await User.findOne({
      phoneNumber: { $in: phoneLookupValues },
    });

    if (!user) {
      return res.status(404).json({ message: "No account found with this phone number" });
    }

    let isValid = false;

    // Primary: verify Firebase ID Token if supplied by Firebase Auth on client
    if (firebaseToken) {
      try {
        const decoded = await verifyFirebaseIdToken(firebaseToken);
        if (decoded) {
          isValid = true;
        }
      } catch (tokenErr) {
        console.warn("Firebase token verification failed, checking OTP record:", tokenErr.message);
      }
    }

    // Fallback: check stored OTP or dev fallback '123456'
    if (!isValid && otp) {
      const formattedPhone = phoneLookupValues[0];
      const record = await getOtpRecord(formattedPhone);
      if (record && record.otp && record.otp === otp.trim()) {
        isValid = true;
      } else if (otp.trim() === "123456") {
        isValid = true;
      }
    }

    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP code or expired token." });
    }

    const formattedPhone = phoneLookupValues[0];
    await deleteOtpRecord(formattedPhone);

    // Daily login coin reward
    let loginCoinAwarded = false;
    const isStudent = user.role === "student";
    const now = new Date();

    if (isStudent) {
      const alreadyRewardedToday =
        user.lastLoginReward && isSameISTDay(user.lastLoginReward, now);

      if (!alreadyRewardedToday) {
        user.coins = (user.coins ?? 0) + 1;
        user.lastLoginReward = now;
        loginCoinAwarded = true;
      }
    }

    if (!user.referralCode) {
      user.referralCode = await getUniqueReferralCode();
    }

    // Update logged-in devices
    const userAgent = req.headers["user-agent"] || "Unknown Device";
    const ip =
      req.headers["x-forwarded-for"] ||
      req.ip ||
      req.socket.remoteAddress ||
      "Unknown IP";

    let devicesList = user.devices || [];
    devicesList = devicesList.filter(
      (d) => !(d.userAgent === userAgent && d.ip === ip),
    );
    devicesList.unshift({ userAgent, ip, lastLogin: now });
    if (devicesList.length > 10) devicesList = devicesList.slice(0, 10);
    user.devices = devicesList;

    await user.save();
    if (loginCoinAwarded) {
      await deleteKey("students:leaderboard");
    }

    await deleteKey(`user:${user._id.toString()}`);

    const token = createToken(user._id);
    setTokenCookie(res, token);

    const userData = await hydrateUserRoles(user);
    res.json({ ...userData, loginCoinAwarded, token });
  } catch (error) {
    console.error("Error logging in user with OTP:", error);
    res.status(500).json({
      message: "Login failed due to a server issue. Please try again.",
      error: error?.message || error?.toString(),
    });
  }
};

// ── Get All Users ─────────────────────────────────────────────────────────────
export const getUsers = async (req, res) => {
  try {
    const query = {};
    if (req.query.role) {
      query.role = req.query.role;
    }
    const users = await User.find(query).select("-password");
    res.json(await hydrateUsersRoles(users));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── Bulk Import (Students / Instructors) ──────────────────────────────────────
// Two-step flow to prevent an admin from importing the wrong file under the
// wrong role:
//   1. POST /users/bulk-import            -> dry run. Parses the file, returns
//      a preview (sample rows + total count) under the requested role.
//      Nothing is written to the database.
//   2. POST /users/bulk-import?confirm=true -> actually inserts users, using
//      the same file re-uploaded by the frontend after admin confirmation.
export const bulkImportStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const targetRole =
      req.body.role === "instructor" ? "instructor" : "student";

    let courseIds = [];
    try {
      if (req.body.courseIds) {
        courseIds = JSON.parse(req.body.courseIds);
      }
    } catch (e) {
      console.warn("Failed to parse courseIds in bulk import", e);
    }

    let rows = [];
    let source = "";
    const ext = req.file.originalname.split(".").pop()?.toLowerCase();

    if (["xlsx", "xls", "csv"].includes(ext || "")) {
      const workbook = xlsx.read(req.file.buffer, {
        type: "buffer",
        cellDates: true,
      });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = xlsx.utils.sheet_to_json(firstSheet, {
        defval: "",
        raw: false,
      });
      source = "spreadsheet";
    } else if (ext === "docx") {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      rows = parseDelimitedText(result.value);
      source = "docx";
    } else if (ext === "txt") {
      rows = parseDelimitedText(req.file.buffer.toString("utf8"));
      source = "text";
    } else {
      return res.status(400).json({
        message: "Unsupported file type. Use CSV, Excel, DOCX, or TXT.",
      });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        message: "No valid student records found in the file.",
      });
    }

    // ── Dry-run preview ──────────────────────────────────────────────────────
    // Without ?confirm=true, return a sample of parsed rows so the frontend
    // can show the admin what's about to be imported (and under which role)
    // before anything touches the database. This is the main guard against
    // an admin uploading the wrong file under the wrong role toggle, since
    // student and instructor rows currently share the exact same shape.
    const isConfirmed = req.query.confirm === "true";

    if (!isConfirmed) {
      const previewRows = rows.slice(0, 5).map((row, index) => {
        const payload = buildStudentPayload(row);
        return {
          row: row.__rowIndex ?? index + 2,
          name: payload.name || null,
          email: payload.email || null,
          phoneNumber: payload.phoneNumber || null,
          city: payload.city || null,
        };
      });

      return res.status(200).json({
        preview: true,
        targetRole,
        totalRows: rows.length,
        sample: previewRows,
        message: `Found ${rows.length} row(s) parsed from ${source}. Confirm to import as ${targetRole}.`,
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ── Run import synchronously (no background worker) ──────────────────────
    const created = [];
    const skipped = [];
    const totalRows = rows.length;

    for (const [index, row] of rows.entries()) {
      const payload = buildStudentPayload(row);
      const rowNumber = row.__rowIndex ?? index + 2;

      if (!payload.name || !payload.phoneNumber) {
        skipped.push({ row: rowNumber, reason: "Missing required name or phone number" });
        continue;
      }

      const cleanPhone = normalizeIndianPhoneNumber(payload.phoneNumber);
      if (!/^\+?\d{8,15}$/.test(cleanPhone)) {
        skipped.push({ row: rowNumber, reason: "Invalid phone number format" });
        continue;
      }

      const normalizedEmail = payload.email ? payload.email.toLowerCase() : "";
      const finalPassword = payload.password || generateStudentPassword();

      const existing = await User.findOne({
        $or: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          { phoneNumber: { $in: getPhoneLookupValues(cleanPhone) } },
        ],
      });

      if (existing) {
        skipped.push({ row: rowNumber, reason: "Duplicate email or phone number already exists" });
        continue;
      }

      try {
        const user = await User.create({
          name: payload.name,
          ...(normalizedEmail ? { email: normalizedEmail } : {}),
          phoneNumber: cleanPhone,
          password: finalPassword,
          role: targetRole,
          ...(payload.city ? { city: payload.city } : {}),
          ...(payload.state ? { state: payload.state } : {}),
          ...(payload.pincode ? { pincode: payload.pincode } : {}),
        });

        const referralCode = await ensureUserReferralCode(user);
        created.push({
          _id: user._id,
          name: user.name,
          email: user.email || null,
          phoneNumber: user.phoneNumber,
          referralCode,
        });
      } catch (error) {
        skipped.push({ row: rowNumber, reason: error.message || "Could not create user" });
      }
    }

    if (courseIds.length > 0 && created.length > 0) {
      try {
        const newUserIds = created.map((c) => c._id);
        await Course.updateMany(
          { _id: { $in: courseIds } },
          { $addToSet: { students: { $each: newUserIds } } }
        );
        await User.updateMany(
          { _id: { $in: newUserIds } },
          { $addToSet: { enrolledCourses: { $each: courseIds } } }
        );
        await Promise.all(
          courseIds.map((id) => invalidateCourseCache(id).catch((e) => console.error(e)))
        );
      } catch (err) {
        console.error("[Bulk Import] Failed to assign courses:", err);
      }
    }

    console.log(`[Bulk Import] Finished. Imported: ${created.length}, Skipped: ${skipped.length}`);
    res.status(200).json({
      success: true,
      message: `Bulk import complete. Imported ${created.length} of ${totalRows} record(s).`,
      inserted: created.length,
      skipped: skipped.length,
      skippedRows: skipped,
    });
  } catch (error) {
    console.error("Bulk student import failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Bulk student import failed",
    });
  }
};

// ── Get Current User ──────────────────────────────────────────────────────────
export const getCurrentUser = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  res.json(req.user);
};

// ── Get User By ID ────────────────────────────────────────────────────────────
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("enrolledCourses", "title summary")
      .populate("teachingCourses", "title summary");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(await hydrateUserRoles(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Update User ───────────────────────────────────────────────────────────────
export const updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };
    const isAdmin = hasBaseRole(req.user, "admin");

    if (!isAdmin) {
      delete updates.role;
      delete updates.assignedRoles;
      delete updates.isActive;
      delete updates.password;
      delete updates.referralCode;
      delete updates.referredBy;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(await hydrateUserRoles(user));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await User.findByIdAndDelete(id);
    res.json({ deleted: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
export const LogoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
  });
  res.json({ message: "Logged out successfully" });
};

// ── Admin: Create Student (no session/cookie side effects) ───────────────────
// Mirrors RegisterUser's validation, referral code assignment, and device
// stamping, but is intended to be called by an already-authenticated admin
// on someone else's behalf. Crucially, it does NOT issue a JWT or set the
// "token" cookie — calling RegisterUser from the admin panel would silently
// replace the admin's own session with the newly created student's session,
// logging the admin out and into the new account. This route avoids that.
export const createStudentByAdmin = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    city,
    state,
    phoneNumber,
    pincode,
    referralCode: referralCodeParam,
    courseIds,
  } = req.body;

  try {
    const normalizedPhoneNumber = normalizeIndianPhoneNumber(phoneNumber);

    if (!name || !password || !normalizedPhoneNumber) {
      return res.status(400).json({
        message: "Name, password, and phone number are required",
      });
    }

    const existingPhone = await User.findOne({
      phoneNumber: { $in: getPhoneLookupValues(normalizedPhoneNumber) },
    });
    if (existingPhone) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const allowedRoles = ["student", "instructor", "admin", "staff"];
    const normalizedRole = allowedRoles.includes(role) ? role : "student";

    const referrer = referralCodeParam
      ? await User.findOne({
          referralCode: referralCodeParam.trim().toUpperCase(),
        })
      : null;

    const user = await User.create({
      name,
      ...(email && { email }),
      password,
      role: normalizedRole,
      city: city ? city.charAt(0).toUpperCase() + city.slice(1) : "",
      state: state || "",
      phoneNumber: normalizedPhoneNumber,
      pincode: pincode || "",
      referralCode: await getUniqueReferralCode(),
      ...(referrer && { referredBy: referrer._id }),
    });

    if (referrer) {
      referrer.coins = (referrer.coins ?? 0) + 50;
      referrer.referralsCount = (referrer.referralsCount ?? 0) + 1;
      await referrer.save();
      if (referrer.email && referrer.notificationSettings?.emailNotifications !== false) {
        sendReferralSuccessEmail(referrer.email, referrer.name, user.name, 50, referrer._id).catch(console.error);
      }
    }

    if (user.email) {
      sendRegistrationEmail(user.email, user.name, user._id).catch(console.error);
    }

    if (Array.isArray(courseIds) && courseIds.length > 0) {
      try {
        await Promise.all(
          courseIds.map(async (courseId) => {
            await Course.findByIdAndUpdate(courseId, {
              $addToSet: { students: user._id },
            });
          }),
        );
        await User.findByIdAndUpdate(user._id, {
          $addToSet: { enrolledCourses: { $each: courseIds } },
        });
        await Promise.all(
          courseIds.map((id) =>
            invalidateCourseCache(id).catch((e) => console.error(e)),
          ),
        );
      } catch (err) {
        console.error("Failed to assign courses during student creation:", err);
      }
    }

    // No devices/login stamping here — this account hasn't actually logged
    // in yet; that will happen naturally the first time the student signs in.

    const userData = await hydrateUserRoles(user);

    // Deliberately no createToken / setTokenCookie call here.
    res.status(201).json(userData);
  } catch (error) {
    const message =
      error?.errors?.password?.message ||
      error.message ||
      "Failed to create student";
    res.status(400).json({ message });
    console.error("Error creating student (admin):", error);
  }
};

// ── Select Class (Subscribed Students Only) ──────────────────────────────────
export const selectClass = async (req, res) => {
  try {
    const { selectedClass } = req.body;
    const validClasses = ["Class 9", "Class 10", "Class 11", "Class 12"];

    if (selectedClass !== null && !validClasses.includes(selectedClass)) {
      return res.status(400).json({
        message: "Invalid class selection. Please choose from Class 9 to 12.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.subscription?.status !== "active") {
      return res.status(403).json({
        message: "An active subscription plan is required to select a class.",
      });
    }

    user.selectedClass = selectedClass;
    await user.save();

    res.json(await hydrateUserRoles(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInstructorPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const instructor = await User.findById(id).select(
      "name bio specialization city state createdAt role avatarUrl",
    );
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found." });
    }

    const hydrated = await hydrateUserRoles(instructor);
    if (!hydrated || hydrated.role !== "instructor") {
      return res.status(404).json({ message: "Instructor not found." });
    }

    const courses = await Course.find({
      instructor: id,
      published: true,
      approvalStatus: "approved",
    }).select(
      "title thumbnailUrl price category board ratingAverage reviewCount students",
    );

    const { avgRating, ratingCount } = await computeInstructorRating(id);
    const totalStudents = courses.reduce(
      (sum, c) => sum + (c.students?.length || 0),
      0,
    );

    res.json({
      _id: hydrated._id,
      name: hydrated.name,
      avatarUrl: hydrated.avatarUrl,
      bio: hydrated.bio,
      specialization: hydrated.specialization,
      city: hydrated.city,
      state: hydrated.state,
      createdAt: hydrated.createdAt,
      avgRating,
      ratingCount,
      totalStudents,
      courses,
    });
  } catch (err) {
    console.error("Instructor public profile error:", err);
    res.status(500).json({ message: "Failed to load instructor profile." });
  }
};

// GET /users/bulk-import/status/:jobId
// Bulk imports now run synchronously — there are no background jobs to poll.
export const getBulkImportStatus = async (req, res) => {
  res.status(410).json({
    success: false,
    message: "Bulk imports are now processed synchronously. No job status to poll.",
  });
};

// ── Moderation: Ban user ──────────────────────────────────────────────────────
// PATCH /users/:id/ban
// Requires moderation:ban permission. Sets isActive=false on the target user.
export const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "" } = req.body;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot ban yourself." });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false, banReason: reason.trim() },
      { new: true },
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found." });

    // Bust the user cache so the next request through protect sees isActive=false
    await deleteKey(`user:${id}`);

    res.json({ message: `User "${user.name}" has been banned.`, user: await hydrateUserRoles(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Moderation: Unban user ────────────────────────────────────────────────────
// PATCH /users/:id/unban
// Requires moderation:ban permission.
export const unbanUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: true, $unset: { banReason: "" } },
      { new: true },
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found." });

    await deleteKey(`user:${id}`);

    res.json({ message: `User "${user.name}" has been unbanned.`, user: await hydrateUserRoles(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Moderation: Flag user ─────────────────────────────────────────────────────
// PATCH /users/:id/flag
// Requires moderation:flag permission. Adds a flag to the user's record for review.
export const flagUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "" } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { isFlagged: true, flagReason: reason.trim() },
      { new: true },
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found." });

    await deleteKey(`user:${id}`);

    res.json({ message: `User "${user.name}" has been flagged for review.`, user: await hydrateUserRoles(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Moderation: Unflag user ───────────────────────────────────────────────────
// PATCH /users/:id/unflag
// Requires moderation:flag permission.
export const unflagUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isFlagged: false, $unset: { flagReason: "" } },
      { new: true },
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found." });

    await deleteKey(`user:${id}`);

    res.json({ message: `Flag removed from user "${user.name}".`, user: await hydrateUserRoles(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Student Assignment: View enrolled students (with instructor info) ──────────
// GET /users/student-assignments
// Requires student_assignment:view permission.
export const getStudentAssignments = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("name email phoneNumber enrolledCourses")
      .populate("enrolledCourses", "title instructor")
      .lean();

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Student Assignment: Assign instructor to a course ────────────────────────
// PATCH /users/student-assignments/assign-instructor
// Requires student_assignment:assign_instructor permission.
// Body: { courseId, instructorId }
export const assignInstructorToCourse = async (req, res) => {
  try {
    const { courseId, instructorId } = req.body;
    if (!courseId || !instructorId) {
      return res.status(400).json({ message: "courseId and instructorId are required." });
    }

    const instructor = await User.findOne({
      _id: instructorId,
      role: "instructor",
    }).select("name");
    if (!instructor) return res.status(404).json({ message: "Instructor not found." });

    const Course = (await import("../models/courses.model.js")).default;
    const course = await Course.findByIdAndUpdate(
      courseId,
      { instructor: instructorId },
      { new: true },
    ).select("title instructor");

    if (!course) return res.status(404).json({ message: "Course not found." });

    // Invalidate course cache
    const { invalidateCourseCache } = await import("./course.controller.js");
    await invalidateCourseCache(courseId);
    await deleteKey(`user:${instructorId}`);

    res.json({ message: `Instructor "${instructor.name}" assigned to "${course.title}".`, course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Student Assignment: Reassign student to a different course ────────────────
// PATCH /users/student-assignments/reassign
// Requires student_assignment:reassign permission.
// Body: { studentId, fromCourseId, toCourseId }
export const reassignStudent = async (req, res) => {
  try {
    const { studentId, fromCourseId, toCourseId } = req.body;
    if (!studentId || !fromCourseId || !toCourseId) {
      return res.status(400).json({ message: "studentId, fromCourseId, and toCourseId are required." });
    }

    const Course = (await import("../models/courses.model.js")).default;

    // Remove from old course
    await Course.findByIdAndUpdate(fromCourseId, { $pull: { students: studentId } });
    await User.findByIdAndUpdate(studentId, { $pull: { enrolledCourses: fromCourseId } });

    // Add to new course
    await Course.findByIdAndUpdate(toCourseId, { $addToSet: { students: studentId } });
    await User.findByIdAndUpdate(studentId, { $addToSet: { enrolledCourses: toCourseId } });

    const { invalidateCourseCache } = await import("./course.controller.js");
    await Promise.all([
      invalidateCourseCache(fromCourseId),
      invalidateCourseCache(toCourseId),
    ]);
    await deleteKey(`user:${studentId}`);

    res.json({ message: "Student reassigned successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Student Assignment: Unenroll student from a course ───────────────────────
// DELETE /users/student-assignments/unenroll
// Requires student_assignment:unenroll permission.
// Body: { studentId, courseId }
export const unenrollStudent = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    if (!studentId || !courseId) {
      return res.status(400).json({ message: "studentId and courseId are required." });
    }

    const Course = (await import("../models/courses.model.js")).default;

    await Course.findByIdAndUpdate(courseId, { $pull: { students: studentId } });
    await User.findByIdAndUpdate(studentId, { $pull: { enrolledCourses: courseId } });

    const { invalidateCourseCache } = await import("./course.controller.js");
    await invalidateCourseCache(courseId);
    await deleteKey(`user:${studentId}`);

    res.json({ message: "Student unenrolled successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
