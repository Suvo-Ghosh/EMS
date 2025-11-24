
const PageHeader = ({ title, subtitle, actions }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <div>
                <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                {subtitle && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
};

export default PageHeader;
