const Notification = require('../models/Notification');
const User = require('../models/User');
const webpush = require('web-push');

// Configure VAPID
webpush.setVapidDetails(
    'mailto:hr@company.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// Register FCM Token (Multi-device)
exports.registerFCM = async (req, res) => {
    try {
        const { token, device } = req.body;
        const userId = req.user.id;

        if (!token) return res.status(400).json({ message: "Token is required" });

        // Add or Update token in array
        const user = await User.findOne({ id: userId });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check if token exists
        const existingIndex = user.fcmTokens.findIndex(t => t.token === token);
        if (existingIndex > -1) {
            // Update timestamp & device name if changed
            user.fcmTokens[existingIndex].lastActive = new Date();
            if (device) user.fcmTokens[existingIndex].device = device;
        } else {
            // Add new
            if (!user.fcmTokens) user.fcmTokens = [];
            user.fcmTokens.push({
                token,
                device: device || 'Unknown',
                lastActive: new Date()
            });
        }

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
        const { token } = req.query;
        if (!token) return res.status(400).json({ message: "Token required" });

        const user = await User.findOne({ id: req.user.id });
        if (!user) return res.status(404).json({ registered: false });

        const exists = user.fcmTokens && user.fcmTokens.some(t => t.token === token);
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
        } else if (user.fcmToken) {
            tokens.push(user.fcmToken);
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
const sendPushToUser = async (userId, payload) => {
    try {
        if (userId === 'ALL') {
            // CAUTION: This might be heavy
            const users = await User.find({ status: 'Active' });
            for (const u of users) {
                if (u.pushSubscriptions && u.pushSubscriptions.length > 0) {
                    for (const sub of u.pushSubscriptions) {
                        webpush.sendNotification(sub, JSON.stringify(payload)).catch(e => {
                            console.error("Push Error (cleanup needed):", e);
                            // TODO: Remove expired subscriptions
                        });
                    }
                }
            }
        } else {
            const user = await User.findOne({ id: userId });
            if (user && user.pushSubscriptions) {
                for (const sub of user.pushSubscriptions) {
                    webpush.sendNotification(sub, JSON.stringify(payload)).catch(e => console.error("Push Error:", e));
                }
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
