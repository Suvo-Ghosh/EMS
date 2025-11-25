import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import connectDB from "./configs/mongooseConnection.js";
import authRoutes from "./routes/authRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import { seedSuperAdmin } from "./utils/seedSuperAdmin.js";
import payrollRoutes from "./routes/payrollRoutes.js";

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
// app.use(cors({
//     origin: process.env.FRONTEND_URL || "http://localhost:5173",
//     credentials: true,
//     methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
// }));


const allowedOrigins = [
    process.env.FRONTEND_URL,       // your main frontend
    "http://localhost:5173",        // local dev
    "https://ems333.netlify.app",   // Netlify production
];

// Function to match wildcard: *.netlify.app
const netlifyRegex = /^https:\/\/.*\.netlify\.app$/;

// app.use(
//     cors({
//         origin: (origin, callback) => {
//             // No origin → allow (Postman, curl, mobile)
//             if (!origin) return callback(null, true);

//             const isAllowed =
//                 allowedOrigins.some((allowed) => origin.startsWith(allowed)) ||
//                 netlifyRegex.test(origin); // allow all Netlify preview builds

//             if (isAllowed) callback(null, true);
//             else callback(new Error("CORS blocked for: " + origin));
//         },
//         credentials: true,
//         methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
//         allowedHeaders: ["Content-Type", "Authorization"],
//     })
// );
app.use(cors());






// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminUserRoutes);
app.use("/api/payroll", payrollRoutes);

app.get("/", (req, res) => {
    res.json({ ok: true, message: "EMS + Payroll API is running" });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    await seedSuperAdmin();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer().catch((err) => {
    console.error("Failed to start server:", err.message);
});
