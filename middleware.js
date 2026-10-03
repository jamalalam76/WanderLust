const Listing = require("./models/listing");
const Review = require("./models/review");
const User = require("./models/user");
const ExpressError = require("./utils/ExpressError");
const { listingSchema, reviewSchema } = require("./schema");
const mongoose = require("mongoose");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    let msg = "You must be logged in!";
    if (req.originalUrl && req.originalUrl.includes("/edit")) {
      msg = "You must be logged in to edit listing!";
    } else if (req.originalUrl && (req.originalUrl.includes("/new") || req.method === "POST")) {
      msg = "You must be logged in to create listing!";
    }
    req.flash("error", msg);
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

module.exports.isOwner = async (req, res, next) => {
  let { id } = req.params;
  const currUser = res.locals.currentUser;

  if (!currUser) {
    req.flash("error", "You are not owner of this project!");
    return res.redirect(`/listings/${id}`);
  }

  let listing = null;
  if (mongoose.connection.readyState === 1 && !id.startsWith("demo_") && mongoose.Types.ObjectId.isValid(id)) {
    try {
      listing = await Listing.findById(id).populate("owner");
    } catch (err) {
      console.log("isOwner DB error:", err.message);
    }
  }

  if (!listing) {
    try {
      const listingsController = require("./controllers/listings");
      if (listingsController.demoCreatedListings) {
        listing = listingsController.demoCreatedListings.find((l) => l._id === id);
      }
      if (!listing && typeof listingsController.getFallbackListings === "function") {
        const fallbacks = listingsController.getFallbackListings();
        listing = fallbacks.find((l) => l._id === id);
      }
    } catch (err) {
      console.log("isOwner fallback error:", err.message);
    }
  }

  if (!listing) {
    req.flash("error", "Listing requested does not exist!");
    return res.redirect("/listings");
  }

  if (listing && listing.owner) {
    let isMatch = false;

    const currId = currUser._id ? currUser._id.toString() : null;
    const currUsername = currUser.username ? currUser.username.trim().toLowerCase() : null;

    let ownerId = null;
    let ownerUsername = null;

    if (listing.owner._id) {
      ownerId = listing.owner._id.toString();
    } else if (typeof listing.owner === "string" || listing.owner instanceof mongoose.Types.ObjectId) {
      ownerId = listing.owner.toString();
    }

    if (listing.owner.username) {
      ownerUsername = listing.owner.username.trim().toLowerCase();
    }

    if (!ownerUsername && ownerId && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(ownerId)) {
      try {
        const ownerDoc = await User.findById(ownerId);
        if (ownerDoc) {
          if (ownerDoc._id) ownerId = ownerDoc._id.toString();
          if (ownerDoc.username) ownerUsername = ownerDoc.username.trim().toLowerCase();
        }
      } catch (e) {
        console.log("isOwner User lookup error:", e.message);
      }
    }

    if (currId && ownerId && currId === ownerId) {
      isMatch = true;
    } else if (currUsername && ownerUsername && currUsername === ownerUsername) {
      isMatch = true;
    }

    if (!isMatch) {
      req.flash("error", "You are not owner of this project!");
      return res.redirect(`/listings/${id}`);
    }
  } else {
    req.flash("error", "You are not owner of this project!");
    return res.redirect(`/listings/${id}`);
  }

  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  let { id, reviewId } = req.params;
  const currUser = res.locals.currentUser;

  if (!currUser) {
    req.flash("error", "You must be logged in to delete a review!");
    return res.redirect(`/listings/${id}`);
  }

  let review = null;
  if (mongoose.connection.readyState === 1 && !reviewId.startsWith("demo_") && mongoose.Types.ObjectId.isValid(reviewId)) {
    try {
      review = await Review.findById(reviewId).populate("author");
    } catch (err) {
      console.log("isReviewAuthor DB error:", err.message);
    }
  }

  if (!review) {
    try {
      const reviewsController = require("./controllers/reviews");
      if (reviewsController.demoReviewsMap && reviewsController.demoReviewsMap[id]) {
        review = reviewsController.demoReviewsMap[id].find((r) => r._id === reviewId);
      }
    } catch (err) {
      console.log("isReviewAuthor fallback error:", err.message);
    }
  }

  if (review && review.author) {
    let isMatch = false;

    const currId = currUser._id ? currUser._id.toString() : null;
    const currUsername = currUser.username ? currUser.username.trim().toLowerCase() : null;

    let authorId = null;
    let authorUsername = null;

    if (typeof review.author === "object") {
      authorId = review.author._id ? review.author._id.toString() : null;
      authorUsername = review.author.username ? review.author.username.trim().toLowerCase() : null;
    } else if (review.author) {
      authorId = review.author.toString();
    }

    if (currId && authorId && currId === authorId) {
      isMatch = true;
    } else if (currUsername && authorUsername && currUsername === authorUsername) {
      isMatch = true;
    }

    if (!isMatch) {
      req.flash("error", "You are not the author of this review!");
      return res.redirect(`/listings/${id}`);
    }
  } else {
    req.flash("error", "You are not the author of this review!");
    return res.redirect(`/listings/${id}`);
  }

  next();
};

module.exports.validateListing = (req, res, next) => {
  if (!req.body || !req.body.listing) {
    req.body = req.body || {};
    req.body.listing = req.body.listing || {};
  }
  if (req.body.listing.price) {
    req.body.listing.price = Number(req.body.listing.price);
  }
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(", ");
    console.log("Listing Validation Error:", errMsg);
    req.flash("error", errMsg);
    return res.redirect("/listings/new");
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
