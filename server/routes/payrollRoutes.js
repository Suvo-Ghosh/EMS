import express from "express";
import {
    createPayroll,
    getAllPayrolls,
    getPayrollById,
    markAsPaid,
} from "../controllers/payrollController.js";

const router = express.Router();

// GET all payrolls
router.get("/", getAllPayrolls);

// GET single payroll details
router.get("/:id", getPayrollById);

// CREATE payroll
router.post("/", createPayroll);

// UPDATE → Mark payroll as paid
router.put("/:id/pay", markAsPaid);

export default router;
