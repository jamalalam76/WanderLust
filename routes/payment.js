const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const paymentController = require("../controllers/payment");

// Allow both logged-in and guest users to create Razorpay payment orders & verify transactions
router.post("/create-order", wrapAsync(paymentController.createOrder));
router.post("/verify", paymentController.verifyPayment);

module.exports = router;
