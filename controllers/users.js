const mongoose = require("mongoose");
const User = require("../models/user");
const passport = require("passport");

module.exports.renderSignup = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;

    if (mongoose.connection.readyState === 1) {
      const newUser = new User({ email, username });
      const registeredUser = await User.register(newUser, password);
      return req.login(registeredUser, (err) => {
        if (err) return next(err);
        req.flash("success", "Welcome to WanderLust!");
        res.redirect("/listings");
      });
    }

    // Demo Mode Fallback Signup (when DB not connected)
    const demoUser = new User({
      email: email || "demo@wanderlust.com",
      username: username || "demouser"
    });
    demoUser._id = "demo_user_id";
    req.login(demoUser, (err) => {
      if (err) return next(err);
      req.flash("success", `Welcome to WanderLust, ${demoUser.username}!`);
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

module.exports.renderLogin = (req, res) => {
  res.render("users/login.ejs");
};

// Custom Login Handler supporting Username OR Email login
module.exports.login = (req, res, next) => {
  const { username, password } = req.body;

  if (mongoose.connection.readyState !== 1) {
    // Demo Mode Fallback Login (when DB not connected)
    const demoUser = new User({
      email: "demo@wanderlust.com",
      username: username || "demouser"
    });
    demoUser._id = "demo_user_id";
    return req.login(demoUser, (loginErr) => {
      if (loginErr) return next(loginErr);
      req.flash("success", `Welcome back to WanderLust, ${demoUser.username}!`);
      let redirectUrl = res.locals.redirectUrl || "/listings";
      res.redirect(redirectUrl);
    });
  }

  // Real Database Login
  User.findOne({ $or: [{ username: username }, { email: username }] })
    .then((user) => {
      if (!user) {
        req.flash("error", "Invalid username/email or password!");
        return res.redirect("/login");
      }
      req.body.username = user.username; // Normalize to username for Passport
      passport.authenticate("local", (err, authenticatedUser, info) => {
        if (err) return next(err);
        if (!authenticatedUser) {
          req.flash("error", info ? info.message : "Invalid username/email or password!");
          return res.redirect("/login");
        }
        req.login(authenticatedUser, (loginErr) => {
          if (loginErr) return next(loginErr);
          req.flash("success", `Welcome back to WanderLust, ${authenticatedUser.username}!`);
          let redirectUrl = res.locals.redirectUrl || "/listings";
          res.redirect(redirectUrl);
        });
      })(req, res, next);
    })
    .catch((err) => {
      console.log("Login DB Error:", err.message);
      req.flash("error", "Database connection error. Try logging in as demouser!");
      res.redirect("/login");
    });
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You are logged out!");
    res.redirect("/listings");
  });
};
