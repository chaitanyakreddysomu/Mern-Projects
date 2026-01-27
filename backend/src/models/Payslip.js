const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema({
    empId: { type: String, required: true },
    name: { type: String },
    month: { type: String, required: true },
    year: { type: String, required: true },
    netPay: { type: Number, required: true },
    status: { type: String, enum: ['Draft', 'Created', 'Paid'], default: 'Draft' },
    generatedOn: { type: Date, default: Date.now },

    // Details
    basicSalary: Number,
    pf: Number,
    esi: Number,
    pt: Number,
    tds: Number,
    leavesTaken: { type: Number, default: 0 },
    leaveDeduction: { type: Number, default: 0 },
    totalWorkingDays: { type: Number, default: 30 },
    paidDays: { type: Number, default: 30 },
    startDate: String,
    endDate: String
}, { timestamps: true });

module.exports = mongoose.model('Payslip', payslipSchema);
