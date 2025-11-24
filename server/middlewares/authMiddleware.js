import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

export const authMiddleware = async (req, res, next) => {
    try {
        let token;

        const authHeader = req.headers.authorization || "";
        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else if (req.headers["x-auth-token"]) {
            token = req.headers["x-auth-token"];
        }

        if (!token) {
            return res
                .status(401)
                .json({ ok: false, message: "No token, authorization denied" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res
                .status(401)
                .json({ ok: false, message: "User not found or removed" });
        }

        if (user.status !== "active") {
            return res
                .status(403)
                .json({ ok: false, message: "User is not active" });
        }

        req.user = {
            id: user._id,
            role: user.role,
            email: user.email,
            fullName: user.fullName
        };

        next();
    } catch (err) {
        console.error("authMiddleware error:", err.message);
        return res
            .status(401)
            .json({ ok: false, message: "Token is invalid or expired" });
    }
};
