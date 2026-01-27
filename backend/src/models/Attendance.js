const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    date: { type: Date, required: true },
    punchIn: { type: String },
    punchOut: { type: String },
    totalHours: { type: Number },
    locationIn: {
        lat: Number,
        lng: Number
    },
    locationOut: {
        lat: Number,
        lng: Number
    },
    status: { type: String, enum: ['Present', 'Absent', 'Late', 'Half Day', 'WFH', 'On Leave'], default: 'Absent' }
}, { timestamps: true });

// Performance Indexes
attendanceSchema.index({ userId: 1, date: -1 }); // Most common access pattern
attendanceSchema.index({ date: 1 }); // Range queries

module.exports = mongoose.model('Attendance', attendanceSchema);
