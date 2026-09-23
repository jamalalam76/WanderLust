const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError");
const { listingSchema, reviewSchema } = require("./schema");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    let redirect = req.originalUrl || "/listings";
    if (redirect.includes("/reviews")) {
      redirect = redirect.split("/reviews")[0];
    }
    req.session.redirectUrl = redirect;
    req.flash("error", "You must be logged in to submit a review!");
    return res.redirect("/login");
  }
  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

const mongoose = require("mongoose");

module.exports.isOwner = async (req, res, next) => {
  let { id } = req.params;
  if (!id || id.startsWith("demo_") || mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(id)) {
    return next();
  }
  try {
    let listing = await Listing.findById(id);
    if (listing && listing.owner && res.locals.currentUser && !listing.owner.equals(res.locals.currentUser._id)) {
      req.flash("error", "You don't have permission to modify this listing!");
      return res.redirect(`/listings/${id}`);
    }
  } catch (err) {
    console.log("isOwner check error:", err.message);
  }
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  let { id, reviewId } = req.params;
  if (!reviewId || reviewId.startsWith("demo_") || mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(reviewId)) {
    return next();
  }
  try {
    let review = await Review.findById(reviewId);
    if (review && review.author && res.locals.currentUser && !review.author.equals(res.locals.currentUser._id)) {
      req.flash("error", "You are not the author of this review!");
      return res.redirect(`/listings/${id}`);
    }
  } catch (err) {
    console.log("isReviewAuthor check error:", err.message);
  }
  next();
};

module.exports.validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

module.exports.validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};
