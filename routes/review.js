const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync");
const reviewController = require("../controllers/reviews");
const { isLoggedIn, isReviewAuthor, validateReview } = require("../middleware");

// Fallback GET Route to prevent 404 Page Not Found if redirected to /listings/:id/reviews
router.get("/", (req, res) => {
  res.redirect(`/listings/${req.params.id}`);
});

// Post Review Route
router.post("/", isLoggedIn, validateReview, wrapAsync(reviewController.createReview));

// Delete Review Route
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(reviewController.destroyReview));

module.exports = router;
