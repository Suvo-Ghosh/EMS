import mongoose from "mongoose";

const attendanceConfigSchema = new mongoose.Schema(
    {
        // you can just keep ONE doc for the company
        name: { type: String, default: "default", unique: true },

        // Office location (lat/lng of your main office)
        officeLatitude: { type: Number, required: true },
        officeLongitude: { type: Number, required: true },

        // geofence radius in meters (100–200m etc.)
        radiusMeters: { type: Number, default: 100, min: 10 },

        // Attendance rules
        fullDayMinutes: { type: Number, default: 8 * 60 },
        halfDayMinutes: { type: Number, default: 4 * 60 },

        // optional office timings if needed later
        officeStartTime: { type: String, default: "10:00" }, // HH:mm
        officeEndTime: { type: String, default: "18:00" },   // HH:mm

        //  NEW: office network IPs (public IP of office router)
        allowedOfficeIPs: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true }
);

const AttendanceConfig = mongoose.model("AttendanceConfig", attendanceConfigSchema);

export default AttendanceConfig;
