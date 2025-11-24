import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom"; // To get employee ID and navigate
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../api/axios.js";
import { Input } from "../components/ui/Input.jsx";
import { PrimaryButton, SecondaryButton } from "../components/ui/Button.jsx";
import { toast } from 'sonner';

// Utility to format dates as 'yyyy-MM-dd'
const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
};

const EmployeeEdit = () => {
    const { id } = useParams(); // Get employee ID from URL
    const { user } = useAuth();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
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
            department: "IT",
            designation: "",
        },
    });

    const isSuperAdmin = user?.role === "superAdmin";


    const navigate = useNavigate();

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
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
                            department: data.employee?.department || "IT",
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
        // Handle employeeProfile nested fields
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
        setLoading(true);

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
            setLoading(false);
        }
    };


    if (loading) return <p>Loading...</p>;

    return (
        <div className="">
            <h2 className="text-xl font-semibold mb-6">Employee Details</h2>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div>
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
                    <div>
                        <label className="text-xs md:text-sm font-medium  text-slate-700 dark:text-slate-200">Role</label>
                        <select
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            className="block w-full mt-1 p-2 md:p-2.5 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                            <option value="employee">Employee</option>
                            <option value="admin">Admin</option>
                            <option value="hr">HR</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs md:text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Status</label>
                        <select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            className="block w-full mt-1 p-2 md:p-2.5 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs md:text-sm font-medium">Department</label>
                        <select
                            name="employeeProfile.department"
                            value={form.employeeProfile.department}
                            onChange={handleChange}
                            className="block w-full mt-1 p-2 md:p-2.5 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                            <option value="creative">Creative</option>
                            <option value="it">IT</option>
                            <option value="sales">Sales</option>
                        </select>
                    </div>

                    <Input
                        label="Designation"
                        type="text"
                        name="employeeProfile.designation"
                        value={form.employeeProfile.designation}
                        onChange={handleChange}
                        className="w-full p-2 border border-slate-300 rounded-md"
                    />
                </div>

                {/* Right Column */}
                <div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Salary (CTC)"
                            type="number"
                            name="employeeProfile.salary.ctc"
                            value={form?.employeeProfile?.salary?.ctc}
                            onChange={handleChange}
                            className="w-full p-2 border border-slate-300 rounded-md"
                            readOnly={!isSuperAdmin}
                        />
                        <Input
                            label="Basic Salary"
                            type="number"
                            name="employeeProfile.salary.basic"
                            value={form?.employeeProfile?.salary?.basic}
                            onChange={handleChange}
                            className="w-full p-2 border border-slate-300 rounded-md"
                            readOnly={!isSuperAdmin}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="HRA"
                            type="number"
                            name="employeeProfile.salary.hra"
                            value={form?.employeeProfile?.salary?.hra}
                            onChange={handleChange}
                            className="w-full p-2 border border-slate-300 rounded-md"
                            readOnly={!isSuperAdmin}
                        />
                        <Input
                            label="Allowances"
                            type="number"
                            name="employeeProfile.salary.allowances"
                            value={form?.employeeProfile?.salary?.allowances}
                            onChange={handleChange}
                            className="w-full p-2 border border-slate-300 rounded-md"
                            readOnly={!isSuperAdmin}
                        />
                    </div>

                    <Input
                        label="Deductions"
                        type="number"
                        name="employeeProfile.salary.deductions"
                        value={form?.employeeProfile?.salary?.deductions}
                        onChange={handleChange}
                        className="w-full p-2 border border-slate-300 rounded-md"
                        readOnly={!isSuperAdmin}
                    />
                    <Input
                        label="Date of Joining"
                        name="employeeProfile.dateOfJoining"
                        value={form?.employeeProfile?.dateOfJoining}
                        onChange={handleChange}
                        type="date"
                        readOnly={true}
                    />
                    <Input
                        label="Employee Code"
                        name="employeeProfile.employeeCode"
                        value={form?.employeeProfile?.employeeCode}
                        onChange={handleChange}
                        required={form.role === "employee"}
                        readOnly={true}
                    />
                    <div>
                        <label className="text-xs md:text-sm font-medium mb-2">
                            Employment Type
                        </label>
                        <select
                            name="employeeProfile.employmentType"
                            value={form?.employeeProfile?.employmentType}
                            onChange={handleChange}
                            className="block w-full mt-1 p-2 md:p-2.5 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                            <option value="full-time">Full-time</option>
                            <option value="part-time">Part-time</option>
                            <option value="contract">Contract</option>
                            <option value="intern">Intern</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-between mt-4 md:col-span-2">
                    <SecondaryButton type="button" onClick={() => navigate("/employees")}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </PrimaryButton>
                </div>
            </form>
        </div>
    );
};

export default EmployeeEdit;
