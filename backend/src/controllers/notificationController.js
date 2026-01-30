const Notification = require('../models/Notification');
const User = require('../models/User');

// Web Push removed in favor of FCM Admin SDK

// Register FCM Token (Multi-device with Strict Device ID)
exports.registerFCM = async (req, res) => {
    try {
        const { token, device, deviceId } = req.body;
        // Backward compatibility: If no deviceId from frontend, use a fallback
        const targetDeviceId = deviceId || 'legacy-device-' + token.substring(0, 8);
        const userId = req.user.id;

        if (!token) return res.status(400).json({ message: "Token is required" });

        const user = await User.findOne({ id: userId });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.fcmTokens) user.fcmTokens = [];

        // 1. DEVICE ISOLATION: Remove this "targetDeviceId" from ALL OTHER users
        if (targetDeviceId) {
            await User.updateMany(
                { "fcmTokens.deviceId": targetDeviceId, id: { $ne: userId } },
                { $pull: { fcmTokens: { deviceId: targetDeviceId } } }
            );
        }

        // 2. TOKEN CLEANUP: Also remove the specific token key from ALL OTHER users
        await User.updateMany(
            { "fcmTokens.token": token, id: { $ne: userId } },
            { $pull: { fcmTokens: { token: token } } }
        );

        // 2b. LEGACY CLEANUP: Remove from single string field too
        await User.updateMany(
            { fcmToken: token, id: { $ne: userId } },
            { $set: { fcmToken: null } }
        );

        // 3. REFRESH FETCH: Getting the user again or filtering in-memory
        // Since we ran 'updateMany' against the DB, the 'user' variable we fetched at the start is now stale regarding fcmTokens.
        // It basically contains the old list. 
        // We will manually filter the old list to mimic the DB cleanup we just did.
        user.fcmTokens = user.fcmTokens.filter(t => t.deviceId !== targetDeviceId && t.token !== token);

        // 4. LIMIT: Enforce max devices per user
        if (user.fcmTokens.length >= 5) {
            user.fcmTokens.sort((a, b) => new Date(a.lastActive) - new Date(b.lastActive));
            user.fcmTokens.shift(); // Remove oldest
        }

        // 5. ADD: Push the new clean entry
        user.fcmTokens.push({
            token,
            device: device || 'Unknown',
            deviceId: targetDeviceId, // Store the distinct ID
            lastActive: new Date()
        });

        await user.save();
        res.json({ message: "Device registered for notifications" });

    } catch (error) {
        console.error("Register FCM Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Check FCM Status
exports.checkFCMStatus = async (req, res) => {
    try {
        const { token, deviceId } = req.query;

        // Need at least one identifier
        if (!token && !deviceId) return res.status(400).json({ message: "Token or Device ID required" });

        const user = await User.findOne({ id: req.user.id });
        if (!user) return res.status(404).json({ registered: false });

        // Check if ANY active token matches
        let exists = false;
        if (user.fcmTokens && user.fcmTokens.length > 0) {
            if (deviceId) {
                exists = user.fcmTokens.some(t => t.deviceId === deviceId);
            } else {
                exists = user.fcmTokens.some(t => t.token === token);
            }
        }

        res.json({ registered: exists });
    } catch (error) {
        console.error("Check FCM Status Error:", error);
        res.status(500).json({ message: "Server Error", registered: false });
    }
};

// Send Test FCM (Self-Test)
exports.sendTestFCM = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findOne({ id: userId });

        if (!user) return res.status(404).json({ message: "User not found" });

        const tokens = [];
        if (user.fcmTokens && user.fcmTokens.length > 0) {
            user.fcmTokens.forEach(t => tokens.push(t.token));
        }

        const uniqueTokens = [...new Set(tokens.filter(t => t && t.length > 0))];

        if (uniqueTokens.length === 0) {
            return res.status(400).json({ message: "No registered devices found for this user." });
        }

        const admin = require('../config/firebase');
        if (admin && admin.messaging) {
            const response = await admin.messaging().sendEachForMulticast({
                notification: {
                    title: "Test Notification",
                    body: "This is a test notification from the server to check your device setup."
                },
                tokens: uniqueTokens
            });

            if (response.failureCount > 0) {
                response.responses.forEach(async (resp, idx) => {
                    if (!resp.success) {
                        const error = resp.error;
                        const badToken = uniqueTokens[idx];
                        if (
                            error.code === 'messaging/registration-token-not-registered' ||
                            error.code === 'messaging/invalid-registration-token' ||
                            error.code === 'messaging/third-party-auth-error'
                        ) {
                            await User.updateOne(
                                { id: userId },
                                { $pull: { fcmTokens: { token: badToken } } }
                            );
                        }
                    }
                });
            }

            res.json({
                message: `Sent test notification to ${uniqueTokens.length} devices.`,
                successCount: response.successCount,
                failureCount: response.failureCount
            });
        } else {
            res.status(500).json({ message: "Firebase Admin not initialized properly." });
        }

    } catch (error) {
        console.error("Test FCM Error:", error);
        res.status(500).json({ message: "Failed to send test notification" });
    }
};

// Subscribe endpoint (Web Push Legacy)
exports.subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        const userId = req.user.id;

        // Save subscription to user
        await User.findOneAndUpdate(
            { id: userId },
            { $addToSet: { pushSubscriptions: subscription } } // Add unique
        );

        res.status(201).json({ message: 'Subscribed' });
    } catch (error) {
        console.error("Subscribe Error:", error);
        res.status(500).json({ message: "Subscription failed" });
    }
};

// Helper to send push
// Helper to send push
const sendPushToUser = async (userId, payload) => {
    try {
        const admin = require('../config/firebase');
        if (!admin || !admin.messaging) return;

        let tokens = [];

        if (userId === 'ALL') {
            const users = await User.find({ status: 'Active' });
            for (const u of users) {
                if (u.fcmTokens) u.fcmTokens.forEach(t => tokens.push(t.token));
            }
        } else {
            const user = await User.findOne({ id: userId });
            if (user && user.fcmTokens) {
                user.fcmTokens.forEach(t => tokens.push(t.token));
            }
        }

        const uniqueTokens = [...new Set(tokens)];

        if (uniqueTokens.length > 0) {
            const response = await admin.messaging().sendEachForMulticast({
                notification: {
                    title: payload.title,
                    body: payload.body
                },
                tokens: uniqueTokens
            });

            if (response.failureCount > 0) {
                response.responses.forEach(async (resp, idx) => {
                    if (!resp.success) {
                        const error = resp.error;
                        const badToken = uniqueTokens[idx];
                        if (
                            error.code === 'messaging/registration-token-not-registered' ||
                            error.code === 'messaging/invalid-registration-token' ||
                            error.code === 'messaging/third-party-auth-error'
                        ) {
                            await User.updateMany(
                                { "fcmTokens.token": badToken },
                                { $pull: { fcmTokens: { token: badToken } } }
                            );
                        }
                    }
                });
            }
        }
    } catch (e) {
        console.error("Send Push Logic Error:", e);
    }
};

exports.createNotification = async (req, res) => {
    try {
        const notification = new Notification(req.body);
        await notification.save();

        // Trigger Push
        const payload = {
            title: notification.title,
            body: notification.message,
            url: '/notifications', // Default URL
            icon: '/logo.png' // Optional
        };

        // Async send (don't block response)
        sendPushToUser(notification.to, payload);

        res.status(201).json(notification);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        // Simple logic: Fetch 'ALL' or specific to User ID
        const userId = req.user.id;
        const notifications = await Notification.find({
            $or: [
                { to: 'ALL' },
                { to: userId },
                { to: { $in: [userId] } }
            ]
        }).sort({ date: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.markRead = async (req, res) => {
    try {
        const updated = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getNotificationById = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: "Notification not found" });

        // Security check: ensure user is allowed to see this
        const userId = req.user.id;
        if (notification.to !== 'ALL' && notification.to !== userId && !notification.to.includes(userId)) {
            return res.status(403).json({ message: "Access Denied" });
        }

        res.json(notification);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
