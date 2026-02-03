const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars immediately
dotenv.config();

const connectDB = require('./db');
const compression = require('compression');
require('./config/firebase'); // Init Firebase Admin

const app = express();

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

// Routes Placeholder
app.get('/', (req, res) => {
    res.send('ICS HRMS API is running');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/employee', require('./routes/employee'));

app.use('/api/leaves', require('./routes/leaves'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/payslips', require('./routes/payslips'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/ai', require('./routes/aiRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
