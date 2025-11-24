import mongoose from "mongoose";

const salarySchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, unique: true },
    amount: { type: Number, required: true }, // monthly salary
    effectiveFrom: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Salary", salarySchema);
