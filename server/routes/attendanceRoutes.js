import express from "express";
import { getAttendanceConfig, updateAttendanceConfig, checkIn, checkOut, getMyTodayAttendance, getMyMonthlySummary } from "../controllers/attendanceController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// employee endpoints
router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/my/today", getMyTodayAttendance);
router.get("/my/summary", getMyMonthlySummary);

// superAdmin-only config endpoints
router.get(
    "/config",
    roleMiddleware(["superAdmin"]),
    getAttendanceConfig
);
router.put(
    "/config",
    roleMiddleware(["superAdmin"]),
    updateAttendanceConfig
);

export default router;
