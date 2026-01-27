const Payslip = require('../models/Payslip');
const User = require('../models/User');

exports.createPayslip = async (req, res) => {
    try {
        const payslip = new Payslip(req.body);
        await payslip.save();
        res.status(201).json(payslip);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getPayslips = async (req, res) => {
    try {
        const query = req.user.role === 'EMPLOYEE' ? { empId: req.user.id } : {};
        if (req.query.month) query.month = req.query.month;
        if (req.query.year) query.year = req.query.year;

        const payslips = await Payslip.find(query).sort({ generatedOn: -1 }).lean();

        // Enrich with profile images
        const userIds = [...new Set(payslips.map(p => p.empId))];
        const users = await User.find({ id: { $in: userIds } }).select('id profileImage avatar');
        const userMap = {};
        users.forEach(u => userMap[u.id] = u);

        const enrichedPayslips = payslips.map(p => ({
            ...p,
            profileImage: userMap[p.empId]?.profileImage,
            avatar: userMap[p.empId]?.avatar
        }));

        res.json(enrichedPayslips);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updatePayslip = async (req, res) => {
    try {
        const updated = await Payslip.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getPayslipById = async (req, res) => {
    try {
        const payslip = await Payslip.findById(req.params.id);
        if (!payslip) return res.status(404).json({ message: "Payslip not found" });

        // Security check for employees
        if (req.user.role === 'EMPLOYEE' && payslip.empId !== req.user.id) {
            return res.status(403).json({ message: "Access Denied" });
        }

        res.json(payslip);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
