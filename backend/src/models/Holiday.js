const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    type: {
        type: String, // Holiday, National, Festival, Event
        required: true,
        enum: ['Holiday', 'National', 'Festival', 'Event'],
        default: 'Holiday'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Holiday', holidaySchema);
