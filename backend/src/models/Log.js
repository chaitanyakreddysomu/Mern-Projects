const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    action: { type: String, required: true },
    module: { type: String, required: true },
    description: { type: String },
    user: {
        id: String,
        name: String,
        role: String,
        profileImage: String
    },
    severity: { type: String, enum: ['Info', 'Warning', 'Error', 'Success'], default: 'Info' },
    ipAddress: String
});

// Performance Indexes
logSchema.index({ timestamp: -1 });
logSchema.index({ 'user.id': 1 }); // Searching logs by user
logSchema.index({ module: 1 }); // Filtering by module

module.exports = mongoose.model('Log', logSchema);
