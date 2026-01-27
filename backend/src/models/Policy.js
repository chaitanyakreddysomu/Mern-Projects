const mongoose = require('mongoose');

const policyItemSchema = new mongoose.Schema({
    label: { type: String, required: true },
    value: { type: String, required: true }
}, { _id: false });

const policySchema = new mongoose.Schema({
    title: { type: String, required: true },
    iconName: { type: String, default: 'BookOpen' },
    items: [policyItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Policy', policySchema);
