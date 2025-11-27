import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../api/axios.js";
import { NavLink, useNavigate } from "react-router-dom";

import PageHeader from "../components/ui/PageHeader.jsx";
import Card, { CardHeader, CardTitle, CardContent } from "../components/ui/Card.jsx";
import StatusBadge, { RoleBadge } from "../components/ui/StatusBadge.jsx";
import { PrimaryButton } from "../components/ui/Button.jsx";
import AddEmployee from "../modals/AddEmployee.jsx";
import { LuRefreshCw } from "react-icons/lu";

const Employees = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const role = user?.role || "employee";
    const isManagement = ["superAdmin", "admin"].includes(role);

    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [error, setError] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            setError("");
            const { data } = await api.get("/api/admin/users");
            if (data.ok) {
                const allUser = data?.users || [];
                const filteredUser = allUser.filter(
                    (u) => u?.role !== "superAdmin" && u?.email !== user?.email
                );
                setEmployees(filteredUser || []);
            } else {
                setError(data.message || "Failed to load employees.");
            }
        } catch (err) {
            console.error("Error fetching employees:", err);
            setError(err.response?.data?.message || "Failed to load employees.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isManagement) {
            setLoading(false);
            return;
        }
        fetchEmployees();
    }, [isManagement]);

    if (!isManagement) {
        return (
            <div>
                <PageHeader
                    title="Employees"
                    subtitle="You do not have permission to view the employee directory."
                />
                <Card>
                    <CardContent>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Only Super Admin and Admin roles can access employee records.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ===== Derived data =====
    const sortedEmployees = useMemo(() => {
        if (!employees?.length) return [];
        return [...employees].sort((a, b) =>
            (a.fullName || "").localeCompare(b.fullName || "")
        );
    }, [employees]);

    const roleOptions = useMemo(() => {
        const set = new Set();
        employees.forEach((e) => e.role && set.add(e.role));
        return Array.from(set);
    }, [employees]);

    const statusOptions = useMemo(() => {
        const set = new Set();
        employees.forEach((e) => e.status && set.add(e.status));
        return Array.from(set);
    }, [employees]);

    const filteredEmployees = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return sortedEmployees.filter((emp) => {
            const name = (emp.fullName || "").toLowerCase();
            const email = (emp.email || "").toLowerCase();
            const r = (emp.role || "").toLowerCase();
            const s = (emp.status || "").toLowerCase();

            const matchesSearch =
                !search || name.includes(search) || email.includes(search);

            const matchesRole =
                roleFilter === "ALL" || r === roleFilter.toLowerCase();

            const matchesStatus =
                statusFilter === "ALL" || s === statusFilter.toLowerCase();

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [sortedEmployees, searchTerm, roleFilter, statusFilter]);

    const totalEmployees = employees.length;
    const activeEmployees = useMemo(
        () =>
            employees.filter(
                (e) => (e.status || "").toLowerCase() === "active"
            ).length,
        [employees]
    );
    const adminCount = useMemo(
        () => employees.filter((e) => e.role === "admin").length,
        [employees]
    );

    return (
        <div>
            <PageHeader
                title="Employees"
                subtitle="All system users with their roles and status."
                actions={
                    <PrimaryButton
                        type="button"
                        onClick={() => {
                            setShowAddModal(true);
                        }}
                    >
                        + Add Employee
                    </PrimaryButton>
                }
            />

            {showAddModal && (
                <AddEmployee
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => fetchEmployees()}
                />
            )}

            {/* Quick stats */}
            <div className="mb-4 grid gap-1 sm:gap-4 grid-cols-3">
                <Card>
                    <CardContent className="py-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Total employees
                        </p>
                        <p className="text-lg font-semibold">{totalEmployees}</p>
                        <p className="hidden sm:block mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            All users in your EMS system.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="py-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Active employees
                        </p>
                        <p className="text-lg font-semibold">{activeEmployees}</p>
                        <p className="hidden sm:block mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            Based on the current employee status.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="py-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Admin
                        </p>
                        <p className="text-lg font-semibold">{adminCount}</p>
                        <p className="hidden sm:block mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            Users who manage the system.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Only show this big loader when there are no employees yet (initial load) */}
            {loading && employees.length === 0 && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    Loading employees...
                </p>
            )}

            {!loading && error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {!loading && !error && employees.length === 0 && (
                <Card className="mt-3">
                    <CardContent className="text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                            No employees found yet.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            Start by adding your first employee record.
                        </p>
                        <PrimaryButton
                            type="button"
                            onClick={() => setShowAddModal(true)}
                        >
                            + Add Employee
                        </PrimaryButton>
                    </CardContent>
                </Card>
            )}

            {/* 👉 From here down, we do NOT check !loading, so UI stays visible during refresh */}
            {!error && employees.length > 0 && (
                <>
                    {/* Filters */}
                    <Card className="mt-3">
                        <CardContent className="space-y-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Search by name or email, and narrow down by role or status.
                            </p>

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                <div className="w-full sm:w-1/2">
                                    <input
                                        type="text"
                                        placeholder="Search name / email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                    />
                                </div>

                                <div className="flex w-full sm:w-1/2 gap-2">
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                        className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                    >
                                        <option value="ALL">All roles</option>
                                        {roleOptions.map((r) => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                    >
                                        <option value="ALL">All status</option>
                                        {statusOptions.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        type="button"
                                        title="Refresh"
                                        onClick={fetchEmployees}
                                        disabled={loading}
                                        aria-label="Refresh employees"
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <LuRefreshCw
                                            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {filteredEmployees.length === 0 && (
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                            No employees match your filters. Try changing the search text,
                            role, or status.
                        </p>
                    )}

                    {filteredEmployees.length > 0 && (
                        <>
                            {/* Mobile layout: cards */}
                            <div className="space-y-3 mt-3 md:hidden">
                                {filteredEmployees.map((emp) => (
                                    <EmployeeCard key={emp._id} emp={emp} />
                                ))}
                            </div>

                            {/* Desktop layout: table */}
                            <Card className="hidden md:block mt-4">
                                <CardHeader>
                                    <CardTitle>Employee Directory</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                                                    <th className="text-left px-4 py-2 font-medium text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                        Name
                                                    </th>
                                                    <th className="text-left px-4 py-2 font-medium text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                        Email
                                                    </th>
                                                    <th className="text-left px-4 py-2 font-medium text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                        Role
                                                    </th>
                                                    <th className="text-left px-4 py-2 font-medium text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredEmployees.map((emp) => (

                                                    <tr
                                                        key={emp._id}
                                                        onClick={() => navigate(`/employee/edit/${emp._id}`)}
                                                        className="cursor-pointer border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                                                    >

                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                {/* <AvatarCircle name={emp.fullName} /> */}
                                                                <div className="flex-shrink-0">
                                                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
                                                                        {
                                                                            emp?.profileImage
                                                                                ? <img src={emp?.profileImage} className="rounded-full" />
                                                                                : <AvatarCircle name={emp.fullName} />
                                                                        }
                                                                    </div>
                                                                </div>
                                                                <div className="font-medium text-sm">
                                                                    {emp.fullName}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                                                            {emp.email}
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            <RoleBadge role={emp.role} />
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            <StatusBadge status={emp.status} />
                                                        </td>
                                                    </tr>

                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

// Helpers
const AvatarCircle = ({ name }) => {
    const initials = (name || "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join("");

    return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-slate-100 dark:bg-blue-600">
            {initials || "U"}
        </div>
    );
};

const EmployeeCard = ({ emp }) => (
    <Card>
        <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    {/* <AvatarCircle name={emp.fullName} /> */}
                    <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
                            {
                                emp?.profileImage
                                    ? <img src={emp?.profileImage} className="rounded-full" />
                                    : <AvatarCircle name={emp.fullName} />
                            }
                        </div>
                    </div>
                    <div>
                        <div className="font-medium text-sm">{emp.fullName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            {emp.email}
                        </div>
                    </div>
                </div>
                <RoleBadge role={emp.role} />
            </div>
            <div className="flex items-center justify-between">
                <StatusBadge status={emp.status} />
                <NavLink
                    to={`/employee/edit/${emp._id}`}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                    View details
                </NavLink>
            </div>
        </CardContent>
    </Card>
);

export default Employees;
