import { useEffect, useState } from "react";
import api from "../../api/axios";

const PayrollList = () => {
  const [payrolls, setPayrolls] = useState([]);

  useEffect(() => {
    const fetchPayrolls = async () => {
      const { data } = await api.get("/api/payroll");
      setPayrolls(data);
    };
    fetchPayrolls();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payrolls</h1>
        <a
          href="/payroll/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
        >
          + Create Payroll
        </a>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">Employee</th>
              <th className="p-3">Month</th>
              <th className="p-3">Salary</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {payrolls.map((p) => (
              <tr key={p._id} className="border-b hover:bg-gray-50">
                <td className="p-3">{p.employee.fullName}</td>
                <td className="p-3">{p.month}</td>
                <td className="p-3">₹{p.salaryAmount}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 text-sm rounded ${
                    p.status === "Paid"
                      ? "bg-green-100 text-green-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-3">
                  <a
                    href={`/payroll/${p._id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollList;
