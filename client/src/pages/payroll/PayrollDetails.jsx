import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useParams } from "react-router-dom";

const PayrollDetails = () => {
    const { id } = useParams();
    const [payroll, setPayroll] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const { data } = await api.get(`/payroll/${id}`);
            setPayroll(data);
        };
        fetchData();
    }, [id]);

    if (!payroll) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="bg-white p-6 shadow rounded-lg">
                <h1 className="text-2xl font-bold mb-4">Payroll Details</h1>

                <div className="space-y-2">
                    <p><strong>Employee:</strong> {payroll.employee.fullName}</p>
                    <p><strong>Month:</strong> {payroll.month}</p>
                    <p><strong>Salary:</strong> ₹{payroll.salaryAmount}</p>
                    <p>
                        <strong>Status:</strong>{" "}
                        <span
                            className={`px-2 py-1 text-sm rounded ${payroll.status === "Paid"
                                    ? "bg-green-100 text-green-600"
                                    : "bg-yellow-100 text-yellow-600"
                                }`}
                        >
                            {payroll.status}
                        </span>
                    </p>
                </div>

                <button
                    onClick={async () => {
                        await api.put(`/payroll/${id}/pay`);
                        window.location.reload();
                    }}
                    className="mt-5 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
                >
                    Mark as Paid
                </button>
            </div>
        </div>
    );
};

export default PayrollDetails;
