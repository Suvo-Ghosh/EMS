import mongoose from "mongoose";

const payrollRunSchema = new mongoose.Schema(
    {
        month: { type: Number, required: true }, // 1–12
        year: { type: Number, required: true },
        status: {
            type: String,
            enum: ["DRAFT", "PROCESSED", "LOCKED"],
            default: "PROCESSED",
        },
        summary: {
            employeeCount: { type: Number, default: 0 },
            totalNet: { type: Number, default: 0 },
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate month/year runs
payrollRunSchema.index({ month: 1, year: 1 }, { unique: true });

const PayrollRun = mongoose.model("PayrollRun", payrollRunSchema);

export default PayrollRun;
