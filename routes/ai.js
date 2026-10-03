const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const aiController = require("../controllers/ai");

router.post("/generate-description", wrapAsync(aiController.generateDescription));
router.post("/chat", wrapAsync(aiController.chatWithTripNovaBot));
router.post("/predict-image", wrapAsync(aiController.predictImage));

module.exports = router;
