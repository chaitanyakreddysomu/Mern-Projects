const router = require('express').Router();
const hrController = require('../controllers/hrController');
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/dashboard', auth, hrController.getHRDashboardStats);
router.get('/profile', auth, hrController.getHRProfile);
router.put('/profile', auth, hrController.updateHRProfile);
router.patch('/profile', auth, hrController.updateHRProfile);
router.post('/profile-image', auth, upload.single('image'), hrController.uploadProfileImage);

// Documents
router.post('/documents/upload', auth, upload.single('document'), hrController.uploadDocument);
router.get('/documents/preview', auth, hrController.getDocumentPreview);

router.get('/employee-complaints', auth, hrController.getAllEmployeeComplaints);
router.patch('/employee-complaints/:id', auth, hrController.updateComplaintStatus);
router.get('/my-complaints', auth, hrController.getMyComplaints);
router.post('/my-complaints', auth, hrController.createMyComplaint);
router.get('/notifications/sent', auth, hrController.getSentNotifications);
router.get('/notifications/my', auth, hrController.getReceivedNotifications);
router.post('/notifications', auth, hrController.createHRNotification);
router.patch('/notifications/:id/read', auth, hrController.markNotificationAsRead);
router.get('/employees/select', auth, hrController.getAllEmployeesForSelect);
router.get('/employees', auth, hrController.getEmployees);
router.get('/employees/:id', auth, hrController.getEmployeeById);

// Registration Requests
router.get('/pending-requests', auth, hrController.getPendingRequests);
router.get('/pending-requests/:id', auth, hrController.getPendingRequestById);
router.patch('/pending-requests/:id', auth, hrController.updateRequestStatus);

// Policy Management (HR can also manage policies)
router.get('/policies', auth, adminController.getPolicies);
router.post('/policies', auth, adminController.createPolicy);
router.put('/policies/:id', auth, adminController.updatePolicy);
router.delete('/policies/:id', auth, adminController.deletePolicy);

// Leave Management
router.get('/leaves', auth, hrController.getLeaveRequests);
router.get('/leaves/:id', auth, hrController.getLeaveRequestById);
router.put('/leaves/:id', auth, hrController.updateLeaveStatus);

const attendanceController = require('../controllers/attendanceController');

// Attendance (Personal Punch In/Out)
router.post('/punch-in', auth, attendanceController.punchIn);
router.patch('/punch-out', auth, attendanceController.punchOut);
router.get('/attendance/status', auth, attendanceController.getTodayStatus);

// Attendance (View All)
router.get('/attendance', auth, adminController.getAttendanceRecords);

// Payslips (Personal)
router.get('/payslips', auth, hrController.getHRPayslips);

module.exports = router;
