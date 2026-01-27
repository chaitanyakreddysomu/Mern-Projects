const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // e.g. EMP001
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'HR', 'EMPLOYEE'], default: 'EMPLOYEE' },
    designation: { type: String },
    department: { type: String },
    package: { type: Number, default: 0 }, // Annual Package
    status: { type: String, enum: ['Active', 'Inactive', 'Pending', 'Rejected'], default: 'Pending' },
    joiningDate: { type: Date },
    phone: { type: String },
    address: { type: String },
    dob: { type: Date },
    bloodGroup: { type: String },
    emergencyContact: {
        name: String,
        phone: String
    },
    uan: { type: String },
    bankDetails: {
        holderName: String,
        accountNumber: String,
        ifsc: String,
        bankName: String,
        branch: String
    },
    projectStatus: { type: String, enum: ['In Project', 'Bench', 'Training'], default: 'Bench' },
    documents: [{
        category: String,
        name: String,
        docId: String,
        path: String,
        status: { type: String, enum: ['Verified', 'Rejected', 'Review'], default: 'Review' },
        rejectionReason: String,
        uploadedAt: Date
    }],
    pushSubscriptions: [{ type: Object }], // Legacy Web Push
    fcmTokens: [{
        token: { type: String },
        device: { type: String },
        lastActive: { type: Date, default: Date.now }
    }],
    profileImage: { type: String }, // URL from Supabase
    fcmToken: { type: String, default: null } // Legacy/Single device fallback
}, { timestamps: true });

// Performance Indexes
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ department: 1 });
userSchema.index({ projectStatus: 1 });

module.exports = mongoose.model('User', userSchema);
