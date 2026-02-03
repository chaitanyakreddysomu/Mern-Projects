const express = require('express');
const router = express.Router();
const { generateLeave, generateComplaint } = require('../controllers/aiController');
const protect = require('../middleware/auth');

// Route to generate leave application
// Protected route ensures only logged-in users can use it
router.post('/generate-leave', protect, generateLeave);
router.post('/generate-complaint', protect, generateComplaint);

module.exports = router;
