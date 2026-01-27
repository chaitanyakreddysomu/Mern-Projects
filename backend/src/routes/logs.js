const router = require('express').Router();
const logController = require('../controllers/logController');
const auth = require('../middleware/auth');

router.post('/', auth, logController.createLog);
router.get('/', auth, logController.getLogs);

module.exports = router;
