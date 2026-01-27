const router = require('express').Router();
const complaintController = require('../controllers/complaintController');
const auth = require('../middleware/auth');

router.post('/', auth, complaintController.createComplaint);
router.get('/', auth, complaintController.getComplaints);
router.patch('/:id', auth, complaintController.updateComplaint);

module.exports = router;
