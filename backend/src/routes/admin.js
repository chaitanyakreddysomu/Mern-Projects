const router = require('express').Router();
const adminController = require('../controllers/adminController');
const logController = require('../controllers/logController');
const auth = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Dashboard Routes
router.get('/dashboard', auth, adminController.getAdminDashboardStats);

// Profile Routes
router.get('/profile', auth, adminController.getAdminProfile);
router.patch('/profile/edit', auth, adminController.updateAdminProfile);
router.post('/profile-image', auth, upload.single('image'), adminController.uploadProfileImage);
router.get('/bank-details', auth, adminController.getAdminBankDetails);

// Pending Requests Routes
router.get('/pending-requests', auth, adminController.getPendingRequests);
router.get('/pending-requests/:id', auth, adminController.getRequestById);
router.patch('/pending-requests/:id', auth, adminController.updateRequestStatus);

// Employee Management Routes
router.get('/employees', auth, adminController.getAllEmployees);
router.get('/employees/:id', auth, adminController.getEmployeeById);
router.put('/employees/:id', auth, adminController.updateEmployee);
router.get('/employee-bank-details', auth, adminController.getEmployeeBankDetails);

// Document Management Routes
// Document Management Routes
router.get('/documents', auth, adminController.getAllEmployeeDocuments);
router.get('/document-preview', auth, adminController.getAdminDocumentPreview);
router.get('/documents/:id', auth, adminController.getEmployeeDocuments); // :id can be empId
router.put('/documents/:empId/:docId', auth, adminController.updateDocumentStatus);

// Attendance Routes
router.get('/attendance', auth, adminController.getAttendanceRecords);

// Leave Management Routes
router.get('/leaves', auth, adminController.getLeaveRequests);
router.get('/leaves/:id', auth, adminController.getLeaveRequestById);
router.put('/leaves/:id', auth, adminController.updateLeaveStatus);

// Holiday Management Routes
router.get('/holidays', auth, adminController.getHolidays);
router.post('/holidays', auth, adminController.createHoliday);
router.patch('/holidays/:id', auth, adminController.updateHoliday);
router.delete('/holidays/:id', auth, adminController.deleteHoliday);

// Policy Management Routes
router.get('/policies', auth, adminController.getPolicies);
router.post('/policies', auth, adminController.createPolicy);
router.put('/policies/:id', auth, adminController.updatePolicy);
router.delete('/policies/:id', auth, adminController.deletePolicy);

// Notification Management Routes
router.get('/notifications/sent', auth, adminController.getSentNotifications);
router.get('/notifications', auth, adminController.getAdminNotifications);
router.post('/notifications', auth, adminController.createAdminNotification);
router.post('/notifications/fcm-token', auth, adminController.saveFCMToken); // NEW
router.get('/notifications/:id', auth, adminController.getNotificationById);
router.patch('/notifications/:id', auth, adminController.updateNotificationStatus);

// Complaint Management Routes
router.get('/complaints', auth, adminController.getAdminComplaints);
router.get('/complaints/:id', auth, adminController.getComplaintById);
router.patch('/complaints/:id', auth, adminController.updateComplaintStatus);

// Payslip Management Routes
router.post('/payslips', auth, adminController.createPayslip); // Create and Auto-Calculate
router.get('/payslips', auth, adminController.getAdminPayslips);
router.get('/payslips/:id', auth, adminController.getPayslipById);
router.patch('/payslips/:id', auth, adminController.updatePayslip);
router.delete('/payslips/:id', auth, adminController.deletePayslip);
router.get('/payslips/calculate/stats', auth, adminController.calculatePayslipStats); // Helper for frontend

// Salary Structure Routes
router.get('/salary-structures', auth, adminController.getSalaryStructures);
router.post('/salary-structures', auth, adminController.createSalaryStructure);
router.patch('/salary-structures/:id', auth, adminController.updateSalaryStructure);
router.delete('/salary-structures/:id', auth, adminController.deleteSalaryStructure);
router.get('/salary-structures/calculate/:empId', auth, adminController.getEmployeeSalaryDetails); // Helper

// System Logs
router.get('/logs', auth, logController.getLogs);

module.exports = router;
