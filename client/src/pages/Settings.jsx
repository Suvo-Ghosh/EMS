import PageHeader from "../components/ui/PageHeader.jsx";
import Card, { CardHeader, CardTitle, CardContent } from "../components/ui/Card.jsx";
import { useThemeSetting } from "../contexts/ThemeContext.jsx";

const Settings = () => {
    const { theme, setTheme } = useThemeSetting();

    return (
        <>
            <PageHeader
                title="Settings"
                subtitle="Personalize your EMS experience."
            />

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Theme</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            Choose how the interface looks. This setting only affects your device.
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
