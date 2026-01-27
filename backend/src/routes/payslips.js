const router = require('express').Router();
const payslipController = require('../controllers/payslipController');
const auth = require('../middleware/auth');

router.post('/', auth, payslipController.createPayslip); // Normally Admin only
router.get('/', auth, payslipController.getPayslips);
router.patch('/:id', auth, payslipController.updatePayslip);

module.exports = router;
