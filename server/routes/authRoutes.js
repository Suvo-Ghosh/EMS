import express from "express";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import { ROLES } from "../configs/roles.js";
import { generateToken } from "../utils/generateToken.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { generateOtp } from "../utils/generateOtp.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

const buildUserPayload = async (userDoc) => {
  if (!userDoc) return null;

  const baseUser = {
    id: userDoc._id,
    fullName: userDoc.fullName,
    email: userDoc.email,
    role: userDoc.role,
    status: userDoc.status,
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  };

  let employee = null;

  if (userDoc.role === ROLES.EMPLOYEE) {
    employee = await Employee.findOne({ user: userDoc._id }).lean();
  }

  return {
    ...baseUser,
    employee, // null for non-employees, object for employees
  };
};

/**
 * POST /api/auth/login
 * body: { email, password }
 */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ ok: false, message: "Invalid email or password" });
      }

      if (user.status !== "active") {
        return res
          .status(403)
          .json({ ok: false, message: "User account is not active" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ ok: false, message: "Invalid email or password" });
      }

      const token = generateToken(user);
      const userPayload = await buildUserPayload(user);

      res.json({
        ok: true,
        token,
        user: userPayload,
      });
    } catch (err) {
      console.error("Login error:", err.message);
      res.status(500).json({ ok: false, message: "Server error" });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    // authMiddleware should set req.user with at least id/_id
    const userId = req.user.id || req.user._id;

    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return res
        .status(404)
        .json({ ok: false, message: "User not found" });
    }

    const userPayload = await buildUserPayload(userDoc);

    res.json({
      ok: true,
      user: userPayload,
    });
  } catch (err) {
    console.error("GET /api/auth/me error:", err.message);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});


/*
 * POST /api/auth/reset-password
 */
router.post(
  "/reset-password",
  [
    body("oldPassword").notEmpty().withMessage("Old password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  authMiddleware,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id || req.user._id;

    try {
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ ok: false, message: "User not found" });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ ok: false, message: "Old password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      user.password = hashedPassword;
      await user.save();

      res.json({
        ok: true,
        message: "Password updated successfully",
      });
    } catch (err) {
      console.error("Error resetting password:", err.message);
      res.status(500).json({ ok: false, message: "Server error" });
    }
  }
);


/**
 * POST /api/auth/login
 * body: { email, password }
 */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    // ... your existing login logic ...
  }
);

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get("/me", authMiddleware, async (req, res) => {
  res.json({
    ok: true,
    user: req.user,
  });
});



/**
 * POST /api/auth/edit-profile
 * Authenticated user can update fullName and email
 * body: { fullName, email }
 */
router.post(
  "/edit-profile",
  authMiddleware,
  [
    body("fullName").trim().notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    try {
      const userId = req.user.id || req.user._id;
      const { fullName, email } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ ok: false, message: "User not found" });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // If email is changed, ensure it's not already taken by someone else
      if (user.email !== normalizedEmail) {
        const existing = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: userId },
        });
        if (existing) {
          return res
            .status(400)
            .json({ ok: false, message: "Email is already in use" });
        }
      }

      user.fullName = fullName.trim();
      user.email = normalizedEmail;

      await user.save();

      // You can decide whether to re-issue token; for now we keep the old token
      // and just return updated user data
      return res.json({
        ok: true,
        message: "Profile updated successfully",
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (err) {
      console.error("Edit profile error:", err.message);
      return res
        .status(500)
        .json({ ok: false, message: "Server error" });
    }
  }
);





// In-memory store (use a better storage like Redis in production)
let otpStore = {};

const OTP_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes

/**
 * POST /api/auth/forgot-password
 * Request OTP for password reset
 * body: { email }
 */
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { email } = req.body;

    try {
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ ok: false, message: "User not found" });
      }

      // Generate OTP
      const otp = generateOtp();

      // Store OTP temporarily with expiration time
      otpStore[email] = { otp, expiresAt: Date.now() + OTP_EXPIRATION_TIME };

      // Send OTP to user's email
      await sendEmail({ to: email, otp });

      res.json({ ok: true, message: "OTP sent to your email" });
    } catch (err) {
      console.error("Error in forgot-password route:", err.message);
      res.status(500).json({ ok: false, message: "Server error" });
    }
  }
);

/**
 * POST /api/auth/verify-otp
 * Verify OTP for password reset
 * body: { email, otp }
 */
router.post(
  "/verify-otp",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { email, otp } = req.body;

    try {
      // Check if OTP exists for this email
      const storedOtpData = otpStore[email];
      if (!storedOtpData) {
        return res.status(400).json({ ok: false, message: "Invalid OTP request" });
      }

      // Check if OTP has expired
      if (Date.now() > storedOtpData.expiresAt) {
        delete otpStore[email]; // Clean up expired OTP
        return res.status(400).json({ ok: false, message: "OTP has expired" });
      }

      // Verify OTP
      if (storedOtpData.otp !== otp) {
        return res.status(400).json({ ok: false, message: "Invalid OTP" });
      }

      res.json({ ok: true, message: "OTP verified successfully" });
    } catch (err) {
      console.error("Error in verify-otp route:", err.message);
      res.status(500).json({ ok: false, message: "Server error" });
    }
  }
);


/**
 * POST /api/auth/reset-password-with-otp
 * Reset password using OTP
 * body: { email, otp, newPassword }
 */
router.post(
  "/reset-password-with-otp",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { email, otp, newPassword } = req.body;

    try {
      // Check if OTP exists for this email
      const storedOtpData = otpStore[email];
      if (!storedOtpData) {
        return res.status(400).json({ ok: false, message: "Invalid OTP request" });
      }

      // Check if OTP has expired
      if (Date.now() > storedOtpData.expiresAt) {
        delete otpStore[email]; // Clean up expired OTP
        return res.status(400).json({ ok: false, message: "OTP has expired" });
      }

      // Verify OTP
      if (storedOtpData.otp !== otp) {
        return res.status(400).json({ ok: false, message: "Invalid OTP" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password in DB
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ ok: false, message: "User not found" });
      }

      user.password = hashedPassword;
      await user.save();

      // Clean up OTP store
      delete otpStore[email];

      res.json({ ok: true, message: "Password reset successfully" });
    } catch (err) {
      console.error("Error in reset-password-with-otp route:", err.message);
      res.status(500).json({ ok: false, message: "Server error" });
    }
  }
);



export default router;
