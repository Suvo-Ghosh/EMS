// // controllers/attendanceController.js
// import AttendanceConfig from "../models/AttendanceConfig.js";
// import AttendanceSession from "../models/AttendanceSession.js";
// import DailyAttendance from "../models/DailyAttendance.js";

// /**
//  * Helpers
//  */

// // basic haversine distance in meters
// function distanceInMeters(lat1, lon1, lat2, lon2) {
//     const toRad = (v) => (v * Math.PI) / 180;

//     const R = 6371000; // Earth radius metres
//     const φ1 = toRad(lat1);
//     const φ2 = toRad(lat2);
//     const Δφ = toRad(lat2 - lat1);
//     const Δλ = toRad(lon2 - lon1);

//     const a =
//         Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//         Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c;
// }

// // local YYYY-MM-DD (based on server timezone)
// function getLocalDateString(date = new Date()) {
//     const d = date;
//     const yyyy = d.getFullYear();
//     const mm = String(d.getMonth() + 1).padStart(2, "0");
//     const dd = String(d.getDate()).padStart(2, "0");
//     return `${yyyy}-${mm}-${dd}`;
// }

// // Normalize IP for comparison
// function normalizeIp(ip) {
//     if (!ip) return ip;
//     if (ip.startsWith("::ffff:")) return ip.substring(7);
//     if (ip === "::1") return "127.0.0.1";
//     return ip;
// }

// // Extract client IP, respecting proxies
// function getClientIp(req) {
//     const xff = req.headers["x-forwarded-for"];
//     if (typeof xff === "string" && xff.length > 0) {
//         const ip = xff.split(",")[0].trim();
//         return normalizeIp(ip);
//     }
//     const raw =
//         req.ip ||
//         req.connection?.remoteAddress ||
//         req.socket?.remoteAddress ||
//         req.connection?.socket?.remoteAddress;
//     return normalizeIp(raw);
// }

// // ensure there is always a config
// async function getOrCreateConfig() {
//     let cfg = await AttendanceConfig.findOne({ name: "default" });
//     if (!cfg) {
//         cfg = await AttendanceConfig.create({
//             name: "default",
//             officeLatitude: 23.5204, // default
//             officeLongitude: 87.3119,
//             radiusMeters: 200,
//             fullDayMinutes: 8 * 60,
//             halfDayMinutes: 4 * 60,
//             officeStartTime: "09:00",
//             officeEndTime: "18:00",
//             allowedOfficeIPs: [],
//         });
//     }

//     // Ensure defaults exist for older docs
//     if (cfg.fullDayMinutes == null) cfg.fullDayMinutes = 8 * 60;
//     if (cfg.halfDayMinutes == null) cfg.halfDayMinutes = 4 * 60;
//     if (!Array.isArray(cfg.allowedOfficeIPs)) cfg.allowedOfficeIPs = [];
//     if (!cfg.officeStartTime) cfg.officeStartTime = "09:00";
//     if (!cfg.officeEndTime) cfg.officeEndTime = "18:00";

//     return cfg;
// }

// // recompute daily summary from all completed/auto-closed sessions
// async function recomputeDailySummary(userId, dateStr) {
//     const cfg = await getOrCreateConfig();

//     const sessions = await AttendanceSession.find({
//         user: userId,
//         date: dateStr,
//         status: { $in: ["completed", "auto-closed"] },
//     }).lean();

//     const totalMinutes =
//         sessions.reduce((sum, s) => sum + (s.totalMinutes || 0), 0) || 0;

//     let attendanceStatus = "absent";

//     if (totalMinutes >= cfg.fullDayMinutes) {
//         attendanceStatus = "full-day";
//     } else if (totalMinutes >= cfg.halfDayMinutes) {
//         attendanceStatus = "half-day";
//     } else if (totalMinutes > 0) {
//         attendanceStatus = "short-day";
//     }

//     await DailyAttendance.findOneAndUpdate(
//         { user: userId, date: dateStr },
//         {
//             user: userId,
//             date: dateStr,
//             totalMinutesWorked: totalMinutes,
//             attendanceStatus,
//         },
//         { upsert: true, new: true }
//     );
// }

// /**
//  * Admin: get/update config
//  */

// export const getAttendanceConfig = async (req, res) => {
//     try {
//         const cfg = await getOrCreateConfig();
//         res.json({ ok: true, config: cfg });
//     } catch (err) {
//         console.error("Error getAttendanceConfig:", err);
//         res.status(500).json({ ok: false, message: "Server error" });
//     }
// };

// export const updateAttendanceConfig = async (req, res) => {
//     try {
//         const {
//             officeLatitude,
//             officeLongitude,
//             radiusMeters,
//             fullDayMinutes,
//             halfDayMinutes,
//             officeStartTime,
//             officeEndTime,
//             allowedOfficeIPs,
//         } = req.body;

//         let cfg = await getOrCreateConfig();

//         if (officeLatitude != null) cfg.officeLatitude = officeLatitude;
//         if (officeLongitude != null) cfg.officeLongitude = officeLongitude;
//         if (radiusMeters != null) cfg.radiusMeters = radiusMeters;
//         if (fullDayMinutes != null) cfg.fullDayMinutes = fullDayMinutes;
//         if (halfDayMinutes != null) cfg.halfDayMinutes = halfDayMinutes;
//         if (officeStartTime != null) cfg.officeStartTime = officeStartTime;
//         if (officeEndTime != null) cfg.officeEndTime = officeEndTime;

//         // handle office IP list
//         if (allowedOfficeIPs !== undefined) {
//             let ips = allowedOfficeIPs;

//             if (typeof ips === "string") {
//                 // support comma / newline separated
//                 ips = ips
//                     .split(/[\n,]/)
//                     .map((s) => normalizeIp(s.trim()))
//                     .filter(Boolean);
//             } else if (Array.isArray(ips)) {
//                 ips = ips
//                     .map((s) => normalizeIp(String(s).trim()))
//                     .filter(Boolean);
//             } else {
//                 ips = [];
//             }

//             cfg.allowedOfficeIPs = Array.from(new Set(ips)); // unique
//         }

//         await cfg.save();
//         res.json({ ok: true, config: cfg });
//     } catch (err) {
//         console.error("Error updateAttendanceConfig:", err);
//         res.status(500).json({ ok: false, message: "Server error" });
//     }
// };

// /**
//  * Employee: check-in
//  * POST /api/attendance/check-in
//  * body: { lat, lng, accuracy? }
//  */

// export const checkIn = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         let { lat, lng, accuracy } = req.body;

//         const cfg = await getOrCreateConfig();
//         const clientIp = getClientIp(req);
//         const allowedIpsNorm = (cfg.allowedOfficeIPs || []).map(normalizeIp);
//         const isOfficeNetwork =
//             clientIp && allowedIpsNorm.includes(normalizeIp(clientIp));

//         // console log to debug in dev
//         console.log("[ATTENDANCE] checkIn IP", {
//             userId,
//             clientIp,
//             isOfficeNetwork,
//         });

//         let dist = null;
//         let effectiveRadius = cfg.radiusMeters || 200;

//         // If NOT on office IP → enforce geofence
//         if (!isOfficeNetwork) {
//             if (lat == null || lng == null) {
//                 return res.status(400).json({
//                     ok: false,
//                     message:
//                         "Location (lat/lng) is required when not on office network. Please enable GPS.",
//                 });
//             }

//             lat = Number(lat);
//             lng = Number(lng);
//             accuracy = accuracy != null ? Number(accuracy) : null;

//             dist = distanceInMeters(
//                 lat,
//                 lng,
//                 cfg.officeLatitude,
//                 cfg.officeLongitude
//             );

//             const extraTolerance =
//                 accuracy != null ? Math.min(accuracy, 100) : 50; // up to +100m
//             effectiveRadius += extraTolerance;

//             console.log("[ATTENDANCE] checkIn GEO", {
//                 lat,
//                 lng,
//                 officeLat: cfg.officeLatitude,
//                 officeLng: cfg.officeLongitude,
//                 dist: Math.round(dist),
//                 accuracy,
//                 baseRadius: cfg.radiusMeters,
//                 effectiveRadius,
//             });

//             if (dist > effectiveRadius) {
//                 const baseMsg = `You are outside office location (~${Math.round(
//                     dist
//                 )}m away).`;

//                 if (accuracy != null && accuracy > 300) {
//                     return res.status(403).json({
//                         ok: false,
//                         message:
//                             baseMsg +
//                             " Your GPS accuracy is low. Please move near an open area and try again.",
//                     });
//                 }

//                 return res.status(403).json({
//                     ok: false,
//                     message: baseMsg,
//                 });
//             }
//         } else {
//             // On office IP – lat/lng optional, no distance blocking
//             if (lat != null && lng != null) {
//                 lat = Number(lat);
//                 lng = Number(lng);
//                 accuracy = accuracy != null ? Number(accuracy) : null;
//                 dist = distanceInMeters(
//                     lat,
//                     lng,
//                     cfg.officeLatitude,
//                     cfg.officeLongitude
//                 );
//             }
//             console.log("[ATTENDANCE] checkIn on office IP; skipping geofence block", {
//                 userId,
//                 clientIp,
//                 dist:
//                     dist != null
//                         ? Math.round(dist)
//                         : "no location provided",
//             });
//         }

//         const today = getLocalDateString();

//         // Prevent multiple sessions per day
//         const existing = await AttendanceSession.findOne({
//             user: userId,
//             date: today,
//         });

//         if (existing) {
//             if (existing.status === "in-progress") {
//                 return res.status(400).json({
//                     ok: false,
//                     message:
//                         "You already have an active session for today. Please end your day instead of starting again.",
//                 });
//             }

//             if (["completed", "auto-closed"].includes(existing.status)) {
//                 return res.status(400).json({
//                     ok: false,
//                     message:
//                         "Today's attendance is already completed. You cannot start another session for this day.",
//                 });
//             }
//         }

//         const session = await AttendanceSession.create({
//             user: userId,
//             date: today,
//             checkInAt: new Date(),
//             checkInLocation:
//                 lat != null && lng != null ? { lat, lng } : undefined,
//             status: "in-progress",
//         });

//         return res.json({ ok: true, session });
//     } catch (err) {
//         if (err?.code === 11000) {
//             return res.status(400).json({
//                 ok: false,
//                 message: "Attendance for today already exists.",
//             });
//         }

//         console.error("checkIn error:", err);
//         return res.status(500).json({ ok: false, message: "Server error" });
//     }
// };

// /**
//  * Employee: check-out
//  * POST /api/attendance/check-out
//  * body: { lat, lng } (optional but recommended)
//  */

// export const checkOut = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         let { lat, lng } = req.body;

//         const cfg = await getOrCreateConfig();
//         const clientIp = getClientIp(req);
//         const allowedIpsNorm = (cfg.allowedOfficeIPs || []).map(normalizeIp);
//         const isOfficeNetwork =
//             clientIp && allowedIpsNorm.includes(normalizeIp(clientIp));

//         console.log("[ATTENDANCE] checkOut IP", {
//             userId,
//             clientIp,
//             isOfficeNetwork,
//         });

//         if (!isOfficeNetwork) {
//             if (lat == null || lng == null) {
//                 return res.status(400).json({
//                     ok: false,
//                     message:
//                         "Location (lat/lng) is required when not on office network. Please enable GPS.",
//                 });
//             }

//             lat = Number(lat);
//             lng = Number(lng);

//             const dist = distanceInMeters(
//                 lat,
//                 lng,
//                 cfg.officeLatitude,
//                 cfg.officeLongitude
//             );
//             const effectiveRadius = cfg.radiusMeters || 200;

//             console.log("[ATTENDANCE] checkOut GEO", {
//                 lat,
//                 lng,
//                 officeLat: cfg.officeLatitude,
//                 officeLng: cfg.officeLongitude,
//                 dist: Math.round(dist),
//                 radius: effectiveRadius,
//             });

//             if (dist > effectiveRadius) {
//                 return res.status(403).json({
//                     ok: false,
//                     message: `You are outside office location (~${Math.round(
//                         dist
//                     )}m away).`,
//                 });
//             }
//         } else {
//             console.log(
//                 "[ATTENDANCE] checkOut on office IP; skipping geofence block"
//             );
//         }

//         const today = getLocalDateString();

//         const session = await AttendanceSession.findOne({
//             user: userId,
//             date: today,
//             status: "in-progress",
//         });

//         if (!session) {
//             return res.status(400).json({
//                 ok: false,
//                 message: "No active session found for today.",
//             });
//         }

//         const now = new Date();
//         const diffMs = now - session.checkInAt;
//         const totalMinutes = Math.max(Math.round(diffMs / 60000), 0);

//         session.checkOutAt = now;
//         if (lat != null && lng != null) {
//             session.checkOutLocation = { lat, lng };
//         }
//         session.totalMinutes = totalMinutes;
//         session.status = "completed";

//         await session.save();

//         // recompute summary
//         await recomputeDailySummary(userId, today);

//         res.json({ ok: true, session });
//     } catch (err) {
//         console.error("checkOut error:", err);
//         res.status(500).json({ ok: false, message: "Server error" });
//     }
// };

// /**
//  * Employee: today's status
//  * GET /api/attendance/my/today
//  */
// export const getMyTodayAttendance = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         const today = getLocalDateString();

//         const sessions = await AttendanceSession.find({
//             user: userId,
//             date: today,
//         })
//             .sort({ checkInAt: 1 })
//             .lean();

//         const summary = await DailyAttendance.findOne({
//             user: userId,
//             date: today,
//         }).lean();

//         res.json({
//             ok: true,
//             date: today,
//             sessions,
//             summary,
//         });
//     } catch (err) {
//         console.error("getMyTodayAttendance error:", err);
//         res.status(500).json({ ok: false, message: "Server error" });
//     }
// };

// /**
//  * Employee: monthly summary
//  * GET /api/attendance/my/summary?year=2025&month=11
//  */
// export const getMyMonthlySummary = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         let { year, month } = req.query;

//         const now = new Date();
//         year = Number(year) || now.getFullYear();
//         month = Number(month) || now.getMonth() + 1;

//         const prefix = `${year}-${String(month).padStart(2, "0")}`;

//         const days = await DailyAttendance.find({
//             user: userId,
//             date: { $regex: `^${prefix}` },
//         })
//             .sort({ date: 1 })
//             .lean();

//         res.json({ ok: true, year, month, days });
//     } catch (err) {
//         console.error("getMyMonthlySummary error:", err);
//         res.status(500).json({ ok: false, message: "Server error" });
//     }
// };



// controllers/attendanceController.js
import AttendanceConfig from "../models/AttendanceConfig.js";
import AttendanceSession from "../models/AttendanceSession.js";
import DailyAttendance from "../models/DailyAttendance.js";

/**
 * Helpers
 */

// basic haversine distance in meters
function distanceInMeters(lat1, lon1, lat2, lon2) {
    const toRad = (v) => (v * Math.PI) / 180;

    const R = 6371000; // Earth radius metres
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// local YYYY-MM-DD (based on server timezone)
function getLocalDateString(date = new Date()) {
    const d = date;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// ensure there is always a config
async function getOrCreateConfig() {
    let cfg = await AttendanceConfig.findOne({ name: "default" });
    if (!cfg) {
        cfg = await AttendanceConfig.create({
            name: "default",
            officeLatitude: 23.5204, // TODO: set your office lat
            officeLongitude: 87.3119, // TODO: set your office lng
            radiusMeters: 200,
            fullDayMinutes: 480,
            halfDayMinutes: 240,
            officeStartTime: "09:00",
            officeEndTime: "18:00",
            allowedOfficeIPs: [],       // e.g. ["203.0.113.10"]
            allowedOfficeSubnets: [],   // e.g. ["192.168.1.0/24"]
        });
    }

    // backfill defaults for older docs
    if (cfg.fullDayMinutes == null) cfg.fullDayMinutes = 480;
    if (cfg.halfDayMinutes == null) cfg.halfDayMinutes = 240;
    if (!Array.isArray(cfg.allowedOfficeIPs)) cfg.allowedOfficeIPs = [];
    if (!Array.isArray(cfg.allowedOfficeSubnets)) cfg.allowedOfficeSubnets = [];
    if (!cfg.officeStartTime) cfg.officeStartTime = "09:00";
    if (!cfg.officeEndTime) cfg.officeEndTime = "18:00";

    return cfg;
}

// Extract client IP, preferring X-Forwarded-For when behind proxies
function getClientIp(req) {
    const xf = req.headers["x-forwarded-for"];
    if (xf) {
        const parts = xf
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);
        if (parts.length > 0) {
            let ip = parts[0].replace(/^::ffff:/, "");
            if (ip === "::1") ip = "127.0.0.1"; // normalize IPv6 localhost
            return ip;
        }
    }

    const raw =
        req.ip ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.connection?.socket?.remoteAddress ||
        "";

    let ip = String(raw).replace(/^::ffff:/, "");
    if (ip === "::1") ip = "127.0.0.1"; // normalize IPv6 localhost
    return ip;
}

// simple subnet check for "192.168.1.0/24"
function isIpInSubnet(ip, cidr) {
    try {
        const [subnet, maskBitsStr] = cidr.split("/");
        const maskBits = parseInt(maskBitsStr, 10);
        if (!subnet || Number.isNaN(maskBits)) return false;

        const ipBytes = ip.split(".").map(Number);
        const subnetBytes = subnet.split(".").map(Number);
        if (
            ipBytes.length !== 4 ||
            subnetBytes.length !== 4 ||
            ipBytes.some((b) => Number.isNaN(b)) ||
            subnetBytes.some((b) => Number.isNaN(b))
        ) {
            return false;
        }

        const ipNum =
            (ipBytes[0] << 24) |
            (ipBytes[1] << 16) |
            (ipBytes[2] << 8) |
            ipBytes[3];
        const subnetNum =
            (subnetBytes[0] << 24) |
            (subnetBytes[1] << 16) |
            (subnetBytes[2] << 8) |
            subnetBytes[3];

        const mask = maskBits === 0 ? 0 : ~((1 << (32 - maskBits)) - 1);

        return (ipNum & mask) === (subnetNum & mask);
    } catch {
        return false;
    }
}

function isOfficeIpOrSubnet(clientIp, cfg) {
    if (!clientIp) return false;

    // Treat localhost as office *only in development*
    if (clientIp === "127.0.0.1" && process.env.NODE_ENV !== "production") {
        return true;
    }

    const ips = cfg.allowedOfficeIPs || [];
    const subnets = cfg.allowedOfficeSubnets || [];

    if (ips.includes(clientIp)) return true;

    for (const cidr of subnets) {
        if (isIpInSubnet(clientIp, cidr)) return true;
    }

    return false;
}


// recompute daily summary from all completed/auto-closed sessions
async function recomputeDailySummary(userId, dateStr) {
    const cfg = await getOrCreateConfig();

    const sessions = await AttendanceSession.find({
        user: userId,
        date: dateStr,
        status: { $in: ["completed", "auto-closed"] },
    }).lean();

    const totalMinutes =
        sessions.reduce((sum, s) => sum + (s.totalMinutes || 0), 0) || 0;

    let attendanceStatus = "absent";

    if (totalMinutes >= cfg.fullDayMinutes) {
        attendanceStatus = "full-day";
    } else if (totalMinutes >= cfg.halfDayMinutes) {
        attendanceStatus = "half-day";
    } else if (totalMinutes > 0) {
        attendanceStatus = "short-day";
    }

    await DailyAttendance.findOneAndUpdate(
        { user: userId, date: dateStr },
        {
            user: userId,
            date: dateStr,
            totalMinutesWorked: totalMinutes,
            attendanceStatus,
        },
        { upsert: true, new: true }
    );
}

/**
 * Admin: get/update config
 */

export const getAttendanceConfig = async (req, res) => {
    try {
        const cfg = await getOrCreateConfig();
        res.json({ ok: true, config: cfg });
    } catch (err) {
        console.error("Error getAttendanceConfig:", err);
        res.status(500).json({ ok: false, message: "Server error" });
    }
};

export const updateAttendanceConfig = async (req, res) => {
    try {
        const {
            officeLatitude,
            officeLongitude,
            radiusMeters,
            fullDayMinutes,
            halfDayMinutes,
            officeStartTime,
            officeEndTime,
            allowedOfficeIPs,
            allowedOfficeSubnets,
        } = req.body;

        let cfg = await getOrCreateConfig();

        if (officeLatitude != null) cfg.officeLatitude = officeLatitude;
        if (officeLongitude != null) cfg.officeLongitude = officeLongitude;
        if (radiusMeters != null) cfg.radiusMeters = radiusMeters;
        if (fullDayMinutes != null) cfg.fullDayMinutes = fullDayMinutes;
        if (halfDayMinutes != null) cfg.halfDayMinutes = halfDayMinutes;
        if (officeStartTime != null) cfg.officeStartTime = officeStartTime;
        if (officeEndTime != null) cfg.officeEndTime = officeEndTime;

        if (Array.isArray(allowedOfficeIPs)) {
            cfg.allowedOfficeIPs = allowedOfficeIPs;
        }
        if (Array.isArray(allowedOfficeSubnets)) {
            cfg.allowedOfficeSubnets = allowedOfficeSubnets;
        }

        await cfg.save();
        res.json({ ok: true, config: cfg });
    } catch (err) {
        console.error("Error updateAttendanceConfig:", err);
        res.status(500).json({ ok: false, message: "Server error" });
    }
};

/**
 * Employee: check-in
 * POST /api/attendance/check-in
 * body: { lat, lng, accuracy? }
 */
export const checkIn = async (req, res) => {
    try {
        const userId = req.user.id;
        let { lat, lng, accuracy } = req.body;

        const cfg = await getOrCreateConfig();

        // 1) Detect client IP and see if it's an office network
        const clientIp = getClientIp(req);
        const isOfficeNetwork = isOfficeIpOrSubnet(clientIp, cfg);

        console.log("[ATTENDANCE] checkIn IP", {
            userId,
            clientIp,
            isOfficeNetwork,
        });

        const today = getLocalDateString();

        // prevent multiple sessions per day (any status)
        const existing = await AttendanceSession.findOne({
            user: userId,
            date: today,
        });

        if (existing) {
            if (existing.status === "in-progress") {
                return res.status(400).json({
                    ok: false,
                    message:
                        "You already have an active session for today. Please end your day instead of starting again.",
                });
            }

            if (["completed", "auto-closed"].includes(existing.status)) {
                return res.status(400).json({
                    ok: false,
                    message:
                        "Today's attendance is already completed. You cannot start another session for this day.",
                });
            }
        }

        // common base data
        const baseSessionData = {
            user: userId,
            date: today,
            checkInAt: new Date(),
            status: "in-progress",
        };

        /**
         * ✅ CASE 1: On office network (IP whitelisted / localhost)
         * 👉 Trust the network. Do NOT block by distance.
         */
        if (isOfficeNetwork) {
            const sessionData = { ...baseSessionData };

            if (lat != null && lng != null) {
                sessionData.checkInLocation = {
                    lat: Number(lat),
                    lng: Number(lng),
                };
            }

            const session = await AttendanceSession.create(sessionData);

            return res.json({
                ok: true,
                session,
                mode: "ip-or-office",
            });
        }

        /**
         * ✅ CASE 2: NOT on office network → require GPS + geofence
         */
        if (lat == null || lng == null) {
            return res.status(400).json({
                ok: false,
                message:
                    "Location (lat/lng) is required for check-in when not on office network.",
            });
        }

        // ensure numbers
        lat = Number(lat);
        lng = Number(lng);
        accuracy = accuracy != null ? Number(accuracy) : null;

        const dist = distanceInMeters(
            lat,
            lng,
            cfg.officeLatitude,
            cfg.officeLongitude
        );

        // extra tolerance based on reported accuracy (capped)
        const extraTolerance = accuracy != null ? Math.min(accuracy, 100) : 50; // up to +100m
        const effectiveRadius = (cfg.radiusMeters || 200) + extraTolerance;

        console.log("[ATTENDANCE] checkIn GEO", {
            userId,
            lat,
            lng,
            officeLat: cfg.officeLatitude,
            officeLng: cfg.officeLongitude,
            dist: Math.round(dist),
            accuracy,
            radius: cfg.radiusMeters,
            effectiveRadius,
        });

        if (dist > effectiveRadius) {
            const baseMsg = `You are outside office location (~${Math.round(
                dist
            )}m away).`;

            if (accuracy != null && accuracy > 300) {
                return res.status(403).json({
                    ok: false,
                    message:
                        baseMsg +
                        " Your GPS accuracy is low. Please move near an open area or window and try again.",
                });
            }

            return res.status(403).json({
                ok: false,
                message: baseMsg,
            });
        }

        const session = await AttendanceSession.create({
            ...baseSessionData,
            checkInLocation: { lat, lng },
        });

        return res.json({ ok: true, session, mode: "geo" });
    } catch (err) {
        if (err?.code === 11000) {
            return res.status(400).json({
                ok: false,
                message: "Attendance for today already exists.",
            });
        }

        console.error("checkIn error:", err);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
};

/**
 * Employee: check-out
 * POST /api/attendance/check-out
 * body: { lat, lng } (optional)
 */
export const checkOut = async (req, res) => {
    try {
        const userId = req.user.id;
        const { lat, lng } = req.body;

        const today = getLocalDateString();

        const session = await AttendanceSession.findOne({
            user: userId,
            date: today,
            status: "in-progress",
        });

        if (!session) {
            return res.status(400).json({
                ok: false,
                message: "No active session found for today.",
            });
        }

        const now = new Date();
        const diffMs = now - session.checkInAt;
        const totalMinutes = Math.max(Math.round(diffMs / 60000), 0);

        session.checkOutAt = now;
        if (lat != null && lng != null) {
            session.checkOutLocation = { lat, lng };
        }
        session.totalMinutes = totalMinutes;
        session.status = "completed";

        await session.save();

        // recompute summary
        await recomputeDailySummary(userId, today);

        res.json({ ok: true, session });
    } catch (err) {
        console.error("checkOut error:", err);
        res.status(500).json({ ok: false, message: "Server error" });
    }
};

/**
 * Employee: today's status
 * GET /api/attendance/my/today
 */
export const getMyTodayAttendance = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = getLocalDateString();

        const sessions = await AttendanceSession.find({
            user: userId,
            date: today,
        })
            .sort({ checkInAt: 1 })
            .lean();

        const summary = await DailyAttendance.findOne({
            user: userId,
            date: today,
        }).lean();

        res.json({
            ok: true,
            date: today,
            sessions,
            summary,
        });
    } catch (err) {
        console.error("getMyTodayAttendance error:", err);
        res.status(500).json({ ok: false, message: "Server error" });
    }
};

/**
 * Employee: monthly summary
 * GET /api/attendance/my/summary?year=2025&month=11
 */
export const getMyMonthlySummary = async (req, res) => {
    try {
        const userId = req.user.id;
        let { year, month } = req.query;

        const now = new Date();
        year = Number(year) || now.getFullYear();
        month = Number(month) || now.getMonth() + 1;

        const prefix = `${year}-${String(month).padStart(2, "0")}`;

        const days = await DailyAttendance.find({
            user: userId,
            date: { $regex: `^${prefix}` },
        })
            .sort({ date: 1 })
            .lean();

        res.json({ ok: true, year, month, days });
    } catch (err) {
        console.error("getMyMonthlySummary error:", err);
        res.status(500).json({ ok: false, message: "Server error" });
    }
};
