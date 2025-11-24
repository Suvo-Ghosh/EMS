import Employee from "../models/Employee.js";
import Payroll from "../models/Payroll.js";
import User from "../models/User.js";

// ------------------------------------------------------
// 1) CREATE PAYROLL
// ------------------------------------------------------
export const createPayroll = async (req, res) => {
    try {
        const { employeeId, month, year, amount } = req.body;

        if (!employeeId || !month || !year || !amount) {
            return res.status(400).json({
                ok: false,
                message: "All fields are required",
            });
        }

        // Check if employee exists
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({
                ok: false,
                message: "Employee not found",
            });
        }

        // Prevent duplicate salary for same month
        const exists = await Payroll.findOne({ employeeId, month, year });
        if (exists) {
            return res.status(400).json({
                ok: false,
                message: "Payroll already exists for this month",
            });
        }

        const payroll = await Payroll.create({
            employeeId,
            month,
            year,
            amount,
            status: "pending",
            paidDate: null,
        });

        res.json({
            ok: true,
            payroll,
        });
    } catch (err) {
        console.error("Payroll create error:", err);
        res.status(500).json({
            ok: false,
            message: "Server error",
        });
    }
};

// ------------------------------------------------------
// 2) GET ALL PAYROLLS
// ------------------------------------------------------
export const getAllPayrolls = async (req, res) => {
    try {
        const payrolls = await Payroll.find()
            .populate("employeeId", "fullName email employeeProfile");

        res.json({
            ok: true,
            payrolls,
        });
    } catch (err) {
        console.error("Get payroll list error:", err);
        res.status(500).json({
            ok: false,
            message: "Server error",
        });
    }
};

// ------------------------------------------------------
// 3) GET PAYROLL BY ID
// ------------------------------------------------------
export const getPayrollById = async (req, res) => {
    try {
        const payroll = await Payroll.findById(req.params.id)
            .populate("employeeId", "fullName email employeeProfile");

        if (!payroll) {
            return res.status(404).json({
                ok: false,
                message: "Payroll record not found",
            });
        }

        res.json({
            ok: true,
            payroll,
        });
    } catch (err) {
        console.error("Payroll get error:", err);
        res.status(500).json({
            ok: false,
            message: "Server error",
        });
    }
};

// ------------------------------------------------------
// 4) MARK AS PAID
// ------------------------------------------------------
export const markAsPaid = async (req, res) => {
    try {
        const payroll = await Payroll.findById(req.params.id);

        if (!payroll) {
            return res.status(404).json({
                ok: false,
                message: "Payroll not found",
            });
        }

        payroll.status = "paid";
        payroll.paidDate = new Date();

        await payroll.save();

        res.json({
            ok: true,
            payroll,
            message: "Marked as paid successfully",
        });
    } catch (err) {
        console.error("Payroll update error:", err);
        res.status(500).json({
            ok: false,
            message: "Server error",
        });
    }
};
