// src/pages/Settings.jsx
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Card, {
    CardHeader,
    CardTitle,
    CardContent,
} from "../components/ui/Card.jsx";
import { useThemeSetting } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../api/axios.js";
import { Input } from "../components/ui/Input.jsx";
import { PrimaryButton, SecondaryButton } from "../components/ui/Button.jsx";
import { toast } from "sonner";
import {
    HiOutlineClock,
    HiOutlineMapPin,
    HiOutlineWifi,
} from "react-icons/hi2";

const Settings = () => {
    const { theme, setTheme } = useThemeSetting();
    const { user } = useAuth();

    const canManageAttendance =
        user && (user.role === "admin" || user.role === "superAdmin");

    const [cfg, setCfg] = useState({
        officeLatitude: "",
        officeLongitude: "",
        radiusMeters: 200,
        fullDayMinutes: 480,
        halfDayMinutes: 240,
        officeStartTime: "09:00",
        officeEndTime: "18:00",
        allowedOfficeIPsText: "",
    });

    // 🔹 Snapshot of last-saved config (to detect per-section dirty state)
    const [originalCfg, setOriginalCfg] = useState(null);

    const [cfgLoading, setCfgLoading] = useState(false);
    const [cfgSaving, setCfgSaving] = useState(false);

    // Load attendance config if admin/superAdmin
    useEffect(() => {
        if (!canManageAttendance) return;

        const fetchConfig = async () => {
            try {
                setCfgLoading(true);
                const { data } = await api.get("/api/attendance/config");
                if (data.ok && data.config) {
                    const c = data.config;

                    const hydrated = {
                        officeLatitude: c.officeLatitude ?? "",
                        officeLongitude: c.officeLongitude ?? "",
                        radiusMeters: c.radiusMeters ?? 200,
                        fullDayMinutes: c.fullDayMinutes ?? 480,
                        halfDayMinutes: c.halfDayMinutes ?? 240,
                        officeStartTime: c.officeStartTime || "09:00",
                        officeEndTime: c.officeEndTime || "18:00",
                        allowedOfficeIPsText: Array.isArray(c.allowedOfficeIPs)
                            ? c.allowedOfficeIPs.join("\n")
                            : "",
                    };

                    setCfg(hydrated);
                    setOriginalCfg(hydrated); // store snapshot for dirty comparison
                }
            } catch (err) {
                console.error("Error loading attendance config:", err);
                toast.error("Failed to load attendance settings");
            } finally {
                setCfgLoading(false);
            }
        };

        fetchConfig();
    }, [canManageAttendance]);

    const handleCfgChange = (e) => {
        const { name, value } = e.target;
        setCfg((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // small helper to normalise newline-separated IPs
    const normalizeIpsText = (txt) =>
        (txt || "")
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean)
            .join("\n");

    // 🔸 Per-section dirty checks (like _dirty in RoleAccess)
    const {
        isOverviewDirty,
        isLocationDirty,
        isNetworkDirty,
        hasAnyDirty,
    } = useMemo(() => {
        if (!originalCfg) {
            return {
                isOverviewDirty: false,
                isLocationDirty: false,
                isNetworkDirty: false,
                hasAnyDirty: false,
            };
        }

        const num = (v) =>
            v === "" || v == null ? null : Number(v);

        const isOverview =
            num(cfg.fullDayMinutes) !== num(originalCfg.fullDayMinutes) ||
            num(cfg.halfDayMinutes) !== num(originalCfg.halfDayMinutes) ||
            (cfg.officeStartTime || "") !== (originalCfg.officeStartTime || "") ||
            (cfg.officeEndTime || "") !== (originalCfg.officeEndTime || "");

        const isLocation =
            num(cfg.officeLatitude) !== num(originalCfg.officeLatitude) ||
            num(cfg.officeLongitude) !== num(originalCfg.officeLongitude) ||
            num(cfg.radiusMeters) !== num(originalCfg.radiusMeters);

        const isNetwork =
            normalizeIpsText(cfg.allowedOfficeIPsText) !==
            normalizeIpsText(originalCfg.allowedOfficeIPsText);

        return {
            isOverviewDirty: isOverview,
            isLocationDirty: isLocation,
            isNetworkDirty: isNetwork,
            hasAnyDirty: isOverview || isLocation || isNetwork,
        };
    }, [cfg, originalCfg]);

    const handleCfgSave = async (e) => {
        e.preventDefault();
        if (!canManageAttendance) return;

        try {
            setCfgSaving(true);

            // parse IPs from textarea into array
            const ips = cfg.allowedOfficeIPsText
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean);

            const payload = {
                officeLatitude:
                    cfg.officeLatitude !== "" ? Number(cfg.officeLatitude) : undefined,
                officeLongitude:
                    cfg.officeLongitude !== "" ? Number(cfg.officeLongitude) : undefined,
                radiusMeters:
                    cfg.radiusMeters !== "" ? Number(cfg.radiusMeters) : undefined,
                fullDayMinutes:
                    cfg.fullDayMinutes !== "" ? Number(cfg.fullDayMinutes) : undefined,
                halfDayMinutes:
                    cfg.halfDayMinutes !== "" ? Number(cfg.halfDayMinutes) : undefined,
                officeStartTime: cfg.officeStartTime || undefined,
                officeEndTime: cfg.officeEndTime || undefined,
                allowedOfficeIPs: ips,
            };

            const { data } = await api.put("/api/attendance/config", payload);

            if (data.ok && data.config) {
                toast.success("Attendance settings updated");

                // rebuild local state from server response & reset "dirty" flags
                const c = data.config;
                const hydrated = {
                    officeLatitude: c.officeLatitude ?? "",
                    officeLongitude: c.officeLongitude ?? "",
                    radiusMeters: c.radiusMeters ?? 200,
                    fullDayMinutes: c.fullDayMinutes ?? 480,
                    halfDayMinutes: c.halfDayMinutes ?? 240,
                    officeStartTime: c.officeStartTime || "09:00",
                    officeEndTime: c.officeEndTime || "18:00",
                    allowedOfficeIPsText: Array.isArray(c.allowedOfficeIPs)
                        ? c.allowedOfficeIPs.join("\n")
                        : "",
                };

                setCfg(hydrated);
                setOriginalCfg(hydrated); // now nothing is dirty anymore
            } else {
                toast.error(data.message || "Failed to update attendance settings");
            }
        } catch (err) {
            console.error("Error saving attendance config:", err);
            toast.error(
                err.response?.data?.message || "Failed to update attendance settings"
            );
        } finally {
            setCfgSaving(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Settings"
                subtitle="Personalize your EMS experience."
            />

            <div className="grid gap-6">
                {/* THEME SETTINGS */}
                <Card>
                    <CardHeader>
                        <CardTitle>Theme</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            Choose how the interface looks. This setting only affects your
                            device.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <ThemeOption
                                label="System"
                                description="Match OS theme"
                                value="system"
                                current={theme}
                                onChange={setTheme}
                            />
                            <ThemeOption
                                label="Light"
                                description="Always light"
                                value="light"
                                current={theme}
                                onChange={setTheme}
                            />
                            <ThemeOption
                                label="Dark"
                                description="Always dark"
                                value="dark"
                                current={theme}
                                onChange={setTheme}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* ATTENDANCE CONFIG – ONLY FOR ADMIN / SUPERADMIN */}
                {canManageAttendance && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between gap-2 mb-4">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Define how attendance is calculated and how the system verifies
                                    that employees are inside the office (via GPS & office Wi-Fi).
                                </p>
                                {hasAnyDirty && (
                                    <span className="hidden sm:inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-100 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-900">
                                        Unsaved changes
                                    </span>
                                )}
                            </div>

                            {cfgLoading ? (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Loading attendance settings…
                                </p>
                            ) : (
                                <form onSubmit={handleCfgSave} className="space-y-6">
                                    {/* SECTION: OVERVIEW & RULES */}
                                    <section className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-2 py-[2px] text-[10px] uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                                <HiOutlineClock className="h-3 w-3" />
                                                Overview & Rules
                                            </span>
                                            {isOverviewDirty && (
                                                <span className="text-[10px] rounded-full border border-red-200 dark:border-red-500 px-2 py-[2px] font-medium text-red-600 dark:text-red-600 tracking-wide">
                                                    Unsaved changes
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid gap-3 xxs:grid-cols-2 mt-1">
                                            <Input
                                                label="Full Day (minutes)"
                                                name="fullDayMinutes"
                                                type="number"
                                                min="0"
                                                value={cfg.fullDayMinutes}
                                                onChange={handleCfgChange}
                                                required
                                            />
                                            <Input
                                                label="Half Day (minutes)"
                                                name="halfDayMinutes"
                                                type="number"
                                                min="0"
                                                value={cfg.halfDayMinutes}
                                                onChange={handleCfgChange}
                                                required
                                            />
                                        </div>

                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Example: 480 minutes = 8 hours. Below full-day but above
                                            half-day will be counted as half-day. Anything lower but
                                            &gt; 0 is marked as short-day.
                                        </p>

                                        <div className="grid gap-3 xxs:grid-cols-2 border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 mt-2">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">
                                                    Office Start Time
                                                </label>
                                                <input
                                                    type="time"
                                                    name="officeStartTime"
                                                    value={cfg.officeStartTime}
                                                    onChange={handleCfgChange}
                                                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">
                                                    Office End Time
                                                </label>
                                                <input
                                                    type="time"
                                                    name="officeEndTime"
                                                    value={cfg.officeEndTime}
                                                    onChange={handleCfgChange}
                                                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                                                />
                                            </div>
                                        </div>

                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Office timings are currently informational. Later you can
                                            use them to restrict check-ins outside working hours.
                                        </p>
                                    </section>

                                    {/* SECTION: OFFICE LOCATION (GEOFENCE) */}
                                    <section className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-2 py-[2px] text-[10px] uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                                <HiOutlineMapPin className="h-3 w-3" />
                                                Office Location (Geofence)
                                            </span>
                                            {isLocationDirty && (
                                                 <span className="text-[10px] rounded-full border border-red-200 dark:border-red-500 px-2 py-[2px] font-medium text-red-600 dark:text-red-600 tracking-wide">
                                                    Unsaved changes
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid gap-3 xxs:grid-cols-3 mt-1">
                                            <Input
                                                label="Latitude"
                                                name="officeLatitude"
                                                type="number"
                                                step="0.000001"
                                                value={cfg.officeLatitude}
                                                onChange={handleCfgChange}
                                                required
                                            />
                                            <Input
                                                label="Longitude"
                                                name="officeLongitude"
                                                type="number"
                                                step="0.000001"
                                                value={cfg.officeLongitude}
                                                onChange={handleCfgChange}
                                                required
                                            />
                                            <Input
                                                label="Radius (meters)"
                                                name="radiusMeters"
                                                type="number"
                                                min="10"
                                                value={cfg.radiusMeters}
                                                onChange={handleCfgChange}
                                                required
                                            />
                                        </div>

                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Employees must be inside this radius (based on GPS) to
                                            check-in or check-out, unless their request comes from an
                                            approved office IP (see Wi-Fi section below).
                                        </p>
                                    </section>

                                    {/* SECTION: OFFICE NETWORK (IP WHITELIST) */}
                                    <section className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-2 py-[2px] text-[10px] uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                                <HiOutlineWifi className="h-3 w-3" />
                                                Office Network (Wi-Fi / IP)
                                            </span>
                                            {isNetworkDirty && (
                                                 <span className="text-[10px] rounded-full border border-red-200 dark:border-red-500 px-2 py-[2px] font-medium text-red-600 dark:text-red-600 tracking-wide">
                                                    Unsaved changes
                                                </span>
                                            )}
                                        </div>

                                        <textarea
                                            name="allowedOfficeIPsText"
                                            value={cfg.allowedOfficeIPsText}
                                            onChange={handleCfgChange}
                                            rows={3}
                                            placeholder={"103.25.40.123\n103.25.40.124"}
                                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                                        />

                                        <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                                            <li>Enter one public IP per line.</li>
                                            <li>
                                                Use the IP you see on a &quot;What is my IP&quot; site
                                                while connected to office Wi-Fi.
                                            </li>
                                            <li>
                                                If a request comes from any of these IPs, GPS can be
                                                lenient or skipped (treated as inside office network).
                                            </li>
                                        </ul>
                                    </section>

                                    {/* ACTIONS */}
                                    <div className="flex justify-end gap-2 pt-1">
                                        <SecondaryButton
                                            type="button"
                                            onClick={() => window.location.reload()}
                                            disabled={cfgSaving}
                                        >
                                            Cancel
                                        </SecondaryButton>
                                        <PrimaryButton
                                            type="submit"
                                            disabled={cfgSaving || !hasAnyDirty}
                                        >
                                            {cfgSaving ? "Saving…" : "Save Attendance Settings"}
                                        </PrimaryButton>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
};

const ThemeOption = ({ label, description, value, current, onChange }) => {
    const isSelected = current === value;

    return (
        <button
            type="button"
            onClick={() => onChange(value)}
            className={`flex-1 text-left border rounded-lg px-4 py-3 text-sm transition-colors ${isSelected
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
        >
            <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{label}</span>
                {isSelected && (
                    <span className="text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-400">
                        Selected
                    </span>
                )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
                {description}
            </p>
        </button>
    );
};

export default Settings;
