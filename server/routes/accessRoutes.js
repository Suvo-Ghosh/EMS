// server/routes/accessRoutes.js
import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import User from "../models/User.js";
import { DEFAULT_ROLE_PERMISSIONS } from "../configs/permissions.js";

const router = express.Router();

// only superAdmin can manage
router.use(authMiddleware);
router.use(roleMiddleware(["superAdmin"]));

/**
 * GET /api/access/users
 * list all users with role & permissions
 */
router.get("/users", async (_req, res) => {
    try {
        const users = await User.find()
            .select("fullName email role status permissions createdAt")
            .sort({ createdAt: -1 })
            .lean();

        res.json({ ok: true, users });
    } catch (err) {
        console.error("GET /api/access/users error:", err);
        res.status(500).json({ ok: false, message: "Server error" });
    }
});

/**
 * PATCH /api/access/users/:id
 * body: { role?, permissions?, useDefaultForRole? }
 */
router.patch("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let { role, permissions, useDefaultForRole } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }

        if (role) {
            user.role = role;
        }

        if (useDefaultForRole) {
            // clear custom permissions => will use default
            user.permissions = undefined;
        } else if (Array.isArray(permissions)) {
            user.permissions = permissions;
        }

        await user.save();

        res.json({
            ok: true,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                status: user.status,
                permissions: user.permissions ?? DEFAULT_ROLE_PERMISSIONS[user.role] ?? [],
            },
        });
    } catch (err) {
        console.error("PATCH /api/access/users/:id error:", err);
        res.status(500).json({ ok: false, message: "Server error" });
    }
});

export default router;
