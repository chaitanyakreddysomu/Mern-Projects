const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            await logger.logAction(req, null, 'Auth', 'Login', `Failed login attempt (User not found): ${email}`, 'Error');
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await logger.logAction(req, null, 'Auth', 'Login', `Failed login attempt (Invalid password): ${email}`, 'Error');
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Check Account Status
        if (user.status === 'Pending') {
            await logger.logAction(req, user, 'Auth', 'Login', `Failed login attempt (Pending Approval): ${email}`, 'Warning');

            const msg = user.role === 'HR'
                ? "You are not approved, please contact admin"
                : "You are not approved, please contact HR";

            return res.status(403).json({ message: msg });
        }

        if (user.status === 'Rejected') {
            await logger.logAction(req, user, 'Auth', 'Login', `Failed login attempt (Rejected): ${email}`, 'Warning');

            const msg = user.role === 'HR'
                ? "You are rejected, please contact admin"
                : "You are rejected, please contact your HR";

            return res.status(403).json({ message: msg });
        }

        // Generate Tokens
        const accessToken = jwt.sign(
            { id: user.id, role: user.role, name: user.name, mongoId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        const refreshToken = jwt.sign(
            { id: user.id, role: user.role, name: user.name, mongoId: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // LOG SUCCESS
        await logger.logAction(req, user, 'Auth', 'Login', 'User logged in successfully', 'Success');

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                email: user.email,
                avatar: user.avatar,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.refresh = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "Refresh Token required" });

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Generate new Access Token
        const accessToken = jwt.sign(
            { id: decoded.id, role: decoded.role, name: decoded.name, mongoId: decoded.mongoId },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.json({ accessToken });
    } catch (err) {
        console.error(err);
        return res.status(403).json({ message: "Invalid Refresh Token" });
    }
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, designation, department, phone } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        // Auto-generate ID
        const lastUser = await User.findOne().sort({ createdAt: -1 });
        let newId = "EMP001";
        if (lastUser && lastUser.id) {
            const lastIdNum = parseInt(lastUser.id.replace("EMP", ""), 10);
            if (!isNaN(lastIdNum)) {
                newId = `EMP${(lastIdNum + 1).toString().padStart(3, '0')}`;
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            id: newId,
            name,
            email,
            password: hashedPassword,
            role: role || 'EMPLOYEE',
            designation,
            department,
            phone,
            status: 'Pending'
        });

        await newUser.save();

        res.status(201).json({
            message: "User created successfully",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                designation: newUser.designation,
                department: newUser.department,
                phone: newUser.phone,
                status: newUser.status,
                projectStatus: newUser.projectStatus
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};
