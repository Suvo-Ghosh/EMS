
const Card = ({ className = "", children }) => (
    <div
        className={`bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm ${className}`}
    >
        {children}
    </div>
);

export const CardHeader = ({ children, className = "" }) => (
    <div className={`px-4 py-3 border-b border-slate-200 dark:border-slate-800 ${className}`}>
        {children}
    </div>
);

export const CardTitle = ({ children }) => (
    <h3 className="text-sm font-semibold">{children}</h3>
);

export const CardContent = ({ children, className = "" }) => (
    <div className={`px-4 py-3 ${className}`}>{children}</div>
);

export default Card;
