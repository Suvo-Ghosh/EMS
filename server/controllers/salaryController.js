import Salary from "../models/Salary.js";
import User from "../models/User.js"; 

export const assignSalary = async (req, res) => {
    try {
        const { employeeId, amount } = req.body;
        if (!employeeId || !amount) return res.status(400).json({ msg: "employeeId and amount required" });

        const user = await User.findById(employeeId);
        if (!user) return res.status(404).json({ msg: "Employee not found" });

        const existing = await Salary.findOne({ employee: employeeId });
        if (existing) return res.status(400).json({ msg: "Salary already assigned" });

        const salary = await Salary.create({ employee: employeeId, amount });
        res.json({ msg: "Assigned", salary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateSalary = async (req, res) => {
    try {
        const { amount } = req.body;
        const salary = await Salary.findOneAndUpdate({ employee: req.params.employeeId }, { amount, effectiveFrom: new Date() }, { new: true, upsert: false });
        if (!salary) return res.status(404).json({ msg: "Salary record not found" });
        res.json({ msg: "Updated", salary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getSalary = async (req, res) => {
    try {
        const salary = await Salary.findOne({ employee: req.params.employeeId }).populate("employee", "name email");
        if (!salary) return res.status(404).json({ msg: "Salary not set" });
        res.json(salary);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
