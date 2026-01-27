const Leave = require('../models/Leave');
const User = require('../models/User');

exports.createLeave = async (req, res) => {
    try {
        // req.user from auth middleware
        const newLeave = new Leave({
            ...req.body,
            userId: req.user.id,
            userName: req.user.name
        });
        const savedLeave = await newLeave.save();
        res.status(201).json({
            _id: savedLeave._id,
            userId: savedLeave.userId,
            userName: savedLeave.userName,
            type: savedLeave.type,
            startDate: savedLeave.startDate,
            endDate: savedLeave.endDate,
            reason: savedLeave.reason,
            status: savedLeave.status
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getLeaves = async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'EMPLOYEE') {
            query.userId = req.user.id;
        } else if (req.user.role === 'HR') {
            // HR sees only EMPLOYEE leaves
            const employees = await User.find({ role: 'EMPLOYEE' }).select('id');
            const employeeIds = employees.map(e => e.id);
            query.userId = { $in: employeeIds };
        }
        // ADMIN sees all (or filtered if needed, but default all is fine for now)

        const leaves = await Leave.find(query).sort({ appliedOn: -1 }).lean();

        // Enrich with profile images
        const userIds = [...new Set(leaves.map(l => l.userId))];
        const users = await User.find({ id: { $in: userIds } }).select('id profileImage avatar');
        const userMap = {};
        users.forEach(u => userMap[u.id] = u);

        const enrichedLeaves = leaves.map(l => ({
            ...l,
            profileImage: userMap[l.userId]?.profileImage,
            avatar: userMap[l.userId]?.avatar
        }));

        res.json(enrichedLeaves);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMyLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ userId: req.user.id }).sort({ appliedOn: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateLeaveStatus = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const leave = await Leave.findByIdAndUpdate(
            req.params.id,
            { status, rejectionReason },
            { new: true }
        );

        if (!leave) return res.status(404).json({ message: "Leave not found" });

        // --- NOTIFICATION LOGIC ---
        try {
            const Notification = require('../models/Notification'); // Ensure model is imported

            // Find User
            const user = await User.findOne({ id: leave.userId });

            if (user) {
                let notifTitle = "";
                let notifMessage = "";
                let notifType = "info";

                const sDate = new Date(leave.startDate).toLocaleDateString();
                const eDate = new Date(leave.endDate).toLocaleDateString();
                const dateRange = sDate === eDate ? `on ${sDate}` : `from ${sDate} to ${eDate}`;

                const isWFH = leave.type === 'Work From Home' || leave.type === 'WFH';
                // Determine source based on who is acting (HR or ADMIN)
                const source = req.user.role === 'HR' ? 'HR' : 'ADMIN';

                if (status === 'Approved') {
                    if (isWFH) {
                        notifTitle = "WFH Approved";
                        notifMessage = `Your work from home request ${dateRange} is approved by ${source}.`;
                    } else {
                        notifTitle = "Leave Approved";
                        notifMessage = `Your leave request for ${leave.type} ${dateRange} has been approved by ${source}.`;
                    }
                    notifType = 'success';
                } else if (status === 'Rejected') {
                    if (isWFH) {
                        notifTitle = "WFH Rejected";
                        notifMessage = `Your work from home request ${dateRange} is rejected by ${source}. Reason: ${leave.rejectionReason || "Decision"}`;
                    } else {
                        notifTitle = "Leave Rejected";
                        notifMessage = `Your leave request ${dateRange} was rejected by ${source}. Reason: ${leave.rejectionReason || "Decision"}`;
                    }
                    notifType = 'alert';
                }

                if (notifTitle) {
                    // 1. DB Notification
                    await Notification.create({
                        title: notifTitle,
                        message: notifMessage,
                        to: user.id,
                        source: source,
                        type: notifType,
                        date: new Date()
                    });

                    // 2. FCM Notification
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
            console.error("[LeaveController] Notification Error:", notifErr);
        }
        // --- END NOTIFICATION ---

        res.json(leave);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
