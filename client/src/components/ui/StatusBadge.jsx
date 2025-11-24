
const variants = {
    active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    inactive:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    suspended:
        "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
    paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    pending:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
};

const StatusBadge = ({ status }) => {
    const key = status?.toLowerCase();
    const classes = variants[key] || variants.inactive;

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${classes}`}>
            {status}
        </span>
    );
};

export default StatusBadge;
