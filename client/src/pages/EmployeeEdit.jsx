import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../api/axios.js";
import { Input } from "../components/ui/Input.jsx";
import { PrimaryButton, SecondaryButton } from "../components/ui/Button.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Card, { CardContent } from "../components/ui/Card.jsx";
import StatusBadge, { RoleBadge } from "../components/ui/StatusBadge.jsx";
import { toast } from "sonner";

// Utility to format dates as 'yyyy-MM-dd'
const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
};

const EmployeeEdit = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        role: "employee",
        status: "active",
        employeeProfile: {
            dateOfJoining: "",
            employeeCode: "",
            employmentType: "full-time",
            salary: {
                ctc: 0,
                basic: 0,
                hra: 0,
                allowances: 0,
                deductions: 0,
            },
            department: "it",
            designation: "",
        },
    });

    const isSuperAdmin = user?.role === "superAdmin";

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                setLoading(true);
                const { data } = await api.get(`/api/admin/users/${id}`);
                if (data.ok) {
                    setEmployee(data.user);

                    setForm({
                        fullName: data.user.fullName,
                        email: data.user.email,
                        role: data.user.role,
                        status: data.user.status,
                        employeeProfile: {
                            employeeCode: data.employee?.employeeCode || "",
                            dateOfJoining: formatDate(data.employee?.dateOfJoining),
                            employmentType: data.employee?.employmentType || "full-time",
                            salary: {
                                ctc: data.employee?.salary?.ctc || 0,
                                basic: data.employee?.salary?.basic || 0,
                                hra: data.employee?.salary?.hra || 0,
                                allowances: data.employee?.salary?.allowances || 0,
                                deductions: data.employee?.salary?.deductions || 0,
                            },
                            department: data.employee?.department || "it",
                            designation: data.employee?.designation || "",
                        },
                    });
                } else {
                    setError(data.message || "Failed to fetch employee details.");
                }
            } catch (err) {
                console.error("Error fetching employee:", err);
                setError("Failed to load employee data.");
            } finally {
                setLoading(false);
            }
        };

        fetchEmployee();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith("employeeProfile.salary.")) {
            setForm((prevForm) => ({
                ...prevForm,
                employeeProfile: {
                    ...prevForm.employeeProfile,
                    salary: {
                        ...prevForm.employeeProfile.salary,
                        [name.split(".")[2]]: value,
                    },
                },
            }));
        } else if (name.startsWith("employeeProfile.")) {
            const field = name.split(".")[1];
            setForm((prevForm) => ({
                ...prevForm,
                employeeProfile: {
                    ...prevForm.employeeProfile,
                    [field]: value,
                },
            }));
        } else {
            setForm((prevForm) => ({
                ...prevForm,
                [name]: value,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            const { data } = await api.patch(`/api/admin/users/${id}`, {
                ...form,
                employeeProfile: form.employeeProfile,
            });

            if (data.ok) {
                toast.success("Employee updated successfully!");
                navigate("/employees");
            } else {
                toast.error(data.message || "Failed to update employee.");
                setError(data.message || "Failed to update employee.");
            }
        } catch (err) {
            console.error("Error updating employee:", err);
            toast.error("Something went wrong. Please try again.");
            setError("Something went wrong. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const initials = useMemo(() => {
        const name = form.fullName || "";
        return name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((n) => n[0]?.toUpperCase())
            .join("");
    }, [form.fullName]);

    const salary = form.employeeProfile.salary || {};
    const earnings = useMemo(() => {
        const basic = Number(salary.basic || 0);
        const hra = Number(salary.hra || 0);
        const allowances = Number(salary.allowances || 0);
        return basic + hra + allowances;
    }, [salary.basic, salary.hra, salary.allowances]);

    if (loading && !employee) {
        return (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500 dark:text-slate-300">
                Loading employee details…
            </div>
        );
    }

    return (
        <div className="">
            <PageHeader
                title={form.fullName || "Employee details"}
                subtitle={form.email || "View and update employee information."}
                actions={
                    <SecondaryButton type="button" onClick={() => navigate("/employees")}>
                        Back to list
                    </SecondaryButton>
                }
            />

            {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                    {error}
                </div>
            )}

            {/* Summary card */}
            <Card className="mb-5">
                <CardContent className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {/* <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                            {initials || "U"}
                        </div> */}
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
                                {
                                    employee?.profileImage
                                        ? <img src={employee?.profileImage} className="rounded-full" />
                                        : initials || "U"
                                }
                            </div>
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                                    {form.fullName || "Unnamed employee"}
                                </h2>
                                <RoleBadge role={form.role} />
                                <StatusBadge status={form.status} />
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Emp Code:{" "}
                                <span className="font-medium">
                                    {form.employeeProfile.employeeCode || "Not assigned"}
                                </span>{" "}
                                | Department:{" "}
                                <span className="font-medium">
                                    {form.employeeProfile.department.toUpperCase() || "—"}
                                </span>{" "}
                                | Joined:{" "}
                                <span className="font-medium">
                                    {form.employeeProfile.dateOfJoining || "—"}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="hidden sm:block text-right">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Earnings overview
                        </p>
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                            ₹{earnings || 0}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Basic + HRA + allowances
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Main form */}
            <form
                onSubmit={handleSubmit}
                className="space-y-6"
            >
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left: Personal & job info */}
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardContent className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    Account & basic details
                                </h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Input
                                        label="Full Name"
                                        name="fullName"
                                        value={form.fullName}
                                        onChange={handleChange}
                                        readOnly={true}
                                        required
                                    />
                                    <Input
                                        label="Email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        type="email"
                                        readOnly={true}
                                        required
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Role
                                        </label>
                                        <select
                                            name="role"
                                            value={form.role}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                                        >
                                            <option value="employee">Employee</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Status
                                        </label>
                                        <select
                                            name="status"
                                            value={form.status}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    Job details
                                </h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Department
                                        </label>
                                        <select
                                            name="employeeProfile.department"
                                            value={form.employeeProfile.department}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                                        >
                                            <option value="creative">Creative</option>
                                            <option value="it">IT</option>
                                            <option value="sales">Sales</option>
                                            <option value="hr">HR</option>
                                        </select>
                                    </div>

                                    <Input
                                        label="Designation"
                                        type="text"
                                        name="employeeProfile.designation"
                                        value={form.employeeProfile.designation}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <Input
                                        label="Date of Joining"
                                        name="employeeProfile.dateOfJoining"
                                        value={form.employeeProfile.dateOfJoining}
                                        onChange={handleChange}
                                        type="date"
                                        readOnly={true}
                                    />
                                    <Input
                                        label="Employee Code"
                                        name="employeeProfile.employeeCode"
                                        value={form.employeeProfile.employeeCode}
                                        onChange={handleChange}
                                        required={form.role === "employee"}
                                        readOnly={true}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200">
                                        Employment Type
                                    </label>
                                    <select
                                        name="employeeProfile.employmentType"
                                        value={form.employeeProfile.employmentType}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                                    >
                                        <option value="full-time">Full-time</option>
                                        <option value="part-time">Part-time</option>
                                        <option value="contract">Contract</option>
                                        <option value="intern">Intern</option>
                                    </select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Salary structure */}
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        Salary structure
                                    </h3>
                                    {!isSuperAdmin && (
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                                            View only
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="CTC"
                                        type="number"
                                        name="employeeProfile.salary.ctc"
                                        value={salary.ctc}
                                        onChange={handleChange}
                                        readOnly={!isSuperAdmin}
                                    />
                                    <Input
                                        label="Basic"
                                        type="number"
                                        name="employeeProfile.salary.basic"
                                        value={salary.basic}
                                        onChange={handleChange}
                                        readOnly={!isSuperAdmin}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="HRA"
                                        type="number"
                                        name="employeeProfile.salary.hra"
                                        value={salary.hra}
                                        onChange={handleChange}
                                        readOnly={!isSuperAdmin}
                                    />
                                    <Input
                                        label="Allowances"
                                        type="number"
                                        name="employeeProfile.salary.allowances"
                                        value={salary.allowances}
                                        onChange={handleChange}
                                        readOnly={!isSuperAdmin}
                                    />
                                </div>

                                <Input
                                    label="Deductions"
                                    type="number"
                                    name="employeeProfile.salary.deductions"
                                    value={salary.deductions}
                                    onChange={handleChange}
                                    readOnly={!isSuperAdmin}
                                />

                                <div className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                                    <div className="flex items-center justify-between">
                                        <span>Total earnings</span>
                                        <span className="font-semibold">₹{earnings || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] mt-1">
                                        <span>CTC (as entered)</span>
                                        <span className="text-slate-500">
                                            ₹{Number(salary.ctc || 0)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Changes will immediately affect future payroll runs and records.
                    </p>
                    <div className="flex justify-end gap-3">
                        <SecondaryButton
                            type="button"
                            onClick={() => navigate("/employees")}
                            disabled={saving}
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={saving}>
                            {saving ? "Saving…" : "Save changes"}
                        </PrimaryButton>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EmployeeEdit;
