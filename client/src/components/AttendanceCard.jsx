// src/components/AttendanceCard.jsx
import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { PrimaryButton } from "../components/ui/Button.jsx";
import { toast } from "sonner";

const AttendanceCard = () => {
    const [data, setData] = useState(null); // { date, sessions, summary }
    const [loading, setLoading] = useState(true);
    const [btnLoading, setBtnLoading] = useState(false);

    const loadToday = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/api/attendance/my/today");
            if (data.ok) setData(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load attendance");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadToday();
    }, []);

    const hasOpenSession = data?.sessions?.some((s) => s.status === "in-progress");
    const hasAnySession = Array.isArray(data?.sessions) && data.sessions.length > 0;

    // 🔐 Business rules for buttons
    const canCheckIn = !hasOpenSession && !hasAnySession; // only if NO session at all
    const canCheckOut = hasOpenSession; // only while a session is open

    /**
     * Helper: try pure IP-based check-in (no GPS)
     * Works only if backend allows IP-only for whitelisted office IPs.
     */
    const fallbackCheckInByIp = async () => {
        try {
            const res = await api.post("/api/attendance/check-in", {});
            if (res.data.ok) {
                toast.success("Checked in (office network detected)");
                await loadToday();
            } else {
                toast.error(
                    res.data.message ||
                    "Location permission is blocked. Please enable location access from your browser settings."
                );
            }
        } catch (err) {
            console.error(err);
            toast.error(
                err.response?.data?.message ||
                "Unable to check in. Please enable location permissions and try again."
            );
        }
    };

    /**
     * Helper: try pure IP-based check-out (no GPS)
     */
    const fallbackCheckOutByIp = async () => {
        try {
            const res = await api.post("/api/attendance/check-out", {});
            if (res.data.ok) {
                toast.success("Checked out (office network detected)");
                await loadToday();
            } else {
                toast.error(
                    res.data.message ||
                    "Location permission is blocked. Please enable location access from your browser settings."
                );
            }
        } catch (err) {
            console.error(err);
            toast.error(
                err.response?.data?.message ||
                "Unable to check out. Please enable location permissions and try again."
            );
        }
    };

    const handleCheckIn = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported in this browser.");
            return;
        }

        setBtnLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude, accuracy } = pos.coords;

                    const res = await api.post("/api/attendance/check-in", {
                        lat: latitude,
                        lng: longitude,
                        accuracy,
                    });

                    if (res.data.ok) {
                        toast.success("Checked in");
                        await loadToday();
                    } else {
                        toast.error(res.data.message || "Failed to check in");
                    }
                } catch (err) {
                    console.error(err);
                    toast.error(err.response?.data?.message || "Check-in failed");
                } finally {
                    setBtnLoading(false);
                }
            },
            async (err) => {
                console.error("Geo check-in error:", err);

                if (err.code === 1) {
                    // PERMISSION_DENIED – try IP-based fallback
                    toast.info(
                        "Browser blocked location. Trying office network (Wi-Fi) check instead…"
                    );
                    await fallbackCheckInByIp();
                } else if (err.code === 2) {
                    // POSITION_UNAVAILABLE
                    toast.error(
                        "Location unavailable. Please move to an open area or check your GPS."
                    );
                } else if (err.code === 3) {
                    // TIMEOUT
                    toast.error("Location request timed out. Please try again.");
                } else {
                    toast.error("Unable to get location. Please enable GPS and try again.");
                }

                setBtnLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    const handleCheckOut = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported in this browser.");
            return;
        }

        setBtnLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;

                    const res = await api.post("/api/attendance/check-out", {
                        lat: latitude,
                        lng: longitude,
                    });

                    if (res.data.ok) {
                        toast.success("Checked out");
                        await loadToday();
                    } else {
                        toast.error(res.data.message || "Failed to check out");
                    }
                } catch (err) {
                    console.error(err);
                    toast.error(err.response?.data?.message || "Check-out failed");
                } finally {
                    setBtnLoading(false);
                }
            },
            async (err) => {
                console.error("Geo check-out error:", err);

                if (err.code === 1) {
                    // PERMISSION_DENIED – try IP-based fallback
                    toast.info(
                        "Browser blocked location. Trying office network (Wi-Fi) check instead…"
                    );
                    await fallbackCheckOutByIp();
                } else if (err.code === 2) {
                    toast.error(
                        "Location unavailable. Please move to an open area or check your GPS."
                    );
                } else if (err.code === 3) {
                    toast.error("Location request timed out. Please try again.");
                } else {
                    toast.error("Unable to get location. Please enable GPS and try again.");
                }

                setBtnLoading(false);
            }
        );
    };

    if (loading) {
        return (
            <div className="rounded-lg border bg-white dark:bg-slate-950 p-4 text-sm">
                Loading today's attendance…
            </div>
        );
    }

    const summary = data?.summary;
    const totalMinutes = summary?.totalMinutesWorked || 0;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    return (
        <div className="rounded-lg border bg-white dark:bg-slate-950 p-4 text-sm space-y-2">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold">Today's Attendance</h3>
                    <p className="text-xs text-slate-500">
                        {data?.date} • Status:{" "}
                        <span className="font-medium">
                            {summary?.attendanceStatus || "Not marked"}
                        </span>
                    </p>
                    {totalMinutes > 0 && (
                        <p className="text-xs text-slate-500">
                            Worked: {hours}h {mins}m
                        </p>
                    )}

                    {/* Small hint when day is already done */}
                    {!hasOpenSession && hasAnySession && (
                        <p className="mt-1 text-[11px] text-emerald-600">
                            Today's attendance is already completed.
                        </p>
                    )}
                </div>

                <div className="flex gap-2">
                    {canCheckIn && (
                        <PrimaryButton
                            type="button"
                            disabled={btnLoading}
                            onClick={handleCheckIn}
                        >
                            {btnLoading ? "Checking in…" : "Start Day"}
                        </PrimaryButton>
                    )}
                    {canCheckOut && (
                        <PrimaryButton
                            type="button"
                            disabled={btnLoading}
                            onClick={handleCheckOut}
                        >
                            {btnLoading ? "Checking out…" : "End Day"}
                        </PrimaryButton>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceCard;
