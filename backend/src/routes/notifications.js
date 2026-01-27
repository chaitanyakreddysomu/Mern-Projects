const router = require('express').Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.post('/', auth, notificationController.createNotification);
router.get('/', auth, notificationController.getNotifications);
router.patch('/:id/read', auth, notificationController.markRead);
router.post('/subscribe', auth, notificationController.subscribe);
router.post('/register-fcm', auth, notificationController.registerFCM);
router.get('/check-fcm-status', auth, notificationController.checkFCMStatus);

router.get('/check-fcm-status', auth, notificationController.checkFCMStatus);
router.post('/test-fcm', auth, notificationController.sendTestFCM);

module.exports = router;
