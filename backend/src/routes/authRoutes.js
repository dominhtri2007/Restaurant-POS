const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter } = require('../middlewares/rateLimiter');

router.post('/login', loginLimiter, authController.login);
router.get('/me', authController.getMe);

module.exports = router;
