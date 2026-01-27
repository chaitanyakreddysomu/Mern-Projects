const mongoose = require('mongoose');

const salaryStructureSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g. "Entry Level"
    minSalary: { type: Number, required: true }, // Yearly Package Range Min
    maxSalary: { type: Number, required: true }, // Yearly Package Range Max
    earnings: [{
        label: { type: String, required: true }, // e.g. "Basic Salary", "HRA"
        type: { type: String, enum: ['Percentage', 'Fixed'], required: true },
        value: { type: Number, required: true }, // e.g. 50 (for 50%), 1000 (for fixed)
        baseComponent: { type: String, enum: ['Gross', 'Basic'], default: 'Gross' }
    }],
    deductions: [{
        label: { type: String, required: true },
        type: { type: String, enum: ['Percentage', 'Fixed'], required: true },
        value: { type: Number, required: true },
        baseComponent: { type: String, enum: ['Gross', 'Basic'], default: 'Gross' }
    }]
}, { timestamps: true });

module.exports = mongoose.model('SalaryStructure', salaryStructureSchema);
