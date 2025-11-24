import Salary from "../models/Salary.js";
import Payroll from "../models/Payroll.js";

export async function generatePayrollForMonth(month, year) {
    const salaries = await Salary.find().populate("employee");
    const created = [];

    for (const sal of salaries) {
        // unique index will protect duplicates, but check to skip gracefully
        const exists = await Payroll.findOne({ employee: sal.employee._id, month, year });
        if (exists) continue;

        const record = await Payroll.create({
            employee: sal.employee._id,
            month,
            year,
            salaryIssued: sal.amount
        });
        created.push(record);
    }

    return created;
}
