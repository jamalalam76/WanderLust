const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const listingController = require("../controllers/listings");
const { isLoggedIn, isOwner, validateListing } = require("../middleware");
const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });

const uploadWithFallback = (req, res, next) => {
  upload.single("listing[image]")(req, res, (err) => {
    if (err) {
      console.log("Multer / Cloudinary upload note:", err.message);
      req.file = null;
    }
    next();
  });
};

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    uploadWithFallback,
    validateListing,
    wrapAsync(listingController.createListing)
  );

router.get("/new", isLoggedIn, listingController.renderNewForm);

router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isOwner,
    uploadWithFallback,
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(isOwner, wrapAsync(listingController.destroyListing));

router.get("/:id/edit", isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;
