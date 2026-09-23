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
const Listing = require("./models/listing.js");
const ExpressError = require("./utils/ExpressError.js");
const { initDB } = require("./init/index.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const paymentRouter = require("./routes/payment.js");
const aiRouter = require("./routes/ai.js");

// Database URL from Environment Variable or Local MongoDB
const dbUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
  try {
    await mongoose.connect(dbUrl, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB successfully!");
    
    // Auto-seed database if fresh or empty
    if (mongoose.connection.readyState === 1) {
      const count = await Listing.countDocuments();
      if (count === 0) {
        console.log("Empty database detected. Auto-seeding listings...");
        await initDB(false);
      }
    }
  } catch (err) {
    console.error("Database connection note:", err.message);
    console.log("⚠️ If running on Render, make sure to add MONGO_URL in Render Dashboard Environment variables.");
  }
}

main();

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

passport.serializeUser((user, done) => {
  if (user && user._id && typeof user._id.toString === "function" && !user._id.toString().startsWith("demo_")) {
    done(null, user._id);
  } else {
    done(null, {
      _id: (user && user._id) ? user._id : "demo_user_id",
      username: (user && user.username) ? user.username : "demouser",
      email: (user && user.email) ? user.email : "demo@wanderlust.com"
    });
  }
});

passport.deserializeUser(async (idOrUser, done) => {
  try {
    if (typeof idOrUser === "object" && idOrUser !== null) {
      const demoDoc = new User(idOrUser);
      if (idOrUser._id) demoDoc._id = idOrUser._id;
      return done(null, demoDoc);
    }

    if (typeof idOrUser === "string" && idOrUser.startsWith("demo_")) {
      const demoDoc = new User({
        _id: idOrUser,
        username: "demouser",
        email: "demo@wanderlust.com"
      });
      demoDoc._id = idOrUser;
      return done(null, demoDoc);
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(idOrUser)) {
      const user = await User.findById(idOrUser);
      if (user) {
        return done(null, user);
      }
    }

    // Fallback Mongoose document instance
    const fallbackUser = new User({
      email: "demo@wanderlust.com",
      username: "demouser"
    });
    done(null, fallbackUser);
  } catch (err) {
    console.log("Deserialize User Error:", err.message);
    const fallbackUser = new User({
      email: "demo@wanderlust.com",
      username: "demouser"
    });
    done(null, fallbackUser);
  }
});

// Local Flash & User Variables Middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  next();
});

// Root Route Redirect - First opens /signup for new visitors, then /login -> /listings
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/listings");
  }
  res.redirect("/signup");
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