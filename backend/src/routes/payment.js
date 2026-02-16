const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment');

router.post('/create-order', paymentController.createOrder);
router.post('/verify-payment', paymentController.verifyPayment);
router.post('/upgrade-membership', paymentController.upgradeMembership);
router.get('/key', paymentController.getRazorpayKey);

module.exports = router;
