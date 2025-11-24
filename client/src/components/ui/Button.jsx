
const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none";

const variants = {
    primary:
        "bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400",
    secondary:
        "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
    ghost:
        "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
};

export const PrimaryButton = ({ className = "", ...props }) => (
    <button className={`${base} ${variants.primary} px-4 py-2 ${className}`} {...props} />
);

export const SecondaryButton = ({ className = "", ...props }) => (
    <button className={`${base} ${variants.secondary} px-4 py-2 ${className}`} {...props} />
);

export const GhostButton = ({ className = "", ...props }) => (
    <button className={`${base} ${variants.ghost} px-3 py-2 ${className}`} {...props} />
);
