// src/components/layout/AppShell.jsx
import { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useThemeSetting } from "../../contexts/ThemeContext.jsx";

import {
    HiOutlineHome,
    HiOutlineUsers,
    HiOutlineCurrencyRupee,
    HiOutlineUserCircle,
    HiOutlineCog6Tooth,
    HiOutlineKey,
    HiDocumentCurrencyRupee,
} from "react-icons/hi2";

const navLinkBase =
    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors";
const inactiveNav =
    "text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800";
const activeNav = "bg-slate-200 dark:bg-slate-800";

const PERMISSIONS = {
    DASHBOARD_VIEW: "dashboard.view",
    PROFILE_VIEW: "profile.view",
    SETTINGS_VIEW: "settings.view",
    MYPAYSLIPS_VIEW: "mypayslips.view",
    EMPLOYEES_VIEW: "employees.view",
    PAYROLL_VIEW: "payroll.view",
    ROLE_ACCESS_MANAGE: "roles.manage",
};

const AppShell = ({ children }) => {
    const { user, logout } = useAuth();
    const { theme } = useThemeSetting();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const closeSidebar = () => setSidebarOpen(false);

    const initials = useMemo(() => {
        if (!user?.fullName) return "U";
        const parts = user.fullName.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            {/* Mobile top bar */}
            <header className="md:hidden sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur flex items-center justify-between px-4 h-14">
                <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open sidebar"
                    className="inline-flex items-center justify-center rounded-md p-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    {/* Hamburger icon */}
                    <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="flex-shrink-0">
                    <div className="size-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
                        {user?.profileImage ? (
                            <img src={user.profileImage} className="rounded-full" />
                        ) : (
                            initials
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile sliding sidebar + overlay */}
            <div
                className={`fixed inset-0 z-40 md:hidden transition pointer-events-none ${sidebarOpen ? "pointer-events-auto" : ""
                    }`}
            >
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/40 transition-opacity ${sidebarOpen ? "opacity-100" : "opacity-0"
                        }`}
                    onClick={closeSidebar}
                />

                {/* Slide-in sidebar */}
                <aside
                    className={`relative h-full w-72 max-w-[80%] flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transform transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                        }`}
                >
                    <SidebarContent
                        user={user}
                        theme={theme}
                        logout={logout}
                        onNavigate={closeSidebar}
                    />
                </aside>
            </div>

            {/* Desktop layout */}
            <div className="flex mt-0 md:mt-0 md:h-screen">
                {/* Desktop sidebar - fixed, full viewport height */}
                <aside
                    className="
            hidden md:flex
            md:fixed md:inset-y-0 md:left-0
            md:w-60 xl:w-60 md:flex-col md:h-screen
            bg-white dark:bg-slate-950
            border-r border-slate-200 dark:border-slate-800
          "
                >
                    <SidebarContent user={user} theme={theme} logout={logout} />
                </aside>

                {/* Main content area */}
                <div className="flex-1 flex flex-col min-w-0 md:ml-60 xl:ml-60 md:h-screen">
                    {/* Desktop top bar */}
                    <header className="hidden md:flex h-14 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur items-center justify-end px-6">
                        <div className="flex justify-center items-center gap-4">
                            <p>{user?.fullName.trim().split(/\s+/)[0]}</p>
                            <NavLink
                                to="/profile"
                                className="size-12 cursor-pointer rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-semibold"
                            >
                                {user?.profileImage ? (
                                    <img src={user.profileImage} className="rounded-full" />
                                ) : (
                                    initials
                                )}
                            </NavLink>
                        </div>
                    </header>

                    {/* Page content (scrollable on desktop) */}
                    <main className="flex-1 p-3 sm:p-4 overflow-y-auto no-scrollbar">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
};

const SidebarContent = ({ user, theme, logout, onNavigate }) => {
    const { hasPermission } = useAuth();
    const role = user?.role || "employee";

    // Build links from permissions – keeps UI in sync with ProtectedRoute
    const links = [];

    if (hasPermission(PERMISSIONS.DASHBOARD_VIEW)) {
        links.push({ to: "/", label: "Dashboard", icon: HiOutlineHome });
    }

    if (hasPermission(PERMISSIONS.EMPLOYEES_VIEW)) {
        links.push({ to: "/employees", label: "Employees", icon: HiOutlineUsers });
    }

    if (hasPermission(PERMISSIONS.PAYROLL_VIEW)) {
        links.push({ to: "/payroll", label: "Payroll", icon: HiOutlineCurrencyRupee });
    }

    if (role !== "superAdmin" && hasPermission(PERMISSIONS.MYPAYSLIPS_VIEW)) {
        links.push({ to: "/my-payslips", label: "My Payslips", icon: HiDocumentCurrencyRupee });
    }

    // Role & Access page: usually only superAdmin + permission
    if (role === "superAdmin" && hasPermission(PERMISSIONS.ROLE_ACCESS_MANAGE)) {
        links.push({ to: "/role-access", label: "Role & Access", icon: HiOutlineKey, });
    }

    if (hasPermission(PERMISSIONS.PROFILE_VIEW)) {
        links.push({ to: "/profile", label: "Profile", icon: HiOutlineUserCircle });
    }

    if (hasPermission(PERMISSIONS.SETTINGS_VIEW)) {
        links.push({ to: "/settings", label: "Settings", icon: HiOutlineCog6Tooth });
    }

    return (
        <>
            {/* Logo / title */}
            <div className="h-14 flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-lg truncate">EMS &amp; Payroll</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {links.map((link) => (
                    <SidebarLink
                        key={link.to}
                        to={link.to}
                        icon={link.icon}
                        label={link.label}
                        onClick={onNavigate}
                    />
                ))}
            </nav>

            {/* User info */}
            <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-xs">
                <div className="flex items-center justify-between mb-1 gap-2">
                    <div className="truncate">
                        <div className="font-medium text-sm truncate">
                            {user?.fullName || "User"}
                        </div>
                        <div className="uppercase tracking-wide text-[10px] text-slate-500 dark:text-slate-400">
                            {role || "unknown role"}
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="text-red-500 hover:text-red-400 text-xs font-medium flex-shrink-0"
                    >
                        Logout
                    </button>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Theme: {theme}
                </div>
            </div>
        </>
    );
};

const SidebarLink = ({ to, label, icon: Icon, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `${navLinkBase} ${isActive ? activeNav : inactiveNav}`
        }
    >
        {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
        <span className="truncate">{label}</span>
    </NavLink>
);

export default AppShell;
