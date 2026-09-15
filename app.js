if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const User = require("./models/user.js");
const ExpressError = require("./utils/ExpressError.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const paymentRouter = require("./routes/payment.js");
const aiRouter = require("./routes/ai.js");

// Fallback to Cloud MongoDB Atlas when process.env.MONGO_URL is not set
const cloudDbUrl = "mongodb+srv://wanderlust_user:Wanderlust2026Secure@cluster0.mongodb.net/wanderlust?retryWrites=true&w=majority";
const dbUrl = process.env.MONGO_URL || cloudDbUrl;

main()
  .then(() => {
    console.log("Connected to MongoDB database successfully");
  })
  .catch((err) => {
    console.log("Database connection error:", err);
  });

async function main() {
  try {
    await mongoose.connect(dbUrl);
  } catch(e) {
    console.log("Primary DB connection failed, attempting Atlas fallback...", e.message);
    if (dbUrl !== cloudDbUrl) {
      await mongoose.connect(cloudDbUrl);
    }
  }
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

// Express Session Configuration
const sessionOptions = {
  secret: process.env.SECRET || "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 Days
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOptions));
app.use(flash());

// Passport Authentication Configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Local Flash & User Variables Middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  next();
});

// Root Route Redirect
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// Modular Routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/payment", paymentRouter);
app.use("/api/ai", aiRouter);
app.use("/", userRouter);

// 404 Route Catch-All (Express 5 Compatible)
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

// Custom Error Handling Middleware
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", { err, message });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Wanderlust server is running on port ${port}`);
});