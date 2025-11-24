import bcrypt from "bcrypt";
import User from "../models/User.js";
import { ROLES } from "../configs/roles.js";
import dotenv from "dotenv";
dotenv.config();

export const seedSuperAdmin = async () => {
    const existing = await User.findOne({ role: ROLES.SUPER_ADMIN });

    if (existing) {
        console.log("Super admin already exists:", existing.email);
        return;
    }

    const {
        SUPER_ADMIN_NAME,
        SUPER_ADMIN_EMAIL,
        SUPER_ADMIN_PASSWORD
    } = process.env;

    if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
        console.warn(
            "⚠️ SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD missing in .env. Skipping super admin seeding."
        );
        return;
    }

    const hash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

    const superAdmin = await User.create({
        fullName: SUPER_ADMIN_NAME || "Super Admin",
        email: SUPER_ADMIN_EMAIL,
        password: hash,
        role: ROLES.SUPER_ADMIN,
        status: "active"
    });

    console.log("✅ Super admin created:", superAdmin.email);
};
