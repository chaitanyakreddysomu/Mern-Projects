require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

const createAdmin = async () => {
    // 1. Parse arguments
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: node create-admin.js <email> <password> [name]');
        process.exit(1);
    }

    const [email, password, name = 'Admin User'] = args;

    // 2. Connect to Database
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to Database');
    } catch (err) {
        console.error('❌ DB Connection Error:', err);
        process.exit(1);
    }

    try {
        // 3. Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.error('❌ User with this email already exists.');
            process.exit(1);
        }

        // 4. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Generate ID (Simple random or sequential logic)
        // For admin, let's use ADM + Random 3 digits if not strict
        const randomId = Math.floor(100 + Math.random() * 900);
        const adminId = `ADM${randomId}`;

        // 6. Create User
        const newAdmin = new User({
            id: adminId,
            name: name,
            email: email,
            password: hashedPassword,
            role: 'ADMIN',
            status: 'Active',
            designation: 'System Administrator',
            department: 'Administration'
        });

        await newAdmin.save();
        console.log(`✅ Admin created successfully!`);
        console.log(`   ID: ${adminId}`);
        console.log(`   Email: ${email}`);

    } catch (err) {
        console.error('❌ Failed to create admin:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

createAdmin();
