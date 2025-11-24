import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../api/axios.js";
import { NavLink } from "react-router-dom"; // To navigate to the edit page

import PageHeader from "../components/ui/PageHeader.jsx";
import Card, { CardHeader, CardTitle, CardContent } from "../components/ui/Card.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import { PrimaryButton } from "../components/ui/Button.jsx";
import AddEmployee from "../modals/AddEmployee.jsx";

const Employees = () => {
    const { user } = useAuth();
    const role = user?.role || "employee";
    const isManagement = ["superAdmin", "admin", "hr"].includes(role);

    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [error, setError] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            setError("");
            const { data } = await api.get("/api/admin/users");
            if (data.ok) {
                const allUser = data?.users || [];
                const filteredUser = allUser.filter((u) => u?.role != "superAdmin" && u?.email !== user?.email)
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

    // If normal employee manually hits /employees
    if (!isManagement) {
        return (
            <div className="">
                <PageHeader
                    title="Employees"
                    subtitle="You do not have permission to view the employee directory."
                />
                <Card>
                    <CardContent>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Only Super Admin, Admin, and HR roles can access employee records.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className=" ">
            <PageHeader
                title="Employees"
                subtitle="All system users with their roles and status. Later you can add filters for department, joining date, etc."
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
            {showAddModal && <AddEmployee onClose={() => setShowAddModal(false)} onSuccess={() => fetchEmployees()} />}

            {loading && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    Loading employees...
                </p>
            )}

            {!loading && error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {!loading && !error && employees.length === 0 && (
                <Card className="mt-3">
                    <CardContent>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            No employees found yet. Start by adding your first employee.
                        </p>
                    </CardContent>
                </Card>
            )}

            {!loading && !error && employees.length > 0 && (
                <>
                    {/* Mobile layout: cards */}
                    <div className="space-y-3 mt-3 md:hidden">
                        {employees.map((emp) => (
                            <EmployeeCard key={emp._id} emp={emp} />
                        ))}
                    </div>

                    {/* Desktop layout: table in a Card */}
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
                                            <th className="text-right px-4 py-2 font-medium text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map((emp) => (
                                            <tr
                                                key={emp._id}
                                                className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                                            >
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <div className="font-medium text-sm">
                                                        {emp.fullName}
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
                                                <td className="px-4 py-2 text-right whitespace-nowrap">
                                                    <NavLink to={`/employee/edit/${emp._id}`} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                                        More
                                                    </NavLink>
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
        </div>
    );
};

// Helper Components

const EmployeeCard = ({ emp }) => (
    <Card>
        <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div className="font-medium text-sm">{emp.fullName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        {emp.email}
                    </div>
                </div>
                <RoleBadge role={emp.role} />
            </div>
            <div className="flex items-center justify-between">
                <StatusBadge status={emp.status} />
                <NavLink to={`/employee/edit/${emp._id}`} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    View details
                </NavLink>
            </div>
        </CardContent>
    </Card>
);

const RoleBadge = ({ role }) => {
    const label = role || "unknown";
    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 uppercase tracking-wide">
            {label}
        </span>
    );
};

export default Employees;
