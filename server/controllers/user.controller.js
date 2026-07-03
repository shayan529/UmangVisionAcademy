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
  mergeBaseAndCustomRoles,
} from "../utils/userRoles.js";

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

const ensureUserReferralCode = async (user) => {
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

const normalizeIndianPhoneNumber = (value) => {
  const raw = normalizeString(value);
  const digits = raw.replace(/\D/g, "");

  if (/^\d{10}$/.test(digits)) return `+91${digits}`;
  if (/^91\d{10}$/.test(digits)) return `+${digits}`;
  if (/^\+\d{8,15}$/.test(raw.replace(/[^\d+]/g, ""))) {
    return raw.replace(/[^\d+]/g, "");
  }

  return raw;
};

const getPhoneLookupValues = (value) => {
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

const buildStudentPayload = (row) => {
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

const generateStudentPassword = () =>
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
      roles: [normalizedRole],
      city,
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
    const isStudent = user.roles?.includes("student");
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
    res.status(500).json({ error: error.message });
    console.error("Error logging in user:", error);
  }
};

// ── Get All Users ─────────────────────────────────────────────────────────────
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
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

    const created = [];
    const skipped = [];

    for (const [index, row] of rows.entries()) {
      const payload = buildStudentPayload(row);
      const rowNumber = row.__rowIndex ?? index + 2;

      if (!payload.name || !payload.phoneNumber) {
        skipped.push({
          row: rowNumber,
          reason: "Missing required name or phone number",
        });
        continue;
      }

      const cleanPhone = normalizeIndianPhoneNumber(payload.phoneNumber);
      if (!/^\+?\d{8,15}$/.test(cleanPhone)) {
        skipped.push({
          row: rowNumber,
          reason: "Invalid phone number format",
        });
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
        skipped.push({
          row: rowNumber,
          reason: "Duplicate email or phone number already exists",
        });
        continue;
      }

      try {
        const user = await User.create({
          name: payload.name,
          ...(normalizedEmail ? { email: normalizedEmail } : {}),
          phoneNumber: cleanPhone,
          password: finalPassword,
          roles: [targetRole],
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
        skipped.push({
          row: rowNumber,
          reason: error.message || "Could not create student",
        });
      }
    }

    res.status(201).json({
      message: `Imported ${created.length} ${targetRole}s from ${source}`,
      inserted: created.length,
      skipped: skipped.length,
      skippedRows: skipped,
    });
  } catch (error) {
    console.error("Bulk student import failed:", error);
    res.status(500).json({
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
      delete updates.roles;
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

// ── Delete User ───────────────────────────────────────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
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
    roles,
    assignedRoles,
    customRoleIds,
    city,
    state,
    phoneNumber,
    pincode,
    referralCode: referralCodeParam,
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

    const allowedRoles = ["student", "instructor", "admin"];
    const normalizedRole = allowedRoles.includes(role) ? role : "student";
    const finalBaseRoles =
      Array.isArray(roles) && roles.length > 0
        ? roles.filter((r) => allowedRoles.includes(r))
        : [normalizedRole];
    const finalCustomRoleIds = Array.isArray(customRoleIds)
      ? customRoleIds
      : assignedRoles || [];

    const referrer = referralCodeParam
      ? await User.findOne({
        referralCode: referralCodeParam.trim().toUpperCase(),
      })
      : null;

    const user = await User.create({
      name,
      ...(email && { email }),
      password,
      roles: mergeBaseAndCustomRoles(finalBaseRoles, finalCustomRoleIds),
      city: city || "",
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
    }

    // No devices/login stamping here — this account hasn't actually logged
    // in yet; that will happen naturally the first time the student signs in.

    const userData = await hydrateUserRoles(user, { migrate: false });

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