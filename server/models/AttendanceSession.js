// models/AttendanceSession.js
import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
    {
        lat: Number,
        lng: Number,
    },
    { _id: false }
);

const attendanceSessionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        // date as YYYY-MM-DD (server-local date)
        date: { type: String, required: true, index: true },

        checkInAt: { type: Date, required: true },
        checkInLocation: locationSchema,

        checkOutAt: { type: Date },
        checkOutLocation: locationSchema,

        totalMinutes: { type: Number, default: 0 },

        status: {
            type: String,
            enum: ["in-progress", "completed", "auto-closed"],
            default: "in-progress",
            index: true,
        },
    },
    { timestamps: true }
);

// ❌ OLD PARTIAL INDEX CAN STAY if you want, but it's no longer required
// attendanceSessionSchema.index(
//   { user: 1, date: 1, status: 1 },
//   { partialFilterExpression: { status: "in-progress" } }
// );

// ✅ Strong guard: only ONE session per (user, date)
attendanceSessionSchema.index({ user: 1, date: 1 }, { unique: true });

const AttendanceSession = mongoose.model(
    "AttendanceSession",
    attendanceSessionSchema
);

export default AttendanceSession;
