import Employee from "../models/Employee.js";

export const generateNextEmployeeCode = async () => {
    // Find the last created employee (by createdAt)
    const lastEmp = await Employee.findOne({})
        .sort({ createdAt: -1 })
        .lean();

    if (!lastEmp || !lastEmp.employeeCode) {
        // first one:
        return "HTEMP101";
    }

    const match = lastEmp.employeeCode.match(/^HTEMP(\d+)$/);

    const lastNumber = match ? parseInt(match[1], 10) : 100; // fallback
    const nextNumber = lastNumber + 1;

    return `HTEMP${nextNumber}`;
};
