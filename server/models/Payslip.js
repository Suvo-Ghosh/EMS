import mongoose from "mongoose";

const payslipSchema = new mongoose.Schema(
    {
        payrollRun: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PayrollRun",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        month: { type: Number, required: true },
        year: { type: Number, required: true },

        // Snapshot of identity
        employeeCode: { type: String },
        fullName: { type: String },
        department: { type: String },
        designation: { type: String },

        // Snapshot of salary structure at that time
        salary: {
            ctc: { type: Number },
            basic: { type: Number },
            hra: { type: Number },
            allowances: { type: Number },
            deductions: { type: Number },
        },

        gross: { type: Number },  // basic + hra + allowances
        netPay: { type: Number }, // gross - deductions
    },
    {
        timestamps: true,
    }
);

// One payslip per user per month/year
payslipSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

const Payslip = mongoose.model("Payslip", payslipSchema);

export default Payslip;
