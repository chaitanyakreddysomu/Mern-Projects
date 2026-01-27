const router = require('express').Router();
const employeeController = require('../controllers/employeeController');
const complaintController = require('../controllers/complaintController');
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/profile', auth, employeeController.getProfile);
router.patch('/profile', auth, employeeController.updateProfile);
router.post('/profile-image', auth, upload.single('image'), employeeController.uploadProfileImage);
router.post('/documents/upload', auth, upload.single('document'), employeeController.uploadDocument);
router.get('/documents/preview', auth, employeeController.getDocumentPreview);

// Complaint Routes
router.post('/complaints', auth, complaintController.createComplaint);
router.get('/complaints', auth, complaintController.getComplaints);

// Notification Routes
router.get('/notifications', auth, notificationController.getNotifications);
router.get('/notifications/:id', auth, notificationController.getNotificationById);
router.patch('/notifications/:id', auth, notificationController.markRead);

router.get('/policies', auth, employeeController.getPolicies);
router.get('/holidays', auth, employeeController.getHolidays);

// Leave Routes
const leaveController = require('../controllers/leaveController');
router.post('/leaves', auth, leaveController.createLeave);
router.get('/leaves', auth, leaveController.getMyLeaves);

// Payslip Routes
const payslipController = require('../controllers/payslipController');
router.get('/payslips', auth, payslipController.getPayslips);
router.get('/payslips/:id', auth, payslipController.getPayslipById); // getPayslipById is already in controller from Admin work

module.exports = router;
