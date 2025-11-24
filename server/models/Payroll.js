import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true,
        },

        month: {
            type: Number, // 1-12
            required: true,
        },

        year: {
            type: Number,
            required: true,
        },

        salaryBreakdown: {
            basic: { type: Number, default: 0 },
            hra: { type: Number, default: 0 },
            allowances: { type: Number, default: 0 },
            deductions: { type: Number, default: 0 },
            ctc: { type: Number, default: 0 },
            netSalary: { type: Number, default: 0 },
        },

        paymentStatus: {
            type: String,
            enum: ["pending", "paid"],
            default: "pending",
        },
    },
    { timestamps: true }
);

export default mongoose.model("Payroll", payrollSchema);
