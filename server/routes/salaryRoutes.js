import express from "express";
import { assignSalary, updateSalary, getSalary } from "../controllers/salaryController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { ROLES } from "../configs/roles.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();
router.post("/assign", authMiddleware, roleMiddleware([ROLES.SUPER_ADMIN, ROLES.ADMIN]), assignSalary);
router.put("/:employeeId", authMiddleware, roleMiddleware([ROLES.SUPER_ADMIN, ROLES.ADMIN]), updateSalary);
router.get("/:employeeId", authMiddleware, getSalary);
export default router;
