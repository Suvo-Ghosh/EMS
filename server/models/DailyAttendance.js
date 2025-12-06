import mongoose from "mongoose";

const dailyAttendanceSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        date: { type: String, required: true, index: true }, // YYYY-MM-DD

        totalMinutesWorked: { type: Number, default: 0 },

        attendanceStatus: {
            type: String,
            enum: ["full-day", "half-day", "absent", "weekend", "holiday", "short-day"],
            default: "absent",
        },

        // Optional flags / metadata
        isManualOverride: { type: Boolean, default: false },
        note: { type: String },
    },
    { timestamps: true }
);

dailyAttendanceSchema.index({ user: 1, date: 1 }, { unique: true });

const DailyAttendance = mongoose.model("DailyAttendance", dailyAttendanceSchema);

export default DailyAttendance;
