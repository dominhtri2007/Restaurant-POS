const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { orderLimiter } = require('../middlewares/rateLimiter');

router.get('/scan/:table_id', customerController.scanTable);

router.get('/table/session/:token', customerController.getSessionByToken);

router.get('/menu', customerController.getMenu);

router.post('/orders', orderLimiter, customerController.createOrder);

router.get('/store/status', customerController.getStoreStatus);

router.get('/announcement', customerController.getAnnouncement);

module.exports = router;
