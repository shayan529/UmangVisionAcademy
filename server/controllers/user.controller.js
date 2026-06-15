import jwt from 'jsonwebtoken';
import User from './../models/user.model.js';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const createToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
};

// ── Register ──────────────────────────────────────────────────────────────────
export const RegisterUser = async (req, res) => {
  const { name, email, password, role, city, state, phoneNumber, pincode } = req.body;

  try {
    // Required field validation
    if (!name || !password || !city || !state || !phoneNumber || !pincode) {
      return res.status(400).json({
        message: 'Name, password, city, state, pincode, and phone number are required',
      });
    }

    // Check if phone number already exists
    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number already in use' });
    }

    // Check if email already exists (only if email is provided)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const allowedRoles = ['student', 'instructor'];
    const normalizedRole = allowedRoles.includes(role) ? role : 'student';

    const user = await User.create({
      name,
      ...(email && { email }),
      password,
      roles: [normalizedRole],
      city,
      state,
      phoneNumber,
      pincode,
    });

    // Log registration device
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const ip =
      req.headers['x-forwarded-for'] ||
      req.ip ||
      req.socket.remoteAddress ||
      'Unknown IP';
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
      'Registration failed';
    res.status(400).json({ message });
    console.error('Error registering user:', error);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const LoginUser = async (req, res) => {
  const { phoneNumber, password } = req.body;

  try {
    if (!phoneNumber || !password) {
      return res.status(400).json({ message: 'Phone number and password are required' });
    }

    // Find user by phone number
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    // Update logged-in devices
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const ip =
      req.headers['x-forwarded-for'] ||
      req.ip ||
      req.socket.remoteAddress ||
      'Unknown IP';

    let devicesList = user.devices || [];
    // Remove duplicate entry for same device
    devicesList = devicesList.filter(
      (d) => !(d.userAgent === userAgent && d.ip === ip)
    );
    devicesList.unshift({ userAgent, ip, lastLogin: new Date() });
    if (devicesList.length > 10) devicesList = devicesList.slice(0, 10);
    user.devices = devicesList;
    await user.save();

    const token = createToken(user._id);
    setTokenCookie(res, token);

    const userData = user.toObject();
    delete userData.password;

    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error('Error logging in user:', error);
  }
};

// ── Get All Users ─────────────────────────────────────────────────────────────
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── Get Current User ──────────────────────────────────────────────────────────
export const getCurrentUser = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.json(req.user);
};

// ── Get User By ID ────────────────────────────────────────────────────────────
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('enrolledCourses', 'title summary')
      .populate('teachingCourses', 'title summary');
    if (!user) return res.status(404).json({ message: 'User not found' });
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
    }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── Delete User ───────────────────────────────────────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
export const LogoutUser = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  });
  res.json({ message: 'Logged out successfully' });
};