const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    empId: { type: String, required: true },
    name: { type: String, required: true },
    category: {
        type: String,
        enum: ['Government', 'Educational', 'Personal', 'Experience'],
        required: true
    },
    fileUrl: { type: String, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected'],
        default: 'Pending'
    },
    rejectionReason: { type: String },
    size: { type: String }, // e.g. "1.2 MB"
    uploadedOn: { type: Date, default: Date.now }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Document', documentSchema);
