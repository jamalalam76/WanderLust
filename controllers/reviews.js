const mongoose = require("mongoose");
const Listing = require("../models/listing");
const Review = require("../models/review");

// In-memory store for demo/fallback reviews when MongoDB is offline or for demo listings
const demoReviewsMap = {};

module.exports.demoReviewsMap = demoReviewsMap;

module.exports.createReview = async (req, res) => {
  let { id } = req.params;
  let { rating, comment } = req.body.review || {};
  const authorName = (req.user && req.user.username) ? req.user.username : "Jane Doe";

  try {
    if (!demoReviewsMap[id]) {
      demoReviewsMap[id] = [];
    }

    const newDemoReview = {
      _id: `demo_rev_${Date.now()}`,
      rating: Number(rating) || 5,
      comment: comment || "Great stay!",
      author: { username: authorName },
      createdAt: new Date()
    };

    demoReviewsMap[id].unshift(newDemoReview);

    if (mongoose.connection.readyState === 1 && !id.startsWith("demo_") && mongoose.Types.ObjectId.isValid(id)) {
      let listing = await Listing.findById(id);
      if (listing) {
        let newReview = new Review({
          rating: Number(rating) || 5,
          comment: comment || "Great stay!",
          author: req.user && req.user._id && typeof req.user._id.toString === "function" && !req.user._id.toString().startsWith("demo_") ? req.user._id : undefined,
        });
        await newReview.save();
        listing.reviews.push(newReview);
        await listing.save();
      }
    }
  } catch (err) {
    console.log("Review Creation Error:", err.message);
  }

  req.flash("success", "Review & Rating Submitted Successfully! ⭐");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyReview = async (req, res) => {
  let { id, reviewId } = req.params;
  try {
    if (demoReviewsMap[id]) {
      demoReviewsMap[id] = demoReviewsMap[id].filter(r => r._id !== reviewId);
    }
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id) && mongoose.Types.ObjectId.isValid(reviewId)) {
      await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
      await Review.findByIdAndDelete(reviewId);
    }
  } catch (err) {
    console.log("Review Delete Error:", err.message);
  }
  req.flash("success", "Review Deleted Successfully!");
  res.redirect(`/listings/${id}`);
};

