import express from "express";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../configs/roles.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

/* Helper: determine which roles current user can assign */
const getAssignableRoles = (currentRole) => {
  if (currentRole === ROLES.SUPER_ADMIN) {
    // super admin can create admin, hr, employee (not another superAdmin via API)
    return [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE];
  }
  if (currentRole === ROLES.ADMIN) {
    // admin can create hr & employee
    return [ROLES.HR, ROLES.EMPLOYEE];
  }
  if (currentRole === ROLES.HR) {
    // hr can create employees only
    return [ROLES.EMPLOYEE];
  }
  return [];
};

// All routes here require authentication
router.use(authMiddleware);

// Only superAdmin, admin, hr can access these routes
router.use(roleMiddleware([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR]));


/**
 * GET /api/admin/employees/check-code?employeeCode=HTEMP101
 * Quick availability check for employeeCode
 */
router.get("/employees/check-code", async (req, res) => {
  const { employeeCode } = req.query;

  if (!employeeCode || typeof employeeCode !== "string") {
    return res
      .status(400)
      .json({ ok: false, message: "employeeCode query param is required" });
  }

  try {
    const existing = await Employee.findOne({ employeeCode: employeeCode.trim() });
    return res.json({
      ok: true,
      exists: !!existing,
    });
  } catch (err) {
    console.error("Check employeeCode error:", err.message);
    return res
      .status(500)
      .json({ ok: false, message: "Server error while checking employeeCode" });
  }
});


/**
 * POST /api/admin/users
 * Create a new user (employee/hr/admin based on creator role)
 * Body example for creating an employee:
 * {
 *   "fullName": "Rahul Sharma",
 *   "email": "rahul@company.com",
 *   "password": "Test@12345",
 *   "role": "employee",
 *   "employeeProfile": {
 *     "employeeCode": "HTEMP101",
 *     "department": "Sales",
 *     "designation": "Sales Executive",
 *     "dateOfJoining": "2025-01-01",
 *     "employmentType": "full-time",
 *     "salary": {
 *       "ctc": 500000,
 *       "basic": 250000,
 *       "hra": 125000,
 *       "allowances": 100000,
 *       "deductions": 25000
 *     }
 *   }
 * }
 */


/**
 * POST /api/admin/users
 */
router.post(
  "/users",
  [
    body("fullName").notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .optional()
      .isString()
      .withMessage("Role must be a string"),
    body("employeeProfile")
      .optional()
      .isObject()
      .withMessage("employeeProfile, if provided, must be an object"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { fullName, email, password, role, employeeProfile } = req.body;
    const currentRole = req.user.role;

    try {
      // 1) Decide which role we are assigning
      const allowedRoles = getAssignableRoles(currentRole);
      const requestedRole = role || ROLES.EMPLOYEE;

      if (!allowedRoles.includes(requestedRole)) {
        return res.status(403).json({
          ok: false,
          message: `You are not allowed to create a user with role: ${requestedRole}`,
        });
      }

      // 2) Check email BEFORE creating anything
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res
          .status(400)
          .json({ ok: false, message: "User with this email already exists" });
      }

      // 3) If employee, also check employeeCode BEFORE creating anything
      if (requestedRole === ROLES.EMPLOYEE && employeeProfile) {
        const { employeeCode } = employeeProfile;

        if (!employeeCode) {
          return res.status(400).json({
            ok: false,
            message: "employeeProfile.employeeCode is required for employees",
          });
        }

        const existingCode = await Employee.findOne({ employeeCode });
        if (existingCode) {
          return res.status(400).json({
            ok: false,
            message: "Employee with this employeeCode already exists",
          });
        }
      }

      // 4) Now it is safe to create User
      const hash = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        fullName,
        email: email.toLowerCase(),
        password: hash,
        role: requestedRole,
        status: "active",
      });

      let employeeDoc = null;

      // 5) If we are creating an employee, create Employee record
      if (requestedRole === ROLES.EMPLOYEE && employeeProfile) {
        const {
          employeeCode,
          department,
          designation,
          dateOfJoining,
          employmentType,
          salary,
        } = employeeProfile;

        employeeDoc = await Employee.create({
          user: newUser._id,
          employeeCode,
          department,
          designation,
          dateOfJoining,
          employmentType,
          salary,
        });
      }

      // 6) Send welcome email (same as you had)
      const subject = `Welcome ${newUser.fullName || ""} - Set Your Account Password`;
      const to = newUser.email;
      const pass = password;
      const setPasswordUrl = process.env.FRONTEND_URL;
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Login to your account</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.15);">
          <tr>
            <td style="padding:20px 24px;background:#114774;color:#ffffff;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:600;">Your Employee Account is Ready</h1>
              <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">
                Please set your own secure password
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 12px;font-size:15px;color:#111827;">
                Hi ${newUser.fullName || "there"},
              </p>
              <p style="margin:0 0 12px;font-size:14px;color:#4b5563;line-height:1.6;">
                Your employee account has been created in our system using this email address:
                <strong>${newUser.email}</strong>.
              </p>
              <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.6;">
                We have set a temporary password for you. For your security, please log in
                and change it immediately using the button below.
              </p>

              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
                Temporary password:
              </p>
              <p style="margin:0 0 20px;font-size:18px;font-weight:600;letter-spacing:0.12em;color:#111827;">
                ${pass}
              </p>

              <div style="text-align:center;margin-bottom:20px;">
                <a href="${setPasswordUrl}"
                   style="display:inline-block;padding:10px 24px;background:#114774;color:#ffffff;
                          text-decoration:none;border-radius:999px;font-size:14px;font-weight:600;">
                  Set New Password
                </a>
              </div>

              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 16px;font-size:12px;color:#6b7280;word-break:break-all;">
                ${setPasswordUrl}
              </p>

              <p style="margin:0;font-size:13px;color:#6b7280;">
                If you did not expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 24px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                © ${new Date().getFullYear()} ${process.env.APP_NAME || "Hashtago"}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      await sendEmail({ to, html, subject });

      // 7) Response
      return res.status(201).json({
        ok: true,
        message: "User created successfully",
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
        },
        employee: employeeDoc
          ? {
            id: employeeDoc._id,
            employeeCode: employeeDoc.employeeCode,
            department: employeeDoc.department,
            designation: employeeDoc.designation,
            employmentType: employeeDoc.employmentType,
          }
          : null,
      });
    } catch (err) {
      console.error("Create user error:", err.message);
      return res.status(500).json({ ok: false, message: "Server error" });
    }
  }
);

/**
 * GET /api/admin/users
 * List basic user info (for admin screens)
 */
router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      ok: true,
      count: users.length,
      users
    });
  } catch (err) {
    console.error("List users error:", err.message);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});


/**
 * GET /api/admin/users/:id
 * Get single user + employee profile (if exists)
 */
router.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, message: "User not found" });
    }

    const employeeDoc = await Employee.findOne({ user: user._id });

    let employee = null;
    if (employeeDoc) {
      employee = {
        id: employeeDoc._id,
        employeeCode: employeeDoc.employeeCode,
        department: employeeDoc.department,
        designation: employeeDoc.designation,
        dateOfJoining: employeeDoc.dateOfJoining,
        employmentType: employeeDoc.employmentType,
        salary: employeeDoc.salary,
        isActive: employeeDoc.isActive,
        createdAt: employeeDoc.createdAt,
        updatedAt: employeeDoc.updatedAt
      };
    }

    return res.json({
      ok: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      employee
    });
  } catch (err) {
    console.error("Get user by id error:", err.message);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});


// PATCH /api/admin/users/:id
router.patch("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { fullName, email, role, status, employeeProfile } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    // Update user fields (name, email, role, status)
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.role = role || user.role;
    user.status = status || user.status;

    await user.save();

    // If employeeProfile is provided, update employee details
    if (employeeProfile) {
      const employee = await Employee.findOne({ user: user._id });

      if (employee) {
        // Update employee fields (salary, department, designation)
        employee.salary = employeeProfile.salary || employee.salary;
        employee.department = employeeProfile.department || employee.department;
        employee.designation = employeeProfile.designation || employee.designation;
        employee.dateOfJoining = employeeProfile.dateOfJoining || employee.dateOfJoining;
        employee.employmentType = employeeProfile.employmentType || employee.employmentType;

        await employee.save();
      }
    }

    res.json({ ok: true, message: "Employee updated successfully", user });
  } catch (err) {
    console.error("Error updating employee:", err.message);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});



export default router;
