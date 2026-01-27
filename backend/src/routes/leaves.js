const router = require('express').Router();
const leaveController = require('../controllers/leaveController');
const auth = require('../middleware/auth');

router.post('/', auth, leaveController.createLeave);
router.get('/my', auth, leaveController.getMyLeaves);
router.get('/', auth, leaveController.getLeaves);
router.patch('/:id', auth, leaveController.updateLeaveStatus);

module.exports = router;
