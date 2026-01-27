const User = require('../models/User');
const supabase = require('../config/supabase');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave'); // Assuming this exists, based on previous steps
const Document = require('../models/Document');
const Holiday = require('../models/Holiday');
const Policy = require('../models/Policy');
const Notification = require('../models/Notification');
const Payslip = require('../models/Payslip');
const Complaint = require('../models/Complaint');
const SalaryStructure = require('../models/SalaryStructure');
const webpush = require('web-push');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

// Configure Web Push (Ensure keys are loaded)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:hr@company.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

exports.getAdminDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);

        // 1. STAT CARDS
        // Total Staff
        const totalStaff = await User.countDocuments({ status: 'Active' });

        // New Hires (Last 30 days)
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const newHires = await User.countDocuments({ joiningDate: { $gte: thirtyDaysAgo } });

        // Present Today
        const presentToday = await Attendance.countDocuments({
            date: { $gte: today },
            status: { $in: ['Present', 'Late', 'Half Day'] }
        });

        // Present Yesterday (for trend)
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const presentYesterday = await Attendance.countDocuments({
            date: { $gte: yesterday, $lt: today },
            status: { $in: ['Present', 'Late', 'Half Day'] }
        });
        const presentTrend = presentToday - presentYesterday;

        // On Bench
        const onBench = await User.countDocuments({ projectStatus: 'Bench', status: 'Active' });
        // Trend for Bench (mock logic or comparison with snapshot if we had it. For now, static or 0 change)

        // System Alerts (Mock based on Leaves pending)
        const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });

        // 2. CHARTS - RESOURCE UTILIZATION
        const inProject = await User.countDocuments({ projectStatus: 'In Project', status: 'Active' });
        // Assuming 'Training' is not a status yet, or we treat undefined as Bench? Just mapping existing statuses.
        // Dashboard uses: In Project, On Bench, Training.
        // User model has: In Project, Bench. I'll stick to these.

        const resourceUtilization = [
            { name: "In Project", value: inProject, color: "#10b981" },
            { name: "On Bench", value: onBench, color: "#f59e0b" },
            // { name: "Training", value: 0, color: "#6366f1" } 
        ];

        // 3. CHARTS - ATTENDANCE DISTRIBUTION (Today)
        const absentToday = totalStaff - presentToday; // Simple approximation
        // Or query explicit absents if attendance records are created for everyone daily.
        // Ideally:
        const attendanceDistribution = [
            { name: "Present", value: presentToday, color: "#22c55e" },
            { name: "Absent", value: absentToday > 0 ? absentToday : 0, color: "#ef4444" },
            // { name: "WFH", value: 0, color: "#3b82f6" }
        ];

        // 4. CHARTS - ATTENDANCE TREND (Last 7 Days)
        const attendanceTrend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const nextD = new Date(d);
            nextD.setDate(d.getDate() + 1);

            const count = await Attendance.countDocuments({
                date: { $gte: d, $lt: nextD },
                status: { $in: ['Present', 'Late', 'Half Day'] }
            });

            attendanceTrend.push({
                date: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
                present: count,
                note: d.getDay() === 0 ? "Sunday" : null
            });
        }


        // Construct Response
        const responseData = {
            kpi: {
                totalStaff: { value: totalStaff, trend: `+${newHires} (New Hires)` },
                presentToday: { value: presentToday, trend: `${presentTrend >= 0 ? '+' : ''}${presentTrend} vs yesterday` },
                onBench: { value: onBench, trend: "Stable" },
                systemAlerts: { value: pendingLeaves, trend: `${pendingLeaves} Pending Leaves` } // Using Pending Leaves as alerts
            },
            charts: {
                attendanceDistribution,
                attendanceTrend,
                resourceUtilization
            },
            quickActions: {
                pendingApprovals: pendingLeaves,
                alerts: 0 // Placeholder
            }
        };

        res.json(responseData);

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getAdminProfile = async (req, res) => {
    try {
        const user = await User.findOne({ id: req.user.id }).select('-password');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        console.error("Get Admin Profile Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateAdminProfile = async (req, res) => {
    try {
        const updates = req.body;
        // Prevent sensitive field changes
        delete updates.id;
        delete updates.role;
        delete updates.status;
        delete updates.password;
        delete updates.email; // Email usually requires verification to change

        const user = await User.findOneAndUpdate(
            { id: req.user.id },
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({
            message: "Profile updated successfully",
            user: {
                _id: user._id,
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                designation: user.designation,
                department: user.department,
                status: user.status,
                phone: user.phone,
                projectStatus: user.projectStatus,
                address: user.address,
                bloodGroup: user.bloodGroup,
                dob: user.dob,
                uan: user.uan,
                emergencyContact: user.emergencyContact,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error("Update Admin Profile Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getAdminBankDetails = async (req, res) => {
    try {
        const user = await User.findOne({ id: req.user.id }).select('bankDetails');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user.bankDetails || {});
    } catch (error) {
        console.error("Get Admin Bank Details Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Identify user
        const user = await User.findOne({ id: req.user.id });
        if (!user) return res.status(404).json({ message: "User not found" });

        const empId = user.id; // e.g., EMP001
        const fileName = `${empId}.jpg`; // User requested format

        // Check/Create bucket
        const { data: buckets, error: listBucketError } = await supabase.storage.listBuckets();

        if (listBucketError) {
            console.error("List Buckets Error:", listBucketError);
        }

        if (!buckets || !buckets.find(b => b.name === 'profile-images')) {
            await supabase.storage.createBucket('profile-images', { public: true });
        }

        const { error: uploadError } = await supabase.storage
            .from('profile-images')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (uploadError) {
            console.error("Supabase Upload Error:", uploadError);
            return res.status(500).json({ message: "Image upload failed" });
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('profile-images')
            .getPublicUrl(fileName);

        // Save to DB
        user.profileImage = publicUrl;
        await user.save();

        res.json({ profileImage: publicUrl, message: "Profile image updated" });

    } catch (error) {
        console.error("Upload Logic Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getPendingRequests = async (req, res) => {
    try {
        const { search, role } = req.query;
        let query = { status: 'Pending' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        if (role && role !== 'ALL') {
            query.role = role;
        }

        const requests = await User.find(query).select('-password');
        res.json(requests);
    } catch (error) {
        console.error("Get Pending Requests Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getRequestById = async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id }).select('-password');
        if (!user) return res.status(404).json({ message: "Request not found" });
        res.json(user);
    } catch (error) {
        console.error("Get Request By ID Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.query; // approve or reject

        if (!['approve', 'reject'].includes(status)) {
            return res.status(400).json({ message: "Invalid status action. Use 'approve' or 'reject'." });
        }

        const newStatus = status === 'approve' ? 'Active' : 'Rejected';

        const user = await User.findOneAndUpdate(
            { id: id },
            { status: newStatus },
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: "Request not found" });

        res.json({ message: `Request ${status}ed successfully`, user });

        // Log the action
        await logger.logAction(
            req,
            req.user, // The admin performing the action
            'Employee Management',
            status === 'approve' ? 'Approve' : 'Reject',
            `${status === 'approve' ? 'Approved' : 'Rejected'} registration request for ${user.name} (${user.id})`,
            status === 'approve' ? 'Success' : 'Warning'
        );

    } catch (error) {
        console.error("Update Request Status Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
// Payslip Management
exports.createPayslip = async (req, res) => {
    try {
        const {
            empId, name, month, year, status,
            basicSalary, pf, esi, pt, tds,
            startDate, endDate, totalWorkingDays, paidDays, leavesTaken, leaveDeduction
        } = req.body;

        const newPayslip = new Payslip({
            empId, name, month, year, status: status || 'Draft',
            netPay: req.body.netPay,
            basicSalary, pf, esi, pt, tds,
            startDate, endDate, totalWorkingDays, paidDays, leavesTaken, leaveDeduction,
            generatedOn: new Date()
        });

        await newPayslip.save();
        res.status(201).json(newPayslip);
    } catch (error) {
        console.error("Create Payslip Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getAdminPayslips = async (req, res) => {
    try {
        const { month, year, status, search } = req.query;
        let query = {};

        if (month && month !== 'All') query.month = month;
        if (year && year !== 'All') query.year = year;
        if (status && status !== 'All') query.status = status;

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { empId: { $regex: search, $options: 'i' } }
            ];
        }

        const payslips = await Payslip.find(query).sort({ generatedOn: -1 }).lean();

        const userIds = [...new Set(payslips.map(p => p.empId))];
        const users = await User.find({ id: { $in: userIds } }).select('id profileImage avatar');
        const userMap = {};
        users.forEach(u => userMap[u.id] = u);

        const enrichedPayslips = payslips.map(p => ({
            ...p,
            profileImage: userMap[p.empId]?.profileImage,
            avatar: userMap[p.empId]?.avatar
        }));

        res.json(enrichedPayslips);
    } catch (error) {
        console.error("Get Payslips Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getPayslipById = async (req, res) => {
    try {
        const payslip = await Payslip.findById(req.params.id);
        if (!payslip) return res.status(404).json({ message: "Payslip not found" });
        res.json(payslip);
    } catch (error) {
        console.error("Get Payslip By ID Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updatePayslip = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.query;
        const updates = req.body;

        if (status) {
            updates.status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        } else if (updates.status) {
            updates.status = updates.status.charAt(0).toUpperCase() + updates.status.slice(1).toLowerCase();
        }

        // Get original payslip to check status change
        const originalPayslip = await Payslip.findById(id);
        if (!originalPayslip) return res.status(404).json({ message: "Payslip not found" });

        const updatedPayslip = await Payslip.findByIdAndUpdate(id, updates, { new: true });

        // --- NOTIFICATION LOGIC ---
        try {
            // Check if status changed
            if (updatedPayslip.status !== originalPayslip.status) {
                const empId = updatedPayslip.empId;
                // Assuming we search user by custom ID 'id' not _id
                const user = await User.findOne({ id: empId });

                if (user) {
                    const { month, year, status } = updatedPayslip;
                    let notifTitle = "";
                    let notifMessage = "";

                    if (status === 'Created' && originalPayslip.status === 'Draft') {
                        notifTitle = "Payslip Generated";
                        notifMessage = `Your payslip for ${month}, ${year} has been generated.`;
                    } else if (status === 'Paid') {
                        notifTitle = "Salary Credited";
                        notifMessage = `Your salary for ${month}, ${year} has been credited and payslip is updated.`;
                    }

                    if (notifTitle) {
                        // 1. Create DB Notification
                        await Notification.create({
                            title: notifTitle,
                            message: notifMessage,
                            to: user.id,
                            source: 'SYSTEM',
                            type: status === 'Paid' ? 'success' : 'info'
                        });

                        // 2. Send FCM Push Notification
                        const tokens = [];
                        if (user.fcmTokens && user.fcmTokens.length > 0) {
                            user.fcmTokens.forEach(t => tokens.push(t.token));
                        } else if (user.fcmToken) {
                            tokens.push(user.fcmToken);
                        }

                        const uniqueTokens = [...new Set(tokens.filter(t => t && t.length > 0))];

                        if (uniqueTokens.length > 0) {
                            try {
                                const admin = require('../config/firebase');
                                // Ensure admin is initialized and check messaging
                                if (admin && admin.messaging) {
                                    // Validate token format briefly or just send
                                    await admin.messaging().sendEachForMulticast({
                                        notification: {
                                            title: notifTitle,
                                            body: notifMessage
                                        },
                                        tokens: uniqueTokens
                                    });
                                }
                            } catch (fcmError) {
                                console.error("FCM Error (Payslip):", fcmError);
                            }
                        }
                    }
                }
            }
        } catch (notifError) {
            console.error("Notification Logic Failed:", notifError);
            // Non-blocking error, continue to respond
        }

        res.json(updatedPayslip);
    } catch (error) {
        console.error("Update Payslip Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.deletePayslip = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Payslip.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Payslip not found" });
        res.json({ message: "Payslip deleted successfully" });
    } catch (error) {
        console.error("Delete Payslip Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.calculatePayslipStats = async (req, res) => {
    try {
        const { empId, month, year } = req.query;
        if (!empId || !month || !year) return res.status(400).json({ message: "Missing params" });

        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const mIndex = months.indexOf(month);

        const start = new Date(year, mIndex, 1);
        const end = new Date(year, mIndex + 1, 0, 23, 59, 59);

        const leavesCount = await Attendance.countDocuments({
            userId: empId,
            date: { $gte: start, $lte: end },
            status: { $in: ['On Leave', 'Absent'] }
        });

        const totalDays = end.getDate();

        res.json({
            leavesTaken: leavesCount,
            totalWorkingDays: totalDays,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        });

    } catch (error) {
        console.error("Calculate Payslip Stats Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Employee Management Logic

exports.getAllEmployees = async (req, res) => {
    try {
        const { role, status, projectStatus } = req.query;
        let query = {};

        // 1. Mandatory Filter: REMOVED to allow all statuses (including Rejected/Pending if needed)
        // query.status = { $in: ['Active', 'Inactive'] };

        // 2. Filter by Role
        if (role && role !== 'All' && role !== 'ALL') {
            if (role.includes(',')) {
                const roles = role.split(',').map(r => new RegExp(`^${r.trim()}$`, 'i'));
                query.role = { $in: roles };
            } else {
                query.role = { $regex: new RegExp(`^${role}$`, 'i') };
            }
        }

        // 3. Filter by Status
        if (status && status !== 'All' && status !== 'ALL') {
            query.status = { $regex: new RegExp(`^${status}$`, 'i') };
        }

        // 4. Filter by Project Status
        if (projectStatus && projectStatus !== 'All' && projectStatus !== 'ALL') {
            query.projectStatus = { $regex: new RegExp(`^${projectStatus}$`, 'i') };
        }

        const employees = await User.find(query)
            .select('-password -documents -pushSubscriptions -fcmTokens -__v')
            .lean();
        res.json(employees);
    } catch (error) {
        console.error("Get All Employees Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getEmployeeById = async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id }).select('-password');
        if (!user) return res.status(404).json({ message: "Employee not found" });
        res.json(user);
    } catch (error) {
        console.error("Get Employee By ID Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Exclude immutable fields
        delete updates._id;
        delete updates.id; // Prevent changing the custom ID
        delete updates.createdAt;
        delete updates.updatedAt;
        delete updates.__v; // Prevent VersionError

        // Handle Password Reset
        if (updates.password && updates.password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(updates.password.trim(), salt);
        } else {
            // Ensure we don't accidentally overwrite password with empty string or null if they sent it empty
            delete updates.password;
        }

        // Handle Date fields
        if (updates.dob === "") updates.dob = null;
        if (updates.joiningDate === "") updates.joiningDate = null;

        console.log("Updating User:", id, Object.keys(updates));

        const user = await User.findOneAndUpdate(
            { id: id },
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: "Employee not found" });

        res.json({ message: "Employee updated successfully", user });
    } catch (error) {
        console.error("Update Employee Error:", error);
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ message: error.message });
        }
        // Return actual error message for debugging
        res.status(500).json({ message: error.message || "Server Error" });
    }
};

// Document Management
exports.getDocumentsOverview = async (req, res) => {
    try {
        const { search, status } = req.query; // status: 'pending', 'verified', 'all'

        // 1. Overall Stats
        const allDocs = await Document.find({});
        const stats = {
            total: allDocs.length,
            verified: allDocs.filter(d => d.status === 'Verified').length,
            pending: allDocs.filter(d => d.status === 'Pending').length,
            rejected: allDocs.filter(d => d.status === 'Rejected').length
        };

        // 2. Filter Users
        let userQuery = {};
        if (search) {
            userQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { id: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(userQuery).select('id name role department designation status');

        // 3. Map Docs to Users
        let employees = users.map(user => {
            const userDocs = allDocs.filter(d => d.empId === user.id);
            const pendingCount = userDocs.filter(d => d.status === 'Pending').length;

            return {
                id: user.id,
                name: user.name,
                role: user.role,
                department: user.department || 'N/A',
                designation: user.designation || 'N/A',
                uploads: userDocs.length,
                pending: pendingCount,
                status: user.status,
                docStatus: pendingCount > 0 ? 'Pending Cases' : (userDocs.length > 0 ? 'All Verified' : 'No Uploads')
            };
        });

        // 4. precise filtering
        if (status && status.toLowerCase() !== 'all') {
            if (status.toLowerCase() === 'pending') {
                employees = employees.filter(e => e.pending > 0);
            } else if (status.toLowerCase() === 'verified') {
                employees = employees.filter(e => e.uploads > 0 && e.pending === 0);
            }
        } else {
            // Default: Filter out those with 0 uploads to keep view clean? 
            // Or show all? The frontend "filteredEmployees" logic showed only those with > 0 uploads.
            employees = employees.filter(e => e.uploads > 0);
        }

        res.json({ stats, employees });
    } catch (error) {
        console.error("Get Documents Overview Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getEmployeeDocuments = async (req, res) => {
    try {
        const { empId } = req.params;

        // 1. Fetch User Details
        const user = await User.findOne({ id: empId }).select('id name role designation department');
        if (!user) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // 2. Fetch All Documents
        const docs = await Document.find({ empId });

        // 3. Group Documents
        const groupedDocs = {
            personalDetails: {
                id: user.id,
                name: user.name,
                role: user.role,
                designation: user.designation,
                department: user.department
            },
            government: docs.filter(d => d.category === 'Government'),
            educational: docs.filter(d => d.category === 'Educational'),
            personal: docs.filter(d => d.category === 'Personal'),
            experience: docs.filter(d => d.category === 'Experience')
        };

        res.json(groupedDocs);
    } catch (error) {
        console.error("Get Employee Docs Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateDocumentStatus = async (req, res) => {
    try {
        let docId = req.params.id;
        if (req.params.docId) {
            docId = req.params.docId;
        }

        const { status, reason } = req.body; // Verified / Rejected

        const updates = { status };
        if (status === 'Rejected' && reason) {
            updates.rejectionReason = reason;
        }

        const doc = await Document.findByIdAndUpdate(
            docId,
            updates,
            { new: true }
        );

        if (!doc) return res.status(404).json({ message: "Document not found" });

        // --- Notification Logic ---
        try {
            // Match logic from creation/payslips: Find User by String ID (empId matches user.id)
            const user = await User.findOne({ id: doc.empId });

            if (user) {
                let notifTitle = "";
                let notifMessage = "";
                let notifType = "info";

                if (status === 'Verified') {
                    notifTitle = `${doc.name} Approved`;
                    notifMessage = `Congratulations 🎉 your ${doc.name} is approved by admin`;
                    notifType = 'success';
                } else if (status === 'Rejected') {
                    notifTitle = `${doc.name} Rejected`;
                    notifMessage = `Oh no! Your ${doc.name} is rejected and reason is ${reason || 'Not specified'} please reupload it`;
                    notifType = 'alert';
                }

                if (notifTitle) {
                    console.log(`[DocumentNotification] Sending '${notifTitle}' to User ID: ${user.id}`);

                    // 1. DB Notification
                    await Notification.create({
                        title: notifTitle,
                        message: notifMessage,
                        to: user.id,
                        source: 'ADMIN',
                        type: notifType
                    });

                    // 2. Push Notification
                    const tokens = [];
                    // Prioritize Multi-device tokens
                    if (user.fcmTokens && user.fcmTokens.length > 0) {
                        user.fcmTokens.forEach(t => {
                            if (t.token) tokens.push(t.token)
                        });
                        console.log(`[DocumentNotification] Found ${tokens.length} tokens in fcmTokens array`);
                    }

                    // Fallback to legacy single token if no array tokens found
                    if (tokens.length === 0 && user.fcmToken) {
                        tokens.push(user.fcmToken);
                        console.log(`[DocumentNotification] Using legacy fcmToken`);
                    }

                    const uniqueTokens = [...new Set(tokens.filter(t => t && t.length > 0))];

                    if (uniqueTokens.length > 0) {
                        try {
                            const admin = require('../config/firebase');
                            // Check if admin is initialized properly (function vs object)
                            if (admin && typeof admin.messaging === 'function') {
                                const response = await admin.messaging().sendEachForMulticast({
                                    notification: {
                                        title: notifTitle,
                                        body: notifMessage
                                    },
                                    tokens: uniqueTokens
                                });
                                console.log(`[DocumentNotification] FCM Sent: ${response.successCount} success, ${response.failureCount} failure`);
                                if (response.failureCount > 0) {
                                    response.responses.forEach((resp, idx) => {
                                        if (!resp.success) {
                                            console.error(`[FCM Failure] Token: ${uniqueTokens[idx]} - Error: ${resp.error}`);
                                        }
                                    });
                                }
                            } else {
                                console.warn("[DocumentNotification] Firebase Admin not initialized correctly or missing credentials.");
                            }
                        } catch (fcmError) {
                            console.error("[DocumentNotification] FCM Execution Error:", fcmError);
                        }
                    } else {
                        console.log("[DocumentNotification] No valid FCM tokens found for user.");
                    }
                }
            } else {
                console.warn(`[DocumentNotification] User ${doc.empId} not found, cannot send notification.`);
            }
        } catch (notifError) {
            console.error("[DocumentNotification] Logic Failed:", notifError);
        }

        res.json({ message: "Status updated", doc });
    } catch (error) {
        console.error("Update Doc Status Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.getAttendanceRecords = async (req, res) => {
    try {
        const { date, search, sortBy, order } = req.query;

        // FIX: Use specific date string logic to match UTC boundaries
        console.log("Req Query:", req.query);
        const targetDateStr = date || new Date().toISOString().split('T')[0];
        console.log("Target Date String:", targetDateStr);
        const startOfDay = new Date(targetDateStr); // Defaults to UTC midnight for YYYY-MM-DD

        // Safety check
        if (isNaN(startOfDay.getTime())) {
            return res.status(400).json({ message: "Invalid date format" });
        }

        const endOfDay = new Date(targetDateStr);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // 1. Fetch all active employees (for stats base)
        const allActiveEmployees = await User.find({
            role: { $in: ['EMPLOYEE', 'HR'] },
            status: { $in: ['Active', 'Probation'] }
        }).select('id name email designation department avatar profileImage').lean();

        // 2. Fetch attendance for the date
        const allAttendance = await Attendance.find({
            date: { $gte: startOfDay, $lte: endOfDay }
        }).lean();

        const attendanceMap = {};
        allAttendance.forEach(att => {
            attendanceMap[att.userId] = att;
        });

        // 3. Calculate Stats
        const stats = {
            present: 0,
            late: 0,
            absent: 0,
            wfh: 0,
            leave: 0
        };

        allActiveEmployees.forEach(emp => {
            const att = attendanceMap[emp.id];
            // Default status is Absent if no record found
            let status = att ? att.status : 'Absent';

            if (status === 'Present') stats.present++;
            else if (status === 'Late') stats.late++;
            else if (status === 'WFH') stats.wfh++;
            else if (status === 'On Leave') stats.leave++;
            else if (status === 'Half Day') stats.present++;
            else stats.absent++;
        });

        // 4. Filter for Response List
        let records = allActiveEmployees.map(emp => {
            const att = attendanceMap[emp.id];
            return {
                id: emp.id,
                name: emp.name,
                email: emp.email,
                avatar: emp.avatar,
                profileImage: emp.profileImage,
                designation: emp.designation,
                department: emp.department,
                date: targetDateStr, // Use the requested date string
                debug_date: targetDateStr, // CONFIRMATION FIELD
                punchIn: att ? att.punchIn : '--',
                punchOut: att ? att.punchOut : '--',
                latitude: (att && att.locationIn) ? att.locationIn.lat : null,
                longitude: (att && att.locationIn) ? att.locationIn.lng : null,
                status: att ? att.status : 'Absent',
                timeWorking: att ? att.totalHours : null
            };
        });

        // Search Filter
        if (search) {
            const lowerSearch = search.toLowerCase();
            records = records.filter(rec =>
                rec.name.toLowerCase().includes(lowerSearch) ||
                rec.email.toLowerCase().includes(lowerSearch) ||
                rec.id.toLowerCase().includes(lowerSearch)
            );
        }

        // Sort
        if (sortBy) {
            records.sort((a, b) => {
                let valA = a[sortBy] || '';
                let valB = b[sortBy] || '';
                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();

                if (valA < valB) return order === 'desc' ? 1 : -1;
                if (valA > valB) return order === 'desc' ? -1 : 1;
                return 0;
            });
        }

        res.json({ stats, records });

    } catch (error) {
        console.error("Get Attendance Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getLeaveRequests = async (req, res) => {
    try {
        const { status, search, sortBy, order } = req.query;
        let query = {};

        // 1. Role Filter: Admin sees 'HR' and 'EMPLOYEE' leaves (Exclude Admin leaves)
        const targetIds = await User.find({ role: { $in: ['HR', 'EMPLOYEE'] } }).distinct('id');
        query.userId = { $in: targetIds };

        // Status Filter
        if (status && status.toLowerCase() !== 'all') {
            const statusArray = status.split(',').map(s => {
                const sLower = s.toLowerCase().trim();
                return sLower.charAt(0).toUpperCase() + sLower.slice(1);
            });
            query.status = { $in: statusArray };
        }

        // Search Filter
        if (search) {
            query.$or = [
                { userName: { $regex: search, $options: 'i' } },
                { userId: { $regex: search, $options: 'i' } }
            ];
        }

        // Fetch Leaves
        let leaves = await Leave.find(query).lean();

        // Enrich with Profile Image
        const userIds = [...new Set(leaves.map(l => l.userId))]; // specific userIds
        const users = await User.find({ id: { $in: userIds } }).select('id profileImage avatar').lean();
        const userMap = {};
        users.forEach(u => userMap[u.id] = u);

        leaves = leaves.map(leave => ({
            ...leave,
            profileImage: userMap[leave.userId]?.profileImage,
            avatar: userMap[leave.userId]?.avatar
        }));

        // Stats Calculation (Filtered by Role)
        const statsQuery = { userId: { $in: targetIds } };
        const total = await Leave.countDocuments(statsQuery);
        const approved = await Leave.countDocuments({ ...statsQuery, status: 'Approved' });
        const pending = await Leave.countDocuments({ ...statsQuery, status: 'Pending' });
        const rejected = await Leave.countDocuments({ ...statsQuery, status: 'Rejected' });

        const stats = {
            total,
            approved,
            pending,
            rejected
        };

        // Sort
        if (sortBy) {
            leaves.sort((a, b) => {
                let valA = a[sortBy];
                let valB = b[sortBy];

                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();

                if (valA < valB) return order === 'desc' ? 1 : -1;
                if (valA > valB) return order === 'desc' ? -1 : 1;
                return 0;
            });
        } else {
            // Default sort by Date (appliedOn)
            leaves.sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
        }

        res.json({ stats, leaves });
    } catch (error) {
        console.error("Get Leaves Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getLeaveRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const leave = await Leave.findById(id);
        if (!leave) return res.status(404).json({ message: "Leave request not found" });
        res.json(leave);
    } catch (error) {
        console.error("Get Leave By ID Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, action, rejectionReason } = req.body;

        let newStatus = status;
        if (!newStatus && (req.query.action || action)) {
            const act = req.query.action || action;
            if (act.toLowerCase() === 'approve') newStatus = 'Approved';
            if (act.toLowerCase() === 'reject') newStatus = 'Rejected';
        }

        if (!['Approved', 'Rejected'].includes(newStatus)) {
            if (newStatus !== 'Pending') {
                return res.status(400).json({ message: "Invalid status/action" });
            }
        }

        const updateData = { status: newStatus };
        if (newStatus === 'Rejected' && rejectionReason) {
            updateData.rejectionReason = rejectionReason;
        }

        const leave = await Leave.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!leave) return res.status(404).json({ message: "Leave request not found" });

        // --- NOTIFICATION LOGIC ---
        try {
            // Find User by userId stored in Leave model
            const user = await User.findOne({ id: leave.userId });

            if (user) {
                let notifTitle = "";
                let notifMessage = "";
                let notifType = "info";

                // Format dates for message
                const sDate = new Date(leave.startDate).toLocaleDateString();
                const eDate = new Date(leave.endDate).toLocaleDateString();
                const dateRange = sDate === eDate ? `on ${sDate}` : `from ${sDate} to ${eDate}`;

                const isWFH = leave.type === 'Work From Home' || leave.type === 'WFH';

                if (newStatus === 'Approved') {
                    if (isWFH) {
                        notifTitle = "WFH Approved";
                        notifMessage = `Your work from home request ${dateRange} is approved.`;
                    } else {
                        notifTitle = "Leave Approved";
                        notifMessage = `Your leave request for ${leave.type} ${dateRange} has been approved.`;
                    }
                    notifType = 'success';
                } else if (newStatus === 'Rejected') {
                    if (isWFH) {
                        notifTitle = "WFH Rejected";
                        notifMessage = `Your work from home request ${dateRange} is rejected. Reason: ${leave.rejectionReason || "Admin decision"}`;
                    } else {
                        notifTitle = "Leave Rejected";
                        notifMessage = `Your leave request ${dateRange} was rejected. Reason: ${leave.rejectionReason || "Admin decision"}`;
                    }
                    notifType = 'alert';
                }

                if (notifTitle) {
                    console.log(`[LeaveNotification] Sending '${notifTitle}' to User ID: ${user.id}`);

                    // 1. Create DB Notification
                    await Notification.create({
                        title: notifTitle,
                        message: notifMessage,
                        to: user.id,
                        source: 'ADMIN', // or SYSTEM
                        type: notifType,
                        date: new Date()
                    });

                    // 2. Send Push Notification
                    const tokens = [];
                    // Prioritize Multi-device tokens
                    if (user.fcmTokens && user.fcmTokens.length > 0) {
                        user.fcmTokens.forEach(t => {
                            if (t.token) tokens.push(t.token)
                        });
                        console.log(`[LeaveNotification] Found ${tokens.length} tokens in fcmTokens array`);
                    }

                    // Fallback to legacy single token
                    if (tokens.length === 0 && user.fcmToken) {
                        tokens.push(user.fcmToken);
                        console.log(`[LeaveNotification] Using legacy fcmToken`);
                    }

                    const uniqueTokens = [...new Set(tokens.filter(t => t && t.length > 0))];

                    if (uniqueTokens.length > 0) {
                        try {
                            const admin = require('../config/firebase');
                            // Check if admin is initialized properly
                            if (admin && typeof admin.messaging === 'function') {
                                const response = await admin.messaging().sendEachForMulticast({
                                    notification: {
                                        title: notifTitle,
                                        body: notifMessage
                                    },
                                    tokens: uniqueTokens
                                });
                                console.log(`[LeaveNotification] FCM Sent: ${response.successCount} success, ${response.failureCount} failure`);
                            } else {
                                console.warn("[LeaveNotification] Firebase Admin not initialized correctly.");
                            }
                        } catch (fcmError) {
                            console.error("[LeaveNotification] FCM Error:", fcmError);
                        }
                    } else {
                        console.log("[LeaveNotification] No valid FCM tokens found for user.");
                    }
                }
            }
        } catch (notifErr) {
            console.error("[LeaveNotification] Logic Failed:", notifErr);
        }
        // --- END NOTIFICATION LOGIC ---

        res.json({ message: `Leave ${newStatus}`, leave });
    } catch (error) {
        console.error("Update Leave Status Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getHolidays = async (req, res) => {
    try {
        const { month, year } = req.query;
        let query = {};

        if (month && year) {
            const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
            let mIndex;
            // Check if month is a number (1-12) or string (jan, feb...)
            if (!isNaN(month)) {
                mIndex = parseInt(month) - 1;
            } else {
                mIndex = months[month.toLowerCase().substring(0, 3)];
            }

            if (mIndex !== undefined) {
                const start = new Date(year, mIndex, 1);
                // End of month
                const end = new Date(year, mIndex + 1, 0, 23, 59, 59);

                // Overlap: holiday starts before month ends AND holiday ends after month starts
                query = {
                    startDate: { $lte: end },
                    endDate: { $gte: start }
                };
            }
        }

        const holidays = await Holiday.find(query).sort({ startDate: 1 });
        res.json(holidays);
    } catch (error) {
        console.error("Get Holidays Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.createHoliday = async (req, res) => {
    try {
        const { name, startDate, endDate, type } = req.body;
        if (!name || !startDate || !endDate) return res.status(400).json({ message: "Missing required fields" });

        const newHoliday = new Holiday({
            name,
            startDate,
            endDate,
            type: type || 'Holiday'
        });
        await newHoliday.save();

        // Notify all active users
        try {
            const activeUsers = await User.find({ status: 'Active' }); // Need fcmToken so remove select('id') or select id and fcmToken
            if (activeUsers.length > 0) {
                const sDate = new Date(startDate).toLocaleDateString();
                const eDate = new Date(endDate).toLocaleDateString();
                const notificationTitle = "New Holiday Added";

                let notificationMessage;
                if (sDate === eDate) {
                    notificationMessage = `A new holiday '${name}' has been added to the calendar on ${sDate}.`;
                } else {
                    notificationMessage = `A new holiday '${name}' has been added to the calendar from ${sDate} to ${eDate}.`;
                }

                const notifications = activeUsers.map(u => ({
                    title: notificationTitle,
                    message: notificationMessage,
                    to: u.id,
                    source: "SYSTEM",
                    type: "info",
                    date: new Date()
                }));

                await Notification.insertMany(notifications);

                // SEND PUSH NOTIFICATION (FCM)
                const tokens = activeUsers
                    .map(u => u.fcmToken)
                    .filter(token => token && token.length > 0);



                if (tokens.length > 0) {
                    const payload = {
                        notification: {
                            title: notificationTitle,
                            body: notificationMessage
                        },
                        tokens: tokens
                    };

                    try {
                        const admin = require('../config/firebase');
                        // Check if admin is initialized
                        if (admin && admin.messaging) {
                            // sendMulticast was removed in v13, use sendEachForMulticast
                            await admin.messaging().sendEachForMulticast(payload);
                        } else {
                            console.error('[CreateHoliday] Firebase Admin not initialized correctly.');
                        }
                    } catch (fcmError) {
                        console.error("[CreateHoliday] FCM Send Error:", fcmError);
                    }
                } else {
                    console.warn("[CreateHoliday] No FCM tokens found. Users need to visit the app to register tokens.");
                }
            }
        } catch (notifError) {
            console.error("Failed to send holiday notifications:", notifError);
            // Don't fail the request if notifications fail, simply log it.
        }

        res.status(201).json(newHoliday);
    } catch (error) {
        console.error("Create Holiday Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateHoliday = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedHoliday = await Holiday.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedHoliday) return res.status(404).json({ message: "Holiday not found" });
        res.json(updatedHoliday);
    } catch (error) {
        console.error("Update Holiday Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.deleteHoliday = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Holiday.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Holiday not found" });
        res.json({ message: "Holiday deleted" });
    } catch (error) {
        console.error("Delete Holiday Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getEmployeeBankDetails = async (req, res) => {
    try {
        const { search, role, status, department } = req.query;

        // Base Query
        let query = {};

        // 1. Role Filter
        if (role && role !== 'All' && role !== 'ALL') {
            query.role = { $regex: new RegExp(`^${role}$`, 'i') };
        } else {
            query.role = { $ne: 'ADMIN' };
        }

        // 2. Status Filter
        if (status && status !== 'All' && status !== 'ALL') {
            query.status = { $regex: new RegExp(`^${status}$`, 'i') };
        } else {
            query.status = { $ne: 'Pending' };
        }

        // 3. Department Filter
        if (department && department !== 'All' && department !== 'ALL') {
            query.department = { $regex: new RegExp(`^${department}$`, 'i') };
        }

        // 4. Search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { id: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { 'bankDetails.bankName': { $regex: search, $options: 'i' } },
                { 'bankDetails.holderName': { $regex: search, $options: 'i' } },
                { 'bankDetails.accountNumber': { $regex: search, $options: 'i' } }
            ];
        }

        const employees = await User.find(query).select('id name role designation bankDetails avatar profileImage department status email');

        // Stats calculation (Global)
        const totalEmployeesCount = await User.countDocuments({ role: { $ne: 'ADMIN' } });
        const bankAccountsAddedCount = await User.countDocuments({
            role: { $ne: 'ADMIN' },
            'bankDetails.accountNumber': { $exists: true, $ne: '' }
        });

        const employeeData = employees.map(emp => ({
            id: emp.id,
            name: emp.name,
            role: emp.role,
            designation: emp.designation,
            department: emp.department,
            email: emp.email,
            avatar: emp.avatar,
            profileImage: emp.profileImage,
            status: emp.status,
            bankDetails: emp.bankDetails || {}
        }));

        res.json({
            stats: {
                totalEmployees: totalEmployeesCount,
                bankAccountsAdded: bankAccountsAddedCount
            },
            employees: employeeData
        });

    } catch (error) {
        console.error("Get Bank Details Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// COMPANY POLICIES
exports.getPolicies = async (req, res) => {
    try {
        const policies = await Policy.find({});
        res.json(policies);
    } catch (error) {
        console.error("Get Policies Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.createPolicy = async (req, res) => {
    try {
        const { title, iconName, items } = req.body;
        if (!title || !items) return res.status(400).json({ message: "Title and items are required" });

        const newPolicy = new Policy({
            title,
            iconName: iconName || 'BookOpen',
            items
        });

        await newPolicy.save();

        // NOTIFY ALL USERS
        try {
            const users = await User.find({ status: 'Active' }).select('id pushSubscriptions');

            // 1. Database Notifications
            const notifications = users.map(u => ({
                title: "New Policy",
                message: `New policy added: ${title}`,
                to: u.id,
                source: 'System', // or 'HR'
                type: 'info',
                date: new Date()
            }));

            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }

            // 2. Push Notifications
            const payload = JSON.stringify({
                title: "New Policy",
                body: `A new policy "${title}" has been added to the portal.`,
                url: '/policies' // Assuming route
            });

            users.forEach(u => {
                if (u.pushSubscriptions && u.pushSubscriptions.length > 0) {
                    u.pushSubscriptions.forEach(sub => {
                        webpush.sendNotification(sub, payload).catch(e => {
                            // console.error("Push failed for user", u.id, e);
                        });
                    });
                }
            });

        } catch (notifyErr) {
            console.error("Policy Notification Error:", notifyErr);
            // Don't fail the request if notification fails
        }

        // LOG LOG
        await logger.logAction(req, req.user, 'Policy', 'Create', `Created policy: ${title}`, 'Success');

        res.status(201).json(newPolicy);
    } catch (error) {
        console.error("Create Policy Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updatePolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedPolicy = await Policy.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedPolicy) return res.status(404).json({ message: "Policy not found" });

        await logger.logAction(req, req.user, 'Policy', 'Update', `Updated policy: ${updatedPolicy.title}`, 'Success');

        res.json(updatedPolicy);
    } catch (error) {
        console.error("Update Policy Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.deletePolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Policy.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Policy not found" });

        await logger.logAction(req, req.user, 'Policy', 'Delete', `Deleted policy ID: ${id}`, 'Warning');

        res.json({ message: "Policy deleted" });
    } catch (error) {
        console.error("Delete Policy Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// NOTIFICATIONS
exports.getAdminNotifications = async (req, res) => {
    try {
        const { sort } = req.query;
        let query = { to: req.user.id };

        if (sort && sort.includes('unread')) {
            query.read = false;
        }

        const notifications = await Notification.find(query).sort({ date: -1 });
        res.json(notifications);
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getSentNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ source: 'ADMIN' }).sort({ date: -1 }).lean();

        const recipientIds = [...new Set(notifications.map(n => n.to))];
        const users = await User.find({ id: { $in: recipientIds } }).select('id name');

        const userMap = {};
        users.forEach(u => userMap[u.id] = u.name);

        const enrichedNotifications = notifications.map(n => ({
            ...n,
            to: userMap[n.to] ? `${n.to} (${userMap[n.to]})` : n.to
        }));

        res.json(enrichedNotifications);
    } catch (error) {
        console.error("Get Sent Notifications Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getNotificationById = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findById(id);
        if (!notification) return res.status(404).json({ message: "Notification not found" });

        // Ensure access (only recipient can view detail)
        if (notification.to !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.json(notification);
    } catch (error) {
        console.error("Get Notification By ID Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.createAdminNotification = async (req, res) => {
    try {
        const { title, message, targetAudience, selectedEmployeeIds, type } = req.body;
        // targetAudience: 'ALL', 'HR', 'ADMIN', 'SELECT_EMPLOYEES'

        if (!title || !message || !targetAudience) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        let recipients = [];
        let userRecords = [];

        if (targetAudience === 'ALL') {
            userRecords = await User.find({ status: 'Active' });
        } else if (targetAudience === 'HR') {
            userRecords = await User.find({ role: 'HR', status: 'Active' });
        } else if (targetAudience === 'ADMIN') {
            userRecords = await User.find({ role: 'ADMIN', status: 'Active' });
        } else if (targetAudience === 'SELECT_EMPLOYEES') {
            if (!selectedEmployeeIds || !selectedEmployeeIds.length) {
                return res.status(400).json({ message: "No employees selected" });
            }
            userRecords = await User.find({ id: { $in: selectedEmployeeIds } });
        }

        recipients = userRecords.map(u => u.id);

        // Create a notification for each recipient (DB)
        const notifications = recipients.map(userId => ({
            title,
            message,
            to: userId,
            source: 'ADMIN',
            type: type || 'info',
            date: new Date()
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        // NOTIFY HRs AS WELL (Shadow Notification)
        const hrs = await User.find({ role: 'HR', status: 'Active' });
        const hrNotifications = [];

        hrs.forEach(hr => {
            // Check if HR is already in the main recipient list
            const isRecipient = userRecords.find(u => u.id === hr.id);
            if (!isRecipient && hr.id !== req.user.id) {
                hrNotifications.push({
                    title: `Admin Broadcast: ${title}`,
                    message: `Admin sent a broadcast to ${notifications.length} recipients: "${message}"`,
                    to: hr.id,
                    source: 'ADMIN',
                    type: 'info',
                    date: new Date()
                });
            }
        });

        if (hrNotifications.length > 0) {
            await Notification.insertMany(hrNotifications);
        }

        // SEND PUSH NOTIFICATION (FCM)
        const tokens = [];

        // 1. Recipient Tokens
        userRecords.forEach(u => {
            if (u.fcmTokens && u.fcmTokens.length > 0) {
                u.fcmTokens.forEach(t => tokens.push(t.token));
            } else if (u.fcmToken) {
                tokens.push(u.fcmToken);
            }
        });

        // 2. HR Tokens (for shadow notifications or if they are recipients)
        // Note: If HR was a recipient, their token is already added above.
        // We only need to add tokens for HRs who were NOT recipients but got the shadow notification.
        hrs.forEach(hr => {
            const isRecipient = userRecords.find(u => u.id === hr.id);
            if (!isRecipient && hr.id !== req.user.id) {
                if (hr.fcmTokens && hr.fcmTokens.length > 0) {
                    hr.fcmTokens.forEach(t => tokens.push(t.token));
                } else if (hr.fcmToken) {
                    tokens.push(hr.fcmToken);
                }
            }
        });

        const uniqueTokens = [...new Set(tokens.filter(token => token && token.length > 0))];

        if (uniqueTokens.length > 0) {
            const payload = {
                notification: {
                    title: title,
                    body: message
                },
                tokens: tokens // Multicast
            };

            try {
                // We import admin lazily or check if it's available
                const admin = require('../config/firebase'); // Assuming this exports initialized admin
                if (admin.messaging) {
                    const response = await admin.messaging().sendMulticast(payload);
                    console.log('Successfully sent message:', response);
                    if (response.failureCount > 0) {
                        const failedTokens = [];
                        response.responses.forEach((resp, idx) => {
                            if (!resp.success) {
                                failedTokens.push(tokens[idx]);
                            }
                        });
                        console.log('List of tokens that caused failures: ' + failedTokens);
                        // TODO: Remove invalid tokens from DB if needed
                    }
                }
            } catch (fcmError) {
                console.error("FCM Send Error:", fcmError);
                // Don't fail the request if push fails, just log it
            }
        }

        res.status(201).json({ message: `Sent to ${notifications.length} recipients` });

    } catch (error) {
        console.error("Create Notification Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.saveFCMToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: "Token is required" });



        await User.findOneAndUpdate(
            { id: req.user.id },
            { fcmToken: token }, // Using the new field
            { new: true }
        );

        res.json({ message: "FCM Token updated" });
    } catch (error) {
        console.error("Save Token Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateNotificationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { markasread } = req.query;

        console.log(`[UpdateNotif] Attempting to update ${id}`);
        console.log(`[UpdateNotif] Req User:`, JSON.stringify(req.user)); // Log the whole user object

        const notification = await Notification.findById(id);
        if (!notification) {
            console.log(`[UpdateNotif] Notification ${id} not found.`);
            return res.status(404).json({ message: "Notification not found" });
        }

        console.log(`[UpdateNotif] Found Notif: ${notification._id}, To: '${notification.to}'`);

        // Check ownership (Case insensitive and trimmed)
        const notifTo = notification.to ? notification.to.trim().toLowerCase() : '';
        const userId = req.user.id ? req.user.id.trim().toLowerCase() : '';

        // Handle cases where ID might be in _id or other fields if standard ID is missing
        const fallbackUserId = req.user._id ? req.user._id.toString().trim().toLowerCase() : '';

        if (notifTo !== userId && notifTo !== fallbackUserId) {
            console.log(`[UpdateNotif] Access Denied. Notif Owner: '${notification.to}', Request User ID: '${req.user.id}', Fallback: '${req.user._id}'`);
            return res.status(403).json({ message: "Access denied" });
        }

        const update = {};
        if (markasread !== undefined || req.query.markasread === '') {
            update.read = true;
        }
        if (req.body && req.body.read === true) update.read = true;

        if (Object.keys(update).length === 0) {
            return res.json(notification); // No changes needed
        }

        notification.read = true;
        await notification.save();

        res.json(notification);
    } catch (error) {
        console.error("Update Notification Error:", error);
        // RETURN THE ACTUAL ERROR MESSAGE TO CLIENT FOR DEBUGGING
        res.status(500).json({ message: error.message });
    }
};



// COMPLAINTS
exports.getAdminComplaints = async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = {};

        if (status && status !== 'All') {
            const statusArray = status.split(',').map(s => s.trim());
            const statusRegex = statusArray.map(s => new RegExp(`^${s}$`, 'i'));
            query.status = { $in: statusRegex };
        }

        if (search) {
            query.$or = [
                { userName: { $regex: search, $options: 'i' } },
                { userId: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } }
            ];
        }

        const complaints = await Complaint.find(query).sort({ date: -1 }).lean();

        // Enrich with User Role & Avatar
        const userIds = [...new Set(complaints.map(c => c.userId))];
        const users = await User.find({ id: { $in: userIds } }).select('id role avatar profileImage');
        const userMap = {};
        users.forEach(u => userMap[u.id] = u);

        const enrichedComplaints = complaints.map(c => ({
            ...c,
            role: userMap[c.userId]?.role || 'EMPLOYEE', // Default to employee if unknown
            avatar: userMap[c.userId]?.avatar,
            profileImage: userMap[c.userId]?.profileImage
        }));

        res.json(enrichedComplaints);
    } catch (error) {
        console.error("Get Complaints Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getComplaintById = async (req, res) => {
    try {
        const { id } = req.params;
        const complaint = await Complaint.findById(id);
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });
        res.json(complaint);
    } catch (error) {
        console.error("Get Complaint By ID Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { update } = req.query; // ?update=resolved
        const { status } = req.body || {};

        let newStatus = status;
        if (!newStatus && update) {
            // Capitalize first letter properly to match Enum ['Open', 'Investigating', 'Resolved']
            newStatus = update.charAt(0).toUpperCase() + update.slice(1).toLowerCase();
        }

        const validStatuses = ['Open', 'Investigating', 'Resolved'];
        if (!validStatuses.includes(newStatus)) {
            // Try matching case insensitive if direct match failed
            const match = validStatuses.find(s => s.toLowerCase() === newStatus?.toLowerCase());
            if (match) newStatus = match;
            else return res.status(400).json({ message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
        }

        const complaint = await Complaint.findByIdAndUpdate(
            id,
            { status: newStatus },
            { new: true }
        );

        if (!complaint) return res.status(404).json({ message: "Complaint not found" });

        res.json(complaint);
    } catch (error) {
        console.error("Update Complaint Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Salary Structure Management
exports.createSalaryStructure = async (req, res) => {
    try {
        const newStructure = new SalaryStructure(req.body);
        await newStructure.save();
        res.status(201).json(newStructure);
    } catch (error) {
        console.error("Create Structure Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getSalaryStructures = async (req, res) => {
    try {
        const structures = await SalaryStructure.find().sort({ minSalary: 1 });
        res.json(structures);
    } catch (error) {
        console.error("Get Structures Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateSalaryStructure = async (req, res) => {
    try {
        const { id } = req.params;
        const structure = await SalaryStructure.findByIdAndUpdate(id, req.body, { new: true });
        if (!structure) return res.status(404).json({ message: "Structure not found" });
        res.json(structure);
    } catch (error) {
        console.error("Update Structure Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.deleteSalaryStructure = async (req, res) => {
    try {
        const { id } = req.params;
        await SalaryStructure.findByIdAndDelete(id);
        res.json({ message: "Structure deleted" });
    } catch (error) {
        console.error("Delete Structure Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getEmployeeSalaryDetails = async (req, res) => {
    try {
        const { empId } = req.params;
        // Search by custom 'id' (EMPxxx) first
        const user = await User.findOne({ id: empId });
        if (!user) return res.status(404).json({ message: "Employee not found" });

        const package = user.package || 0;
        const monthlyGross = package / 12;

        let structure;
        if (req.query.structureId) {
            structure = await SalaryStructure.findById(req.query.structureId);
        } else {
            structure = await SalaryStructure.findOne({
                minSalary: { $lte: package },
                maxSalary: { $gte: package }
            });
        }

        let breakdown = {
            basicSalary: 0,
            earnings: [],
            deductions: [],
            netPay: 0,
            package: package
        };

        if (structure) {
            let basicSalary = 0;

            // Calculate Basic
            const basicRule = structure.earnings.find(e => e.label.toLowerCase().includes('basic'));
            if (basicRule) {
                if (basicRule.type === 'Percentage') {
                    basicSalary = (monthlyGross * basicRule.value) / 100;
                } else {
                    basicSalary = basicRule.value;
                }
            } else {
                basicSalary = monthlyGross * 0.5;
            }
            breakdown.basicSalary = Math.round(basicSalary);

            // Calculate Earnings
            structure.earnings.forEach(rule => {
                let amount = 0;
                // If label is Basic Salary, we already calc'd it, but let's push it formatted
                // Careful not to double count if we just want to show list

                const base = rule.baseComponent === 'Basic' ? basicSalary : monthlyGross;

                if (rule.type === 'Percentage') {
                    amount = (base * rule.value) / 100;
                } else {
                    amount = rule.value;
                }

                breakdown.earnings.push({
                    label: rule.label,
                    amount: Math.round(amount)
                });
            });

            // Calculate Deductions
            structure.deductions.forEach(rule => {
                let amount = 0;
                const base = rule.baseComponent === 'Basic' ? basicSalary : monthlyGross;

                if (rule.type === 'Percentage') {
                    amount = (base * rule.value) / 100;
                } else {
                    amount = rule.value;
                }
                breakdown.deductions.push({
                    label: rule.label,
                    amount: Math.round(amount)
                });
            });

        } else {
            // Fallback default
            breakdown.basicSalary = Math.round(monthlyGross * 0.5);
            breakdown.earnings.push({ label: 'Basic Salary', amount: breakdown.basicSalary });
        }

        // Calculate Net Pay
        const totalEarnings = breakdown.earnings.reduce((sum, item) => sum + item.amount, 0);
        const totalDeductions = breakdown.deductions.reduce((sum, item) => sum + item.amount, 0);
        breakdown.netPay = totalEarnings - totalDeductions;

        res.json(breakdown);

    } catch (error) {
        console.error("Get Emp Salary Details Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// DOCUMENTS
exports.getAllEmployeeDocuments = async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = { role: { $ne: 'ADMIN' }, status: 'Active' }; // Only active employees

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { id: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } }
            ];
        }

        const employees = await User.find(query).select('id name department designation documents profileImage avatar');

        // Process employees to calculate stats
        const employeesWithStats = employees.map(emp => {
            const docs = emp.documents || [];
            const pendingCount = docs.filter(d => d.status === 'Review').length;
            const verifiedCount = docs.filter(d => d.status === 'Verified').length;
            const rejectedCount = docs.filter(d => d.status === 'Rejected').length;

            // Apply Status Filter if needed (at employee level? or just stats)
            // If filter is 'Pending', maybe we only return employees who have pending docs?
            // For now, let's filter the list if status is provided

            return {
                id: emp.id,
                name: emp.name,
                department: emp.department,
                designation: emp.designation,
                profileImage: emp.profileImage,
                avatar: emp.avatar,
                uploads: docs.length,
                pending: pendingCount,
                verified: verifiedCount,
                rejected: rejectedCount,
                hasPending: pendingCount > 0,
                hasVerified: verifiedCount > 0
            };
        }).filter(e => e.uploads > 0); // Only show employees active with documents

        let result = employeesWithStats;
        if (status === 'Pending') {
            result = result.filter(e => e.hasPending);
        } else if (status === 'Verified') {
            // Maybe implies fully verified or at least one? Let's say needs review cleared
            result = result.filter(e => !e.hasPending && e.hasVerified);
        }

        // Calculate Global Stats
        const globalStats = {
            total: employeesWithStats.reduce((sum, e) => sum + e.uploads, 0),
            verified: employeesWithStats.reduce((sum, e) => sum + e.verified, 0),
            pending: employeesWithStats.reduce((sum, e) => sum + e.pending, 0),
            rejected: employeesWithStats.reduce((sum, e) => sum + e.rejected, 0)
        };

        res.json({ employees: result, stats: globalStats });
    } catch (error) {
        console.error("Get All Documents Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getEmployeeDocuments = async (req, res) => {
    try {
        const { id } = req.params; // EMPxxx
        const user = await User.findOne({ id }).select('documents');
        if (!user) return res.status(404).json({ message: "Employee not found" });

        // Return flat docs list, frontend can categorise
        // Or we can structure it here. Let's return the simplified flat list 
        // consistent with User model but mapped for frontend convenience
        const docs = (user.documents || []).map(d => ({
            id: d.docId, // frontend uses 'aadhaar', docId in DB
            name: d.name,
            category: d.category,
            status: d.status,
            uploadedOn: d.uploadedAt,
            path: d.path,
            rejectionReason: d.rejectionReason,
            size: 'Unknown' // Supabase metadata not fast to get here without extra calls
        }));

        res.json(docs);
    } catch (error) {
        console.error("Get Emp Documents Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateDocumentStatus = async (req, res) => {
    try {
        const { empId, docId } = req.params;
        const { status, reason } = req.body; // Approved -> Verified

        const user = await User.findOne({ id: empId });
        if (!user) return res.status(404).json({ message: "Employee not found" });

        const doc = user.documents.find(d => d.docId === docId);
        if (!doc) return res.status(404).json({ message: "Document not found" });

        doc.status = status;
        if (status === 'Rejected' && reason) {
            doc.rejectionReason = reason;
        } else if (status === 'Verified') {
            doc.rejectionReason = undefined; // Clear reason if approved
        }

        await user.save();
        res.json({ message: "Document status updated", document: doc });
    } catch (error) {
        console.error("Update Doc Status Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getAdminDocumentPreview = async (req, res) => {
    try {
        const { path } = req.query;
        if (!path) return res.status(400).json({ message: "Path is required" });

        const { data, error } = await supabase.storage
            .from('documents')
            .createSignedUrl(path, 60);

        if (error) throw error;

        res.json({ url: data.signedUrl });
    } catch (error) {
        console.error("Admin Preview Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
