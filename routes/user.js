const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const userController = require("../controllers/users");
const { saveRedirectUrl } = require("../middleware");

router
  .route("/signup")
  .get(userController.renderSignup)
  .post(wrapAsync(userController.signup));

router
  .route("/login")
  .get(userController.renderLogin)
  .post(saveRedirectUrl, userController.login);

router.get("/logout", userController.logout);

module.exports = router;
