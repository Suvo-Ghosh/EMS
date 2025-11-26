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

    // UI filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

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
        const label = monthLabel(curMonth, curYear);

        // simple confirm to avoid accidental clicks
        const confirmed = window.confirm(
            `Run payroll for ${label}?\n\nThis will generate payslips for all eligible employees.`
        );
        if (!confirmed) return;

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
        // if clicking same run while it's already open, collapse it
        if (selectedRun && selectedRun._id === run._id) {
            setSelectedRun(null);
            setPayslips([]);
            return;
        }

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

    const sortedRuns = useMemo(() => {
        if (!runs?.length) return [];
        // sort latest year/month first
        return [...runs].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });
    }, [runs]);

    const statusOptions = useMemo(() => {
        const set = new Set();
        runs.forEach((r) => set.add(r.status || "PROCESSED"));
        return Array.from(set);
    }, [runs]);

    const filteredRuns = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();
        return sortedRuns.filter((run) => {
            const status = (run.status || "PROCESSED").toUpperCase();
            const label = monthLabel(run.month, run.year).toLowerCase();

            const matchesStatus =
                statusFilter === "ALL" || status === statusFilter.toUpperCase();

            const matchesSearch =
                !search ||
                label.includes(search) ||
                status.toLowerCase().includes(search);

            return matchesStatus && matchesSearch;
        });
    }, [sortedRuns, searchTerm, statusFilter]);

    const lastRun = sortedRuns[0] || null;

    const payslipSummary = useMemo(() => {
        if (!payslips.length) return { totalGross: 0, totalNet: 0 };
        return payslips.reduce(
            (acc, p) => {
                acc.totalGross += Number(p.gross || 0);
                acc.totalNet += Number(p.netPay || 0);
                return acc;
            },
            { totalGross: 0, totalNet: 0 }
        );
    }, [payslips]);

    return (
        <div>
            <PageHeader
                title="Payroll"
                subtitle="Run monthly payroll and review previous cycles."
                actions={
                    <PrimaryButton
                        type="button"
                        onClick={handleRunPayroll}
                        disabled={running}
                    >
                        {running
                            ? "Processing payroll..."
                            : `Run Payroll for ${monthLabel(curMonth, curYear)}`}
                    </PrimaryButton>
                }
            />

            {/* Quick stats */}
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <Card>
                    <CardContent className="py-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Current cycle
                        </p>
                        <p className="text-sm font-semibold">
                            {monthLabel(curMonth, curYear)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            Make sure attendance and salary changes are updated before running
                            payroll.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Total runs
                        </p>
                        <p className="text-sm font-semibold">{runs.length}</p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            Historical payroll cycles processed in this system.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Last processed
                        </p>
                        <p className="text-sm font-semibold">
                            {lastRun ? monthLabel(lastRun.month, lastRun.year) : "—"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            Click a row below to inspect payslips.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Current cycle summary */}
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Current Cycle</CardTitle>
                </CardHeader>
                <CardContent>
                    {currentRun ? (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
                            <div>
                                <div className="font-medium">
                                    {monthLabel(currentRun.month, currentRun.year)}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Employees processed:{" "}
                                    {currentRun.summary?.employeeCount ?? "—"} · Total net payout:{" "}
                                    ₹{currentRun.summary?.totalNet ?? "—"}
                                </p>
                            </div>
                            <StatusBadge status={currentRun.status || "PROCESSED"} />
                        </div>
                    ) : (
                        <div className="flex items-start justify-between gap-4 text-sm">
                            <p className="text-slate-600 dark:text-slate-300">
                                No payroll has been run for{" "}
                                <span className="font-medium">
                                    {monthLabel(curMonth, curYear)}
                                </span>{" "}
                                yet.
                            </p>
                            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                                Tip: Run payroll once all attendance and salary changes for
                                this month are finalized.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* History */}
            <Card>
                <CardHeader>
                    <CardTitle>Payroll History</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            View past payroll runs. Use search and filters to quickly find a
                            specific month.
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                                type="text"
                                placeholder="Search month or status..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:w-40"
                            >
                                <option value="ALL">All statuses</option>
                                {statusOptions.map((status) => (
                                    <option key={status} value={status.toUpperCase()}>
                                        {status.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading && (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Loading payroll runs...
                        </p>
                    )}

                    {!loading && runs.length === 0 && (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            No payroll runs yet. Run your first payroll using the button
                            above.
                        </p>
                    )}

                    {!loading && runs.length > 0 && filteredRuns.length === 0 && (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            No payroll runs match your filters. Try clearing search or
                            changing the status filter.
                        </p>
                    )}

                    {!loading && filteredRuns.length > 0 && (
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
                                    {filteredRuns.map((run) => {
                                        const isSelected = selectedRun?._id === run._id;
                                        return (
                                            <tr
                                                key={run._id}
                                                className={`border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60 cursor-pointer ${isSelected
                                                        ? "bg-blue-50/70 dark:bg-blue-900/20"
                                                        : ""
                                                    }`}
                                                onClick={() => handleViewRun(run)}
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
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewRun(run);
                                                        }}
                                                        className="rounded-md border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-900/30 dark:text-blue-100 dark:hover:bg-blue-900/60"
                                                    >
                                                        {isSelected ? "Hide payslips" : "View payslips"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Selected run payslips */}
                    {selectedRun && (
                        <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-2">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                                <div>
                                    <h3 className="text-sm font-semibold">
                                        Payslips – {monthLabel(selectedRun.month, selectedRun.year)}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Employees: {payslips.length} · Total gross: ₹
                                        {payslipSummary.totalGross} · Total net: ₹
                                        {payslipSummary.totalNet}
                                    </p>
                                </div>
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
                                                    <td className="px-3 py-1">
                                                        {s.employeeCode || "—"}
                                                    </td>
                                                    <td className="px-3 py-1">{s.department || "—"}</td>
                                                    <td className="px-3 py-1">₹{s.gross}</td>
                                                    <td className="px-3 py-1 font-semibold">
                                                        ₹{s.netPay}
                                                    </td>
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
