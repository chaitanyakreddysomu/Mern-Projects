const Log = require('../models/Log');
const User = require('../models/User');

exports.createLog = async (req, res) => {
    try {
        const log = new Log(req.body);
        await log.save();
        res.status(201).json(log);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getLogs = async (req, res) => {
    try {
        const { search, module, severity, page = 1, limit = 25 } = req.query;
        let query = {};

        // Filter by Module if present
        if (module && module !== 'All' && module !== 'ALL') {
            query.module = module;
        }

        // Filter by Severity if present
        if (severity && severity !== 'All' && severity !== 'ALL') {
            query.severity = severity;
        }

        // Search logic
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { action: searchRegex },
                { description: searchRegex },
                { 'user.name': searchRegex },
                { 'user.role': searchRegex },
                { 'user.id': searchRegex },
                { ipAddress: searchRegex }
            ];
        }

        // Pagination Calculations
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const totalLogs = await Log.countDocuments(query);
        let logs = await Log.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Enrich with latest profile image from User collection
        // Enrich with latest profile image from User collection
        const userIds = [...new Set(logs.map(log => log.user.id))];
        const users = await User.find({ id: { $in: userIds } }).select('id profileImage avatar');
        const userMap = {};
        users.forEach(u => { userMap[u.id] = u; });

        logs = logs.map(log => ({
            ...log,
            user: {
                ...log.user,
                profileImage: userMap[log.user.id]?.profileImage || userMap[log.user.id]?.avatar || log.user.profileImage
            }
        }));

        // --- Calculate Stats (based on query sans severity) ---
        const statsQuery = { ...query };
        delete statsQuery.severity; // Remove severity filter to get meaningful distribution

        const [errorCount, warningCount, successCount] = await Promise.all([
            Log.countDocuments({ ...statsQuery, severity: 'Error' }),
            Log.countDocuments({ ...statsQuery, severity: 'Warning' }),
            Log.countDocuments({ ...statsQuery, severity: 'Success' })
        ]);

        res.json({
            logs,
            pagination: {
                total: totalLogs,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(totalLogs / limitNum),
                stats: {
                    errors: errorCount,
                    warnings: warningCount,
                    successful: successCount
                }
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
