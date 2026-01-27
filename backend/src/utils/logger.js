const Log = require('../models/Log');

exports.logAction = async (req, user, module, action, description, severity = 'Info') => {
    try {
        const ipAddress = req.ip || req.connection.remoteAddress;

        const logData = {
            module,
            action,
            description,
            severity,
            ipAddress,
            user: {
                id: user ? user.id : 'N/A',
                name: user ? user.name : (req.body.email || 'Guest'), // Attempt to capture email if user not found (e.g. login fail)
                role: user ? user.role : 'N/A',
                profileImage: user ? (user.profileImage || user.avatar) : ''
            }
        };

        const log = new Log(logData);
        await log.save();
    } catch (error) {
        console.error("Logging functionality failed:", error);
    }
};
