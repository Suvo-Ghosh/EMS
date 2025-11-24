import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const CreatePayroll = () => {
    const [employees, setEmployees] = useState([]);
    const [employeeId, setEmployeeId] = useState("");
    const [month, setMonth] = useState("");
    const [salary, setSalary] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEmployees = async () => {
            const { data } = await api.get("/api/admin/users");
            console.log(data?.users);
            
            setEmployees(data?.users);
        };
        fetchEmployees();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await api.post("/api/payroll", {
            employee: employeeId,
            month,
            salaryAmount: salary,
        });
        navigate("/payroll");
    };

    return (
        <div className="p-6 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-4">Create Payroll</h1>

            <form
                className="space-y-4 bg-white p-6 rounded-lg shadow"
                onSubmit={handleSubmit}
            >
                <div>
                    <label className="block font-medium mb-1">Employee</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        required
                    >
                        <option value="">Select Employee</option>
                        {employees.map((e) => (
                            <option key={e._id} value={e._id}>
                                {e.fullName}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block font-medium mb-1">Month</label>
                    <input
                        type="month"
                        className="w-full border p-2 rounded"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block font-medium mb-1">Salary Amount (₹)</label>
                    <input
                        type="number"
                        className="w-full border p-2 rounded"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                        required
                    />
                </div>

                <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-500">
                    Generate Salary
                </button>
            </form>
        </div>
    );
};

export default CreatePayroll;
