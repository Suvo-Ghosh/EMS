import { useEffect, useRef, useState } from "react";
import api from "../api/axios.js";
import { Input } from "../components/ui/Input.jsx";
import { PrimaryButton, SecondaryButton } from "../components/ui/Button.jsx";
import { toast } from "sonner";

const AddEmployee = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "Hashtago@2023",
        departmentType: "creative",
        designation: "",
        dateOfJoining: "",
        employmentType: "full-time",
        salaryCtc: "",
        salaryBasic: "",
        salaryHra: "",
        salaryAllowances: "",
        salaryDeductions: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const addRef = useRef();

    // Close modal if clicked outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (addRef.current && !addRef.current.contains(e.target)) {
                onClose?.();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    // Handle submit - build payload to match backend expectations
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const payload = {
                fullName: form.fullName,
                email: form.email,
                password: form.password,
                // ❌ no role here; backend will set role: "employee"
                employeeProfile: {
                    department: form.departmentType,
                    designation: form.designation || undefined,
                    dateOfJoining: form.dateOfJoining || undefined,
                    employmentType: form.employmentType || "full-time",
                    salary: {
                        ctc: form.salaryCtc ? Number(form.salaryCtc) : undefined,
                        basic: form.salaryBasic ? Number(form.salaryBasic) : undefined,
                        hra: form.salaryHra ? Number(form.salaryHra) : undefined,
                        allowances: form.salaryAllowances
                            ? Number(form.salaryAllowances)
                            : undefined,
                        deductions: form.salaryDeductions
                            ? Number(form.salaryDeductions)
                            : undefined,
                    },
                },
            };

            const { data } = await api.post("/api/admin/users", payload);

            if (data.ok) {
                toast.success("Employee added successfully!");
                onSuccess?.();
                onClose?.();
            } else {
                const msg = data.message || "Failed to add employee.";
                toast.error(msg);
                setError(msg);
            }
        } catch (err) {
            console.error("Error adding employee:", err);
            const msg =
                err.response?.data?.message ||
                "Something went wrong. Please try again.";

            toast.error(msg);
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex justify-center items-center px-4">
            <div
                ref={addRef}
                className="bg-white dark:bg-slate-950 border border-blue-950 mx-4 md:mx-0 rounded-lg shadow-lg w-full max-w-md md:max-w-4xl overflow-y-auto max-h-[90vh]"
            >
                <div className="px-4 py-2 md:px-6 md:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-semibold">Add New Employee</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <p className="text-red-500 text-sm mb-2 px-4 md:px-6 pt-2">{error}</p>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="px-4 py-2 md:px-6 md:py-4 grid grid-cols-1 md:grid-cols-2 gap-x-4"
                >
                    {/* Left column */}
                    <div className="space-y-2">
                        <Input
                            label="Full Name"
                            name="fullName"
                            value={form.fullName}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            type="email"
                        />
                        <Input
                            label="Password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            type="text"
                            readOnly={true}
                        />

                        <div>
                            <label className="text-xs md:text-sm font-medium">
                                Department
                            </label>
                            <select
                                name="departmentType"
                                value={form.departmentType}
                                onChange={handleChange}
                                className="block w-full mt-1 p-2 md:p-2.5 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            >
                                <option value="creative">Creative</option>
                                <option value="hr">HR</option>
                                <option value="it">IT</option>
                                <option value="sales">Sales</option>
                            </select>
                        </div>

                        <Input
                            label="Designation"
                            name="designation"
                            value={form.designation}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Right column */}
                    <div className="space-y-2 mt-3 md:mt-0">
                        <Input
                            label="Date of Joining"
                            name="dateOfJoining"
                            value={form.dateOfJoining}
                            onChange={handleChange}
                            type="date"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="CTC"
                                name="salaryCtc"
                                value={form.salaryCtc}
                                onChange={handleChange}
                                type="number"
                            />
                            <Input
                                label="Basic Salary"
                                name="salaryBasic"
                                value={form.salaryBasic}
                                onChange={handleChange}
                                type="number"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="HRA"
                                name="salaryHra"
                                value={form.salaryHra}
                                onChange={handleChange}
                                type="number"
                            />
                            <Input
                                label="Allowances"
                                name="salaryAllowances"
                                value={form.salaryAllowances}
                                onChange={handleChange}
                                type="number"
                            />
                        </div>

                        <Input
                            label="Deductions"
                            name="salaryDeductions"
                            value={form.salaryDeductions}
                            onChange={handleChange}
                            type="number"
                        />

                        {/* Employment type */}
                        <div>
                            <label className="text-xs md:text-sm font-medium mb-2">
                                Employment Type
                            </label>
                            <select
                                name="employmentType"
                                value={form.employmentType}
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

                    {/* Buttons row spans full width */}
                    <div className="flex justify-between mt-4 md:col-span-2">
                        <SecondaryButton type="button" onClick={onClose}>
                            Back
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={loading}>
                            {loading ? "Adding..." : "Add Employee"}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployee;
