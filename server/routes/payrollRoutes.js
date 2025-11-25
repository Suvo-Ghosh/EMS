import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { ROLES } from "../configs/roles.js";
import { listRuns, runPayroll, listMyPayslips, listPayslipsForRun, downloadPdfPayslips, } from "../controllers/payrollController.js";

const router = express.Router();

// every route requires login
router.use(authMiddleware);

const MANAGEMENT_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR];

// Management-only
router.get("/runs", roleMiddleware(MANAGEMENT_ROLES), listRuns);
router.post("/runs", roleMiddleware(MANAGEMENT_ROLES), runPayroll);
router.get("/runs/:runId/payslips", roleMiddleware(MANAGEMENT_ROLES), listPayslipsForRun);

// Any authenticated user - self-service
router.get("/my-payslips", listMyPayslips);
router.get("/my-payslips/:id/pdf", downloadPdfPayslips);

export default router;
