import { useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";
import PageHeader from "../components/ui/PageHeader.jsx";
import Card, { CardHeader, CardTitle, CardContent } from "../components/ui/Card.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import { PrimaryButton } from "../components/ui/Button.jsx";
import { toast } from "sonner";

const monthLabel = (m, y) =>
    new Date(y, m - 1, 1).toLocaleString("default", { month: "short", year: "numeric" });

const getCurrentMonthYear = () => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
};

const Payroll = () => {
    const [{ month: curMonth, year: curYear }] = useState(getCurrentMonthYear);
    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [running, setRunning] = useState(false);

    const [selectedRun, setSelectedRun] = useState(null);
    const [payslips, setPayslips] = useState([]);
    const [payslipLoading, setPayslipLoading] = useState(false);

    const fetchRuns = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/api/payroll/runs");
            if (data.ok) {
                setRuns(data.runs || []);
            } else {
                toast.error(data.message || "Failed to load payroll runs.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load payroll runs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRuns();
    }, []);

    const handleRunPayroll = async () => {
        setRunning(true);
        try {
            const { data } = await api.post("/api/payroll/runs", {
                month: curMonth,
                year: curYear,
            });

            if (!data.ok) {
                toast.error(data.message || "Failed to run payroll.");
            } else {
                toast.success(data.message || "Payroll processed.");
                await fetchRuns();
            }
        } catch (err) {
            console.error(err?.response?.data?.message);
            toast.error(err?.response?.data?.message || "Error running payroll.");
        } finally {
            setRunning(false);
        }
    };

    const handleViewRun = async (run) => {
        setSelectedRun(run);
        setPayslips([]);
        setPayslipLoading(true);
        try {
            const { data } = await api.get(`/api/payroll/runs/${run._id}/payslips`);
            if (data.ok) {
                setPayslips(data.payslips || []);
            } else {
                toast.error(data.message || "Failed to load payslips.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load payslips.");
        } finally {
            setPayslipLoading(false);
        }
    };

    const currentRun =
        runs.find((r) => r.month === curMonth && r.year === curYear) || null;

    return (
        <div>
            <PageHeader
                title="Payroll"
                subtitle="Run monthly payroll and review previous cycles."
                actions={
                    <PrimaryButton type="button" onClick={handleRunPayroll} disabled={running}>
                        {running
                            ? "Processing..."
                            : `Run Payroll for ${monthLabel(curMonth, curYear)}`}
                    </PrimaryButton>
                }
            />

            {/* Current cycle summary */}
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Current Cycle</CardTitle>
                </CardHeader>
                <CardContent>
                    {currentRun ? (
                        <div className="flex items-center justify-between text-sm">
                            <div>
                                <div className="font-medium">
                                    {monthLabel(currentRun.month, currentRun.year)}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Employees processed: {currentRun.summary?.employeeCount ?? "—"} ·
                                    Total net payout: ₹{currentRun.summary?.totalNet ?? "—"}
                                </p>
                            </div>
                            <StatusBadge status={currentRun.status || "PROCESSED"} />
                        </div>
                    ) : (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            No payroll run yet for {monthLabel(curMonth, curYear)}.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* History */}
            <Card>
                <CardHeader>
                    <CardTitle>Payroll History</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading && (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Loading payroll runs...
                        </p>
                    )}

                    {!loading && runs.length === 0 && (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            No payroll runs yet.
                        </p>
                    )}

                    {!loading && runs.length > 0 && (
                        <div className="overflow-x-auto mb-4">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Month
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Employees
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Total Net
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Status
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {runs.map((run) => (
                                        <tr
                                            key={run._id}
                                            className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                                        >
                                            <td className="px-4 py-2">
                                                {monthLabel(run.month, run.year)}
                                            </td>
                                            <td className="px-4 py-2">
                                                {run.summary?.employeeCount ?? "—"}
                                            </td>
                                            <td className="px-4 py-2">
                                                ₹{run.summary?.totalNet ?? "—"}
                                            </td>
                                            <td className="px-4 py-2">
                                                <StatusBadge status={run.status || "PROCESSED"} />
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewRun(run)}
                                                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    View payslips
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Selected run payslips */}
                    {selectedRun && (
                        <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold">
                                    Payslips – {monthLabel(selectedRun.month, selectedRun.year)}
                                </h3>
                                <button
                                    type="button"
                                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    onClick={() => {
                                        setSelectedRun(null);
                                        setPayslips([]);
                                    }}
                                >
                                    Close
                                </button>
                            </div>

                            {payslipLoading && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Loading payslips...
                                </p>
                            )}

                            {!payslipLoading && payslips.length === 0 && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    No payslips found for this run.
                                </p>
                            )}

                            {!payslipLoading && payslips.length > 0 && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                                                <th className="px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                    Employee
                                                </th>
                                                <th className="px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                    Code
                                                </th>
                                                <th className="px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                    Dept
                                                </th>
                                                <th className="px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                    Gross
                                                </th>
                                                <th className="px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                    Net
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payslips.map((s) => (
                                                <tr
                                                    key={s._id}
                                                    className="border-t border-slate-100 dark:border-slate-800"
                                                >
                                                    <td className="px-3 py-1">{s.fullName}</td>
                                                    <td className="px-3 py-1">{s.employeeCode || "—"}</td>
                                                    <td className="px-3 py-1">{s.department || "—"}</td>
                                                    <td className="px-3 py-1">₹{s.gross}</td>
                                                    <td className="px-3 py-1 font-semibold">₹{s.netPay}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Payroll;
