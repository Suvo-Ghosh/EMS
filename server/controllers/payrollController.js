import PDFDocument from "pdfkit";
import PayrollRun from "../models/PayrollRun.js";
import Payslip from "../models/Payslip.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";


/**
 * GET /api/payroll/runs
 * List all payroll runs (management only – enforced in routes)
 */
export const listRuns = async (req, res) => {
    try {
        const runs = await PayrollRun.find()
            .sort({ year: -1, month: -1 })
            .lean();

        return res.json({ ok: true, runs });
    } catch (err) {
        console.error("Error listing payroll runs:", err);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
};

/**
 * POST /api/payroll/runs
 * Body: { month, year }
 * Creates payroll run + per-employee payslips from Employee.salary
 */
export const runPayroll = async (req, res) => {
    try {
        let { month, year } = req.body;

        month = Number(month);
        year = Number(year);

        if (!month || !year) {
            return res
                .status(400)
                .json({ ok: false, message: "month and year are required" });
        }
        if (month < 1 || month > 12) {
            return res
                .status(400)
                .json({ ok: false, message: "month must be between 1 and 12" });
        }

        // avoid duplicate run
        const existingRun = await PayrollRun.findOne({ month, year });
        if (existingRun) {
            return res.status(400).json({
                ok: false,
                // message: `Payroll already processed for this month in this year`,
                message: `Payroll already processed for this month in ${year}`,
            });
        }

        // get all active employees + their user
        const employees = await Employee.find({ isActive: true })
            .populate("user") // user has fullName, email, role, status
            .lean();

        if (!employees.length) {
            return res.status(400).json({
                ok: false,
                message: "No active employees found to process payroll.",
            });
        }

        let totalNet = 0;
        const payslips = [];

        for (const emp of employees) {
            // skip if no user or user not active
            if (!emp.user || emp.user.status !== "active") continue;

            const s = emp.salary || {};
            const basic = Number(s.basic || 0);
            const hra = Number(s.hra || 0);
            const allowances = Number(s.allowances || 0);
            const deductions = Number(s.deductions || 0);

            const gross = basic + hra + allowances;
            const netPay = gross - deductions;

            totalNet += netPay;

            payslips.push({
                user: emp.user._id,
                month,
                year,
                employeeCode: emp.employeeCode,
                fullName: emp.user.fullName,
                department: emp.department,
                designation: emp.designation,
                salary: {
                    ctc: s.ctc,
                    basic: s.basic,
                    hra: s.hra,
                    allowances: s.allowances,
                    deductions: s.deductions,
                },
                gross,
                netPay,
            });
        }

        if (!payslips.length) {
            return res.status(400).json({
                ok: false,
                message: "No eligible employees to process payroll.",
            });
        }

        const run = await PayrollRun.create({
            month,
            year,
            status: "PROCESSED",
            summary: {
                employeeCount: payslips.length,
                totalNet,
            },
            processedBy: req.user?.id,
        });

        const docs = payslips.map((p) => ({
            ...p,
            payrollRun: run._id,
        }));

        await Payslip.insertMany(docs);

        return res.json({
            ok: true,
            message: "Payroll processed successfully",
            run,
        });
    } catch (err) {
        console.error("Error running payroll:", err);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
};

/**
 * GET /api/payroll/my-payslips
 * Current logged-in user's payslips
 */
export const listMyPayslips = async (req, res) => {
    try {
        const userId = req.user.id;

        const slips = await Payslip.find({ user: userId })
            .sort({ year: -1, month: -1 })
            .lean();

        return res.json({ ok: true, payslips: slips });
    } catch (err) {
        console.error("Error loading my payslips:", err);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
};

export const downloadPdfPayslips = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const payslip = await Payslip.findOne({ _id: id, user: userId }).lean();
        if (!payslip) {
            return res
                .status(404)
                .json({ ok: false, message: "Payslip not found" });
        }

        const user = await User.findById(userId).lean();
        if (!user) {
            return res
                .status(404)
                .json({ ok: false, message: "User not found" });
        }

        const monthStr = String(payslip.month).padStart(2, "0");
        const filename = `Payslip_${payslip.year}_${monthStr}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );

        const doc = new PDFDocument({ size: "A4", margin: 40 });
        doc.pipe(res);

        // const pageWidth = doc.page.width;
        // const contentWidth =
        //     pageWidth - doc.page.margins.left - doc.page.margins.right;
        const pageWidth = doc.page?.width || 595.28; // A4 width fallback
        const marginLeft = typeof doc.page?.margins?.left === "number"
            ? doc.page.margins.left
            : 40;
        const marginRight = typeof doc.page?.margins?.right === "number"
            ? doc.page.margins.right
            : 40;

        const contentWidth = pageWidth - marginLeft - marginRight;

        // Helpers
        const formatCurrency = (value) =>
            value == null || isNaN(value)
                ? "-"
                : `Rs.${Number(value).toLocaleString("en-IN", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                })}`;

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthName = monthNames[payslip.month - 1] || payslip.month;

        const companyName =
            process.env.APP_NAME || "Hashtago Digital & IT Solutions";

        const drawSectionTitle = (title) => {
            doc.moveDown(1);
            const sectionY = doc.y;

            const barHeight = 20;
            const barY = sectionY - 4;
            const barX = doc.page.margins.left;

            // draw bar
            doc
                .rect(barX, barY, contentWidth, barHeight)
                .fill("#0f172a");

            // prepare text
            const text = title.toUpperCase();
            doc.fontSize(11).fillColor("#FFFFFF");

            // get text height with same options we will use
            const textHeight = doc.heightOfString(text, {
                width: contentWidth,
                align: "center",
            });

            // vertical center inside bar
            const textY = barY + (barHeight - textHeight) / 2;

            // draw centered text
            doc.text(text, barX, textY, {
                width: contentWidth,
                align: "center",
            });

            doc.moveDown(1);
            doc.fillColor("#111827"); // reset for body
        };


        const drawKeyValue = (label, value) => {
            doc
                .fontSize(10)
                .fillColor("#4b5563")
                .text(label, { continued: true });
            doc
                .fontSize(10)
                .fillColor("#111827")
                .text(` ${value}`);
        };

        // ======= TOP HEADER BAR =======
        doc.rect(0, 0, pageWidth, 70).fill("#0f172a");

        doc
            .fillColor("#ffffff")
            .fontSize(18)
            .text(companyName, 40, 22, { align: "left" });

        doc
            .fontSize(10)
            .fillColor("#e5e7eb")
            .text("Payroll Payslip", 40, 44, { align: "left" });

        doc
            .fontSize(10)
            .text(`${monthName} ${payslip.year}`, pageWidth - 160, 28, {
                width: 120,
                align: "right",
            });

        // Move into body area
        doc.moveDown(4);
        doc.fillColor("#111827");

        // ======= TITLE + META =======
        doc.fontSize(14).text("Payslip", { align: "left" });
        doc.moveDown(0.3);
        doc
            .fontSize(9)
            .fillColor("#6b7280")
            .text(
                `Generated on ${new Date().toLocaleDateString("en-IN")}`,
                { align: "left" }
            );
        doc.moveDown(1);

        // ======= EMPLOYEE DETAILS =======
        drawSectionTitle("Employee Details");

        doc.fontSize(10).fillColor("#111827");

        drawKeyValue("Name:", payslip.fullName || user.fullName);
        doc.moveDown(0.1);
        if (payslip.employeeCode) {
            drawKeyValue("Employee Code:", payslip.employeeCode);
            doc.moveDown(0.1);
        }
        if (payslip.department) {
            drawKeyValue("Department:", payslip.department);
            doc.moveDown(0.1);
        }
        if (payslip.designation) {
            drawKeyValue("Designation:", payslip.designation);
            doc.moveDown(0.1);
        }
        drawKeyValue("Email:", user.email);
        doc.moveDown(0.1);
        drawKeyValue("Payslip For:", `${monthName} ${payslip.year}`);

        // ======= SALARY SUMMARY (CARD STYLE) =======
        drawSectionTitle("Summary");

        const summaryStartY = doc.y;
        const colWidth = contentWidth / 3;

        const drawSummaryBox = (label, value, xIndex) => {
            const x =
                doc.page.margins.left + xIndex * colWidth + (xIndex > 0 ? 8 : 0);
            const boxWidth = colWidth - (xIndex > 0 ? 8 : 4);
            const y = summaryStartY;

            doc
                .roundedRect(x, y, boxWidth, 48, 6)
                .fillAndStroke("#f3f4f6", "#d1d5db");

            doc
                .fillColor("#6b7280")
                .fontSize(9)
                .text(label, x + 8, y + 8, { width: boxWidth - 16 });

            doc
                .fillColor("#111827")
                .fontSize(11)
                .text(value, x + 8, y + 22, {
                    width: boxWidth - 16,
                });
        };

        drawSummaryBox(
            "CTC (Yearly)",
            formatCurrency(payslip.salary?.ctc),
            0
        );
        drawSummaryBox("Gross Salary", formatCurrency(payslip.gross), 1);
        drawSummaryBox("Net Pay", formatCurrency(payslip.netPay), 2);

        doc.moveDown(4);

        // ======= EARNINGS BREAKDOWN =======
        drawSectionTitle("Earnings");

        const { basic, hra, allowances, deductions } = payslip.salary || {};

        const leftX = doc.page.margins.left;
        const midX = leftX + contentWidth * 0.6; // label column 60%, amount 40%

        // Table header
        let y = doc.y;
        doc
            .fontSize(10)
            .fillColor("#6b7280")
            .text("Component", leftX, y, {
                width: contentWidth * 0.6,
            });
        doc.text("Amount", midX, y, {
            width: contentWidth * 0.4,
            align: "right",
        });

        doc
            .moveTo(leftX, doc.y + 2)
            .lineTo(leftX + contentWidth, doc.y + 2)
            .strokeColor("#d1d5db")
            .lineWidth(0.5)
            .stroke();

        const drawRow = (label, value) => {
            if (value == null) return;
            const rowY = doc.y + 6;
            doc
                .fontSize(10)
                .fillColor("#374151")
                .text(label, leftX, rowY, {
                    width: contentWidth * 0.6,
                });
            doc.text(formatCurrency(value), midX, rowY, {
                width: contentWidth * 0.390,
                align: "right",
            });

            doc
                .moveTo(leftX, doc.y + 2)
                .lineTo(leftX + contentWidth, doc.y + 2)
                .strokeColor("#e5e7eb")
                .lineWidth(0.3)
                .stroke();
        };

        drawRow("Basic", basic);
        drawRow("House Rent Allowance (HRA)", hra);
        drawRow("Other Allowances", allowances);

        doc.moveDown(2);

        // ======= DEDUCTIONS =======
        drawSectionTitle("Deductions");

        if (deductions != null) {
            const rowY = doc.y;
            doc
                .fontSize(10)
                .fillColor("#374151")
                .text("Total Deductions", leftX, rowY, {
                    width: contentWidth * 0.6,
                });
            doc.text(formatCurrency(deductions), midX, rowY, {
                width: contentWidth * 0.390,
                align: "right",
            });

            doc
                .moveTo(leftX, doc.y + 2)
                .lineTo(leftX + contentWidth, doc.y + 2)
                .strokeColor("#e5e7eb")
                .lineWidth(0.3)
                .stroke();
        } else {
            doc
                .fontSize(10)
                .fillColor("#6b7280")
                .text("No deductions recorded for this month.");
        }

        // ======= FOOTER NOTE =======
        doc.moveDown(3);

        const footerText =
            "This is a system-generated payslip and does not require a physical signature.";

        const footerY = doc.y;

        if (!Number.isFinite(contentWidth) || contentWidth <= 0) {
            // Fallback: don't pass width if something is wrong
            doc
                .fontSize(8)
                .fillColor("#9ca3af")
                .text(footerText, marginLeft, footerY, { align: "center" });
        } else {
            doc
                .fontSize(8)
                .fillColor("#9ca3af")
                .text(footerText, marginLeft, footerY, {
                    width: contentWidth,
                    align: "center",
                });
        }

        doc.end();

    } catch (err) {
        console.error("GET /api/payroll/my-payslips/:id/pdf error:", err);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, message: "Server error" });
        }
    }
};


/**
 * GET /api/payroll/runs/:runId/payslips
 * Management view: all payslips for a given run
 */
export const listPayslipsForRun = async (req, res) => {
    try {
        const { runId } = req.params;

        const slips = await Payslip.find({ payrollRun: runId })
            .sort({ fullName: 1 })
            .lean();

        return res.json({ ok: true, payslips: slips });
    } catch (err) {
        console.error("Error loading payslips for run:", err);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
};
