const router = require('express').Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');

router.post('/punch-in', auth, attendanceController.punchIn);
router.patch('/punch-out', auth, attendanceController.punchOut);
router.get('/today', auth, attendanceController.getTodayStatus);
router.get('/stats', auth, attendanceController.getStats);
router.get('/', auth, attendanceController.getAttendance);
router.patch('/:id', auth, attendanceController.updateAttendance); // Keep general update for admins/edits if needed

module.exports = router;
