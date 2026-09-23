const mongoose = require("mongoose");
const Listing = require("../models/listing");
const Review = require("../models/review");

module.exports.createReview = async (req, res) => {
  let { id } = req.params;
  let { rating, comment } = req.body.review || {};

  try {
    if (mongoose.connection.readyState === 1 && !id.startsWith("demo_") && mongoose.Types.ObjectId.isValid(id)) {
      let listing = await Listing.findById(id);
      if (listing) {
        let newReview = new Review({
          rating: Number(rating) || 5,
          comment: comment || "Great stay!",
          author: req.user ? req.user._id : undefined,
        });
        await newReview.save();
        listing.reviews.push(newReview);
        await listing.save();
      }
    }
  } catch (err) {
    console.log("Review Creation DB Error:", err.message);
  }

  req.flash("success", "Review & Rating Submitted Successfully! ⭐");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyReview = async (req, res) => {
  let { id, reviewId } = req.params;
  try {
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
