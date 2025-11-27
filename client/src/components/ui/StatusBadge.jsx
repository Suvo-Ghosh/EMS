const BADGE_VARIANTS = {
    status: {
        active:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
        inactive:
            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        suspended:
            "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
        paid:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
        pending:
            "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
        default:
            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
    role: {
        admin:
            "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-100",
        employee:
            "bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-100",
        default:
            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    },
};

const Badge = ({ kind, value }) => {
    const map = kind === "role" ? BADGE_VARIANTS.role : BADGE_VARIANTS.status;
    const key = value?.toLowerCase();
    const classes = map[key] || map.default;

    const isStatus = kind === "status";
    const label =
        isStatus
            ? value || "Inactive"
            : (value || "unknown").toUpperCase();

    const textClasses = isStatus
        ? "text-xs font-medium capitalize"
        : "text-[11px] font-medium uppercase tracking-wide";

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 ${textClasses} ${classes}`}
        >
            {label}
        </span>
    );
};

// Wrapper: keep existing API

const StatusBadge = ({ status }) => (
    <Badge kind="status" value={status} />
);

export const RoleBadge = ({ role }) => (
    <Badge kind="role" value={role} />
);

export default StatusBadge;
