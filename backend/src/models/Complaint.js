const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: String,
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['Open', 'Investigating', 'Resolved'], default: 'Open' },
    date: { type: Date, default: Date.now },
    department: String
});

// Performance Indexes
complaintSchema.index({ userId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ date: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
