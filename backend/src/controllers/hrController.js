const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification'); // Added
const Payslip = require('../models/Payslip');
const webpush = require('web-push'); // Added if needed, but we use firebase too?
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Identify user
        let filter;
        if (req.user.mongoId) {
            filter = { _id: req.user.mongoId };
        } else {
            filter = { id: req.user.id };
        }

        const user = await User.findOne(filter);
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
            return res.status(500).json({ message: "Image upload failed", error: uploadError });
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

exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const { docId, name, category } = req.body;
        if (!docId || !name || !category) return res.status(400).json({ message: "Missing metadata" });

        const user = await User.findOne({ id: req.user.id });
        if (!user) return res.status(404).json({ message: "User not found" });

        const filePath = `${user.id}/${category}/${docId}_${Date.now()}`;

        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (uploadError) throw uploadError;

        // Update User model
        const docIndex = user.documents.findIndex(d => d.docId === docId);
        const docEntry = {
            category,
            name,
            docId,
            path: filePath,
            status: 'Review',
            rejectionReason: undefined,
            uploadedAt: new Date()
        };

        if (docIndex > -1) {
            user.documents[docIndex] = docEntry;
        } else {
            user.documents.push(docEntry);
        }

        await user.save();
        res.json({ message: "Document uploaded successfully", document: docEntry });

    } catch (error) {
        console.error("Upload Document Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getDocumentPreview = async (req, res) => {
    try {
        const { path } = req.query;
        if (!path) return res.status(400).json({ message: "Path is required" });

        const { data, error } = await supabase.storage
            .from('documents')
            .createSignedUrl(path, 60);

        if (error) throw error;

        res.json({ url: data.signedUrl });
    } catch (error) {
        console.error("Get Preview Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Start of existing functions...
exports.getHRDashboardStats = async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Pre-fetch employee IDs for filtering
        const employeeIds = await User.find({ role: 'EMPLOYEE' }).distinct('id');
        const employeeFilter = { userId: { $in: employeeIds } };

        // 1. Stats
        const totalEmployees = await User.countDocuments({ role: 'EMPLOYEE' });

        // Count unique users present today (Only Employees)
        const presentToday = await Attendance.countDocuments({
            date: { $gte: todayStart, $lte: todayEnd },
            status: { $ne: 'Absent' },
            userId: { $in: employeeIds }
        });

        // Count approved leaves active today (Only Employees)
        const onLeave = await Leave.countDocuments({
            startDate: { $lte: todayEnd },
            endDate: { $gte: todayStart },
            status: 'Approved',
            userId: { $in: employeeIds }
        });

        const pendingApprovals = await Leave.countDocuments({
            status: 'Pending',
            userId: { $in: employeeIds }
        });

        // 2. Recent Notifications (Global - kept as is or filter?)
        // Notifications are usually system-wide or directed. Leaving as is unless requested.
        const notifications = await Notification.find().sort({ date: -1 }).limit(5);

        // 3. Recent Complaints
        const complaints = await Complaint.find().sort({ date: -1 }).limit(5);

        // 4. Recent Leave Requests (Only Employees)
        const leaves = await Leave.find(employeeFilter).sort({ appliedOn: -1 }).limit(5);

        // 5. Department Headcount (Active Only)
        const departmentStats = await User.aggregate([
            { $match: { role: { $ne: 'ADMIN' }, status: 'Active' } },
            { $group: { _id: "$department", count: { $sum: 1 } } }
        ]);

        const totalForDept = departmentStats.reduce((acc, curr) => acc + curr.count, 0);

        // Colors for UI mapping (cycle through)
        const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-slate-500"];
        const trackColors = ["bg-blue-100", "bg-green-100", "bg-purple-100", "bg-pink-100", "bg-orange-100", "bg-slate-100"];
        const textColors = ["text-blue-600", "text-green-600", "text-purple-600", "text-pink-600", "text-orange-600", "text-slate-600"];

        const departments = departmentStats.map((d, i) => ({
            name: d._id || 'Other',
            count: d.count,
            percent: totalForDept > 0 ? Math.round((d.count / totalForDept) * 100) + '%' : '0%',
            color: colors[i % colors.length],
            track: trackColors[i % trackColors.length],
            text: textColors[i % textColors.length]
        }));

        res.json({
            stats: {
                totalEmployees,
                presentToday,
                onLeave,
                pendingApprovals
            },
            notifications,
            complaints,
            leaves,
            departments
        });

    } catch (error) {
        console.error("HR Dashboard Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getHRProfile = async (req, res) => {
    try {
        // req.user.id is from the token (which is the MongoDB _id usually, or the 'id' field depending on authController)
        // Let's assume req.user.id refers to the database _id or custom id. 
        // Based on auth middleware, it depends on what was signed. 
        // Usually it's _id. But let's check authController if possible. 
        // Safest is to find by _id using req.user.id (if token has _id).

        // Assuming req.user contains { id: "user_mongo_id", role: "HR", ... }
        // Use mongoId from token if available, otherwise find by custom id
        let filter;
        if (req.user.mongoId) {
            filter = { _id: req.user.mongoId };
        } else {
            filter = { id: req.user.id };
        }

        const user = await User.findOne(filter).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error("Get HR Profile Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateHRProfile = async (req, res) => {
    try {
        const allowedUpdates = [
            'name', 'email', 'phone', 'address', 'dob', 'bloodGroup',
            'emergencyContact', 'bankDetails', 'uan'
        ];

        const updates = {};
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        // Use mongoId from token if available, otherwise find by custom id
        let filter;
        if (req.user.mongoId) {
            filter = { _id: req.user.mongoId };
        } else {
            // Fallback if mongoId not in token (older tokens)
            filter = { id: req.user.id };
        }

        const user = await User.findOneAndUpdate(
            filter,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("Update HR Profile Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getAllEmployeeComplaints = async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};

        // 1. Role Filter: HR sees only 'EMPLOYEE' complaints
        const employees = await User.find({ role: 'EMPLOYEE' }).select('id');
        const employeeIds = employees.map(e => e.id);

        query.userId = { $in: employeeIds };

        if (status && status !== 'All') {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { userName: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { userId: { $regex: search, $options: 'i' } }
            ];
        }

        const complaints = await Complaint.find(query).sort({ date: -1 });
        res.json(complaints);
    } catch (error) {
        console.error("Get All Employee Complaints Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const newStatus = status || req.query.update;

        if (!['Open', 'Investigating', 'Resolved'].includes(newStatus)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const complaint = await Complaint.findByIdAndUpdate(
            id,
            { status: newStatus },
            { new: true }
        );

        if (!complaint) return res.status(404).json({ message: "Complaint not found" });
        res.json(complaint);
    } catch (error) {
        console.error("Update Complaint Status Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getMyComplaints = async (req, res) => {
    try {
        const userId = req.user.id;
        const complaints = await Complaint.find({ userId }).sort({ date: -1 });
        res.json(complaints);
    } catch (error) {
        console.error("Get My Complaints Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.createMyComplaint = async (req, res) => {
    try {
        const { subject, description } = req.body;
        const user = await User.findOne({ id: req.user.id });

        const newComplaint = new Complaint({
            userId: user.id,
            userName: user.name,
            department: user.department,
            subject,
            description,
            date: new Date(),
            status: 'Open'
        });

        await newComplaint.save();
        res.status(201).json(newComplaint);
    } catch (error) {
        console.error("Create My Complaint Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// --- NOTIFICATIONS ---

exports.getSentNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ source: 'HR' }).sort({ date: -1 }).lean();

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

exports.getReceivedNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { unread } = req.query;
        let query = { to: userId };

        if (unread === 'true') {
            query.read = false;
        }

        const notifications = await Notification.find(query).sort({ date: -1 });
        res.json(notifications);
    } catch (error) {
        console.error("Get Received Notifications Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.createHRNotification = async (req, res) => {
    try {
        const { title, message, targetAudience, selectedEmployeeIds, type } = req.body;

        if (!title || !message || !targetAudience) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        let recipients = [];
        let userRecords = [];

        if (targetAudience === 'ALL') {
            userRecords = await User.find({ status: 'Active', role: 'EMPLOYEE' });
        } else if (targetAudience === 'SELECT_EMPLOYEES') {
            if (!selectedEmployeeIds || !selectedEmployeeIds.length) {
                return res.status(400).json({ message: "No employees selected" });
            }
            userRecords = await User.find({ id: { $in: selectedEmployeeIds } });
        }

        recipients = userRecords.map(u => u.id);
        recipients = recipients.filter(id => id !== req.user.id);

        const notifications = recipients.map(userId => ({
            title,
            message,
            to: userId,
            source: 'HR',
            type: type || 'info',
            date: new Date()
        }));

        // NOTIFY ADMIN AS WELL
        const admins = await User.find({ role: 'ADMIN', status: 'Active' });
        const adminNotifications = admins.map(admin => ({
            title: `HR Broadcast: ${title}`,
            message: `HR sent a broadcast to ${notifications.length} recipients: "${message}"`,
            to: admin.id,
            source: 'HR',
            type: 'info',
            date: new Date()
        }));

        notifications.push(...adminNotifications);

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        const tokens = [];
        userRecords.forEach(u => {
            if (u.fcmTokens && u.fcmTokens.length > 0) {
                u.fcmTokens.forEach(t => tokens.push(t.token));
            } else if (u.fcmToken) {
                tokens.push(u.fcmToken);
            }
        });

        // Add Admin Tokens
        admins.forEach(a => {
            if (a.fcmTokens && a.fcmTokens.length > 0) {
                a.fcmTokens.forEach(t => tokens.push(t.token));
            } else if (a.fcmToken) {
                tokens.push(a.fcmToken);
            }
        });

        const uniqueTokens = [...new Set(tokens.filter(t => t && t.length > 0))];

        if (uniqueTokens.length > 0) {
            const payload = {
                notification: {
                    title: title,
                    body: message
                },
                tokens: uniqueTokens
            };

            try {
                const admin = require('../config/firebase');
                if (admin && admin.messaging) {
                    await admin.messaging().sendEachForMulticast(payload);
                }
            } catch (fcmError) {
                console.error("HR FCM Error:", fcmError);
            }
        }

        res.status(201).json({ message: `Sent to ${notifications.length} employees` });

        // Log the action
        await logger.logAction(
            req,
            req.user,
            'Communications',
            'Create',
            `Sent HR Notification: "${title}" to ${notifications.length} recipients`,
            'Info'
        );

    } catch (error) {
        console.error("Create HR Notification Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findById(id);
        if (!notification) return res.status(404).json({ message: "Not found" });

        if (notification.to !== req.user.id) return res.status(403).json({ message: "Access denied" });

        notification.read = true;
        await notification.save();
        res.json(notification);
    } catch (error) {
        console.error("Mark Read Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getAllEmployeesForSelect = async (req, res) => {
    try {
        const employees = await User.find({ role: 'EMPLOYEE', status: 'Active' }).select('id name department');
        res.json(employees);
    } catch (error) {
        console.error("Get Employees Select Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getEmployees = async (req, res) => {
    try {
        const { search, status, department, role, project } = req.query;
        let query = {};

        // Role Filter: Allow 'HR' or 'EMPLOYEE' or 'All' (defaults to both if not specified or All)
        if (role && role !== 'All') {
            query.role = role; // e.g. 'HR' or 'EMPLOYEE'
        } else {
            query.role = { $in: ['EMPLOYEE', 'HR'] };
        }

        // Status Filter
        if (status && status.toLowerCase() !== 'all') {
            // Flexible matching for status (case-insensitive usually preferred but strict for now based on frontend)
            // Frontend sends 'Active', 'Inactive' etc.
            query.status = status;
        }

        // Department Filter
        if (department && department !== 'All') {
            query.department = department;
        }

        // Project Status Filter
        if (project && project !== 'All') {
            if (project.toLowerCase() === 'bench') {
                // Bench means either projectStatus is 'Bench' OR it is not set/null/undefined
                const benchCondition = [
                    { projectStatus: 'Bench' },
                    { projectStatus: null },
                    { projectStatus: { $exists: false } },
                    { projectStatus: "" } // Handle empty string too just in case
                ];

                // If we already have $or search conditions later, we need to be careful.
                // It's safer to use $and for complex combinations, but let's stick to adding to query first.
                // We'll handle the combination below.
                query.$or_project = benchCondition; // Temporary key to merge later
            } else {
                // 'In Project' or specific project
                query.projectStatus = project;
            }
        }

        // Search Filter
        let searchOrConstraints = [];
        if (search) {
            searchOrConstraints = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { id: { $regex: search, $options: 'i' } }
            ];
        }

        // --- MERGE OR CONDITIONS ---
        // Mongoose doesn't support multiple top-level $or operators easily without $and.
        // We have two potential sources of ORs: "Bench" logic and "Search" logic.

        if (query.$or_project && searchOrConstraints.length > 0) {
            // We have BOTH bench OR conditions AND search OR conditions.
            // Logic: (Bench OR null ...) AND (Name matches ... OR Email matches ...)
            const projectConstraints = query.$or_project;
            delete query.$or_project; // Remove temp key

            query.$and = [
                { $or: projectConstraints },
                { $or: searchOrConstraints }
            ];

        } else if (query.$or_project) {
            // Only Project Bench ORs
            query.$or = query.$or_project;
            delete query.$or_project;
        } else if (searchOrConstraints.length > 0) {
            // Only Search ORs
            query.$or = searchOrConstraints;
        }

        const users = await User.find(query).select('-password').sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        console.error("Get Employees List Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getEmployeeById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json({ user });
    } catch (error) {
        console.error('Get Employee By ID Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getPendingRequests = async (req, res) => {
    try {
        const { search } = req.query;
        let query = { status: 'Pending', role: 'EMPLOYEE' }; // HR receives only EMPLOYEE requests

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const requests = await User.find(query).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error("Get Pending Requests Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getPendingRequestById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get Pending Request By ID Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.query;

        if (!['approve', 'reject'].includes(status)) {
            return res.status(400).json({ message: "Invalid status action" });
        }

        const newStatus = status === 'approve' ? 'Active' : 'Rejected';

        const user = await User.findByIdAndUpdate(
            id,
            { status: newStatus },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);

        // Log the action
        await logger.logAction(
            req,
            req.user,
            'Request Management',
            status === 'approve' ? 'Approve' : 'Reject',
            `${status === 'approve' ? 'Approved' : 'Rejected'} registration request for ${user.name} (${user.id})`,
            status === 'approve' ? 'Success' : 'Warning'
        );
    } catch (error) {
        console.error("Update Request Status Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// --- LEAVE MANAGEMENT ---
// --- LEAVE MANAGEMENT ---
exports.getLeaveRequests = async (req, res) => {
    try {
        const { status, search, sortBy, order } = req.query;
        let query = {};

        // 1. Role Filter: HR sees only 'EMPLOYEE' leaves (Strict)
        // Explicitly fetch IDs of users with role 'EMPLOYEE'
        const employees = await User.find({ role: 'EMPLOYEE' }).select('id');
        const employeeIds = employees.map(e => e.id);

        query.userId = { $in: employeeIds };

        // Status Filter
        if (status && status !== 'All' && status !== 'all') {
            console.log("Status param receiving:", status);
            // Check if it's a comma-separated list or single value
            if (status.includes(',')) {
                const statusArray = status.split(',').map(s => {
                    const sLower = s.toLowerCase().trim();
                    return sLower.charAt(0).toUpperCase() + sLower.slice(1);
                });
                query.status = { $in: statusArray };
            } else {
                // Single value strict match (capitalize correctly just in case)
                const sLower = status.toLowerCase().trim();
                const formattedStatus = sLower.charAt(0).toUpperCase() + sLower.slice(1);
                query.status = formattedStatus;
            }
        }
        console.log("Final Leave Query:", JSON.stringify(query));

        // Search Filter
        if (search) {
            query.$or = [
                { userName: { $regex: search, $options: 'i' } },
                { userId: { $regex: search, $options: 'i' } }
            ];
        }

        // Fetch Leaves (Filtered)
        let leaves = await Leave.find(query).lean();

        // Enrich with Profile Image
        const userIds = [...new Set(leaves.map(l => l.userId))];
        const users = await User.find({ id: { $in: userIds } }).select('id profileImage avatar');
        const userMap = {};
        users.forEach(u => userMap[u.id] = u);

        leaves = leaves.map(leave => ({
            ...leave,
            profileImage: userMap[leave.userId]?.profileImage,
            avatar: userMap[leave.userId]?.avatar
        }));

        // Stats (Filtered by Role Only - NOT by Current Status Filter)
        // We want stats for all leaves for the relevant users, regardless of the filter applied to the list
        const statsQuery = { userId: { $in: employeeIds } };
        const total = await Leave.countDocuments(statsQuery);
        const approved = await Leave.countDocuments({ ...statsQuery, status: 'Approved' });
        const pending = await Leave.countDocuments({ ...statsQuery, status: 'Pending' });
        const rejected = await Leave.countDocuments({ ...statsQuery, status: 'Rejected' });

        const stats = { total, approved, pending, rejected };

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
            leaves.sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
        }

        res.json({ stats, leaves });
    } catch (error) {
        console.error("HR Get Leaves Error:", error);
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
        console.error("HR Get Leave By ID Error:", error);
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

        // --- NOTIFICATION LOGIC (HR SOURCE) ---
        try {
            const user = await User.findOne({ id: leave.userId });

            if (user) {
                let notifTitle = "";
                let notifMessage = "";
                let notifType = "info";

                const sDate = new Date(leave.startDate).toLocaleDateString();
                const eDate = new Date(leave.endDate).toLocaleDateString();
                const dateRange = sDate === eDate ? `on ${sDate}` : `from ${sDate} to ${eDate}`;

                const isWFH = leave.type === 'Work From Home' || leave.type === 'WFH';

                if (newStatus === 'Approved') {
                    if (isWFH) {
                        notifTitle = "WFH Approved";
                        notifMessage = `Your work from home request ${dateRange} is approved by HR.`;
                    } else {
                        notifTitle = "Leave Approved";
                        notifMessage = `Your leave request for ${leave.type} ${dateRange} has been approved by HR.`;
                    }
                    notifType = 'success';
                } else if (newStatus === 'Rejected') {
                    if (isWFH) {
                        notifTitle = "WFH Rejected";
                        notifMessage = `Your work from home request ${dateRange} is rejected by HR. Reason: ${leave.rejectionReason || "HR decision"}`;
                    } else {
                        notifTitle = "Leave Rejected";
                        notifMessage = `Your leave request ${dateRange} was rejected by HR. Reason: ${leave.rejectionReason || "HR decision"}`;
                    }
                    notifType = 'alert';
                }

                if (notifTitle) {
                    console.log(`[HRLeaveNotification] Sending '${notifTitle}' to User ID: ${user.id}`);

                    await Notification.create({
                        title: notifTitle,
                        message: notifMessage,
                        to: user.id,
                        source: 'HR',
                        type: notifType,
                        date: new Date()
                    });

                    const tokens = [];
                    if (user.fcmTokens && user.fcmTokens.length > 0) {
                        user.fcmTokens.forEach(t => { if (t.token) tokens.push(t.token) });
                    }
                    if (tokens.length === 0 && user.fcmToken) {
                        tokens.push(user.fcmToken);
                    }

                    const uniqueTokens = [...new Set(tokens.filter(t => t && t.length > 0))];

                    if (uniqueTokens.length > 0) {
                        const admin = require('../config/firebase');
                        if (admin && typeof admin.messaging === 'function') {
                            await admin.messaging().sendEachForMulticast({
                                notification: { title: notifTitle, body: notifMessage },
                                tokens: uniqueTokens
                            });
                        }
                    }
                }
            }
        } catch (notifErr) {
            console.error("[HRLeaveNotification] Logic Failed:", notifErr);
        }

        res.json({ message: `Leave ${newStatus}`, leave });

        // Log the action
        await logger.logAction(
            req,
            req.user,
            'Leave Management',
            newStatus === 'Approved' ? 'Approve' : 'Reject',
            `${newStatus === 'Approved' ? 'Approved' : 'Rejected'} leave request for ${leave.userId}`,
            newStatus === 'Approved' ? 'Success' : 'Warning'
        );
    } catch (error) {
        console.error("HR Update Leave Status Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getHRPayslips = async (req, res) => {
    try {
        const { year } = req.query;
        let query = { empId: req.user.id };

        if (year && year !== 'All') {
            query.year = year;
        }

        const payslips = await Payslip.find(query).sort({ generatedOn: -1 }).lean();

        // Enrich with current user profile image
        const user = await User.findOne({ id: req.user.id }).select('profileImage');

        const enrichedPayslips = payslips.map(p => ({
            ...p,
            profileImage: user ? user.profileImage : null
        }));

        res.json(enrichedPayslips);
    } catch (error) {
        console.error("Get HR Payslips Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
