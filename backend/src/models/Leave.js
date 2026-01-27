const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String },
    type: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    appliedOn: { type: Date, default: Date.now },
    rejectionReason: { type: String }
}, { timestamps: true });

// Performance Indexes
leaveSchema.index({ userId: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ appliedOn: -1 });

module.exports = mongoose.model('Leave', leaveSchema);
