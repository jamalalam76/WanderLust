const User = require("../models/user");
const passport = require("passport");

module.exports.renderSignup = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to WanderLust!");
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

  // Check if input is an email address
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
    .catch((err) => next(err));
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
