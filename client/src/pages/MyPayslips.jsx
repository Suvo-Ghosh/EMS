// src/pages/MyPayslips.jsx
import { useEffect, useState } from "react";
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

            const res = await api.get(
                `/api/payroll/my-payslips/${s._id}/pdf`,
                {
                    responseType: "blob", // 👈 IMPORTANT
                }
            );

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

    return (
        <div>
            <PageHeader
                title="My Payslips"
                subtitle="View your monthly salary details."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Payslip History</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading && <p className="text-sm">Loading…</p>}

                    {!loading && payslips.length === 0 && (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            No payslips available yet.
                        </p>
                    )}

                    {!loading && payslips.length > 0 && (
                        <div className="space-y-3">
                            {payslips.map((s) => (
                                <div
                                    key={s._id}
                                    className="border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm flex justify-between items-center"
                                >
                                    <div>
                                        <div className="font-medium">
                                            {monthLabel(s.month, s.year)}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            Gross: ₹{s.gross ?? "-"} · Net: ₹{s.netPay ?? "-"}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(s)}
                                        className="text-xs px-3 py-1 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        disabled={downloadingId === s._id}
                                    >
                                        {downloadingId === s._id
                                            ? "Downloading…"
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
