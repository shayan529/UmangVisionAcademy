import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "./../models/user.model.js";
import bcrypt from "bcryptjs";

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
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
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
    if (!name || !password || !city || !state || !phoneNumber || !pincode) {
      return res.status(400).json({
        message:
          "Name, password, city, state, pincode, and phone number are required",
      });
    }

    const existingPhone = await User.findOne({ phoneNumber });
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
      phoneNumber,
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

    const userData = user.toObject();
    delete userData.password;

    res.status(201).json(userData);
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
    if (!phoneNumber || !password) {
      return res
        .status(400)
        .json({ message: "Phone number and password are required" });
    }

    const user = await User.findOne({ phoneNumber });
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

    const userData = user.toObject();
    delete userData.password;

    // Tell the frontend whether a coin was awarded so it can show a toast
    res.json({ ...userData, loginCoinAwarded });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error("Error logging in user:", error);
  }
};

// ── Get All Users ─────────────────────────────────────────────────────────────
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Update User ───────────────────────────────────────────────────────────────
export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
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
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });
  res.json({ message: "Logged out successfully" });
};
