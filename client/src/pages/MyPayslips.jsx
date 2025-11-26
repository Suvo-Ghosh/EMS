import { useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";
import PageHeader from "../components/ui/PageHeader.jsx";
import Card, {
    CardHeader,
    CardTitle,
    CardContent,
} from "../components/ui/Card.jsx";

const monthLabel = (m, y) =>
    new Date(y, m - 1, 1).toLocaleString("default", {
        month: "short",
        year: "numeric",
    });

const MyPayslips = () => {
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [yearFilter, setYearFilter] = useState("ALL");

    const fetchPayslips = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/api/payroll/my-payslips");
            if (data.ok) {
                setPayslips(data.payslips || []);
            }
        } catch (err) {
            console.error("Error loading payslips:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayslips();
    }, []);

    const handleDownload = async (s) => {
        try {
            setDownloadingId(s._id);

            const res = await api.get(`/api/payroll/my-payslips/${s._id}/pdf`, {
                responseType: "blob",
            });

            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);

            const safeLabel = monthLabel(s.month, s.year).replace(/\s+/g, "_");
            const a = document.createElement("a");
            a.href = url;
            a.download = `Payslip_${safeLabel}.pdf`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error downloading payslip PDF:", err);
        } finally {
            setDownloadingId(null);
        }
    };

    const sortedPayslips = useMemo(() => {
        if (!payslips?.length) return [];
        // latest year/month first
        return [...payslips].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });
    }, [payslips]);

    const years = useMemo(() => {
        const set = new Set();
        payslips.forEach((p) => set.add(p.year));
        return Array.from(set).sort((a, b) => b - a);
    }, [payslips]);

    const filteredPayslips = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();
        return sortedPayslips.filter((s) => {
            const label = monthLabel(s.month, s.year).toLowerCase();
            const gross = String(s.gross ?? "").toLowerCase();
            const net = String(s.netPay ?? "").toLowerCase();

            const matchesYear = yearFilter === "ALL" || s.year === Number(yearFilter);
            const matchesSearch =
                !search ||
                label.includes(search) ||
                gross.includes(search) ||
                net.includes(search);

            return matchesYear && matchesSearch;
        });
    }, [sortedPayslips, searchTerm, yearFilter]);

    const latestPayslip = sortedPayslips[0] || null;

    return (
        <div>
            <PageHeader
                title="My Payslips"
                subtitle="View and download your monthly salary slips."
            />

            {/* Quick summary */}
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <Card>
                    <CardContent className="py-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Total payslips
                        </p>
                        <p className="text-lg font-semibold">{payslips.length}</p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            Your complete salary history in this system.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="py-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Latest month
                        </p>
                        <p className="text-sm font-semibold">
                            {latestPayslip
                                ? monthLabel(latestPayslip.month, latestPayslip.year)
                                : "—"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            Download recent slips for reimbursement or loan documents.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="py-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Latest net pay
                        </p>
                        <p className="text-sm font-semibold">
                            {latestPayslip ? `₹${latestPayslip.netPay ?? "-"}` : "—"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            Check how much you received in your most recent cycle.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Payslip History</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Search by month or amount, or filter by year.
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                                type="text"
                                placeholder="Search month / amount..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                            <select
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:w-32"
                            >
                                <option value="ALL">All years</option>
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading && (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Loading your payslips...
                        </p>
                    )}

                    {!loading && payslips.length === 0 && (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            No payslips available yet. Your first payslip will appear here
                            once payroll is processed.
                        </p>
                    )}

                    {!loading && payslips.length > 0 && filteredPayslips.length === 0 && (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            No payslips match your search. Try clearing filters.
                        </p>
                    )}

                    {!loading && filteredPayslips.length > 0 && (
                        <div className="space-y-3">
                            {filteredPayslips.map((s) => (
                                <div
                                    key={s._id}
                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60"
                                >
                                    <div>
                                        <div className="font-medium">
                                            {monthLabel(s.month, s.year)}
                                        </div>
                                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                            Gross: ₹{s.gross ?? "-"} · Net: ₹{s.netPay ?? "-"}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(s)}
                                        className="rounded-md border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-900/60 dark:bg-blue-900/30 dark:text-blue-100 dark:hover:bg-blue-900/60"
                                        disabled={downloadingId === s._id}
                                    >
                                        {downloadingId === s._id
                                            ? "Downloading..."
                                            : "Download PDF"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default MyPayslips;
