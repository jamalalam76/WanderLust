const mongoose = require("mongoose");
const Listing = require("../models/listing");
const sampleData = require("../init/data.js");

const categoriesList = [
  "Beachfront",
  "Villas",
  "Rooms",
  "Iconic Cities",
  "Mountains",
  "Castles",
  "Amazing Pools",
  "Camping",
  "Farms",
  "Arctic",
  "Trending"
];

const { demoReviewsMap } = require("./reviews");
const { predictAIImage } = require("../utils/aiHelper");

const defaultSampleReviews = [
  {
    _id: "demo_rev_1",
    author: { username: "Jane Doe" },
    comment: "Excellent experience, must visit for all!",
    rating: 5,
    createdAt: new Date()
  },
  {
    _id: "demo_rev_2",
    author: { username: "Jane Doe" },
    comment: "very poor staff, not good at all",
    rating: 1,
    createdAt: new Date()
  },
  {
    _id: "demo_rev_3",
    author: { username: "Jane Doe" },
    comment: "Great place for a vacation!",
    rating: 4,
    createdAt: new Date()
  },
  {
    _id: "demo_rev_4",
    author: { username: "Jane Doe" },
    comment: "Must visit",
    rating: 5,
    createdAt: new Date()
  },
  {
    _id: "demo_rev_5",
    author: { username: "Jane Doe" },
    comment: "poor location, not easy to reach, lots of noise",
    rating: 2,
    createdAt: new Date()
  }
];

// In-memory store for newly created listings when DB is offline or fallback is used
const demoCreatedListings = [];

const getFallbackListings = (query = {}) => {
  let sampleItems = sampleData.data.map((item, index) => {
    let cat = item.location === "Goa" ? "Beachfront" : categoriesList[index % categoriesList.length];
    const listingId = `demo_${index + 1}`;
    const extraReviews = demoReviewsMap[listingId] || [];
    return {
      _id: listingId,
      title: item.title,
      description: item.description,
      image: item.image,
      price: item.price,
      location: item.location,
      country: item.country,
      owner: { username: "Jamal Ashraf", email: "jamal@wanderlust.com" },
      category: cat,
      reviews: [...defaultSampleReviews, ...extraReviews],
      amenities: ["Wifi", "Air Conditioning", "Free Parking", "Kitchen", "Pool"],
      geometry: { type: "Point", coordinates: [73.8567, 15.2993] }
    };
  });

  let data = [...demoCreatedListings, ...sampleItems];

  const { category, search } = query;

  if (category && category !== "All" && category !== "Trending") {
    data = data.filter(item => 
      (item.category && item.category.toLowerCase() === category.trim().toLowerCase()) ||
      (category.toLowerCase() === "beachfront" && item.location && item.location.toLowerCase() === "goa")
    );
  }

  if (search && search.trim() !== "") {
    const q = search.trim().toLowerCase();
    data = data.filter(item => 
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.location && item.location.toLowerCase().includes(q)) ||
      (item.country && item.country.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  }

  return data;
};

module.exports.index = async (req, res) => {
  const { category, search } = req.query;
  let filter = {};

  if (category && category !== "All" && category !== "Trending") {
    filter.category = new RegExp(`^${category.trim()}$`, "i");
  }

  if (search && search.trim() !== "") {
    const searchRegex = new RegExp(search.trim(), "i");
    filter.$or = [
      { title: searchRegex },
      { location: searchRegex },
      { country: searchRegex },
      { category: searchRegex },
      { description: searchRegex }
    ];
  }

  let allListings = [];
  const isDbConnected = (mongoose.connection.readyState === 1);

  if (isDbConnected) {
    try {
      let dbListings = await Listing.find(filter);
      const totalCount = await Listing.countDocuments();
      if (totalCount === 0) {
        allListings = getFallbackListings(req.query);
      } else {
        allListings = [...demoCreatedListings, ...dbListings];
      }
    } catch (err) {
      console.log("DB Query Fallback triggered:", err.message);
      allListings = getFallbackListings(req.query);
    }
  } else {
    allListings = getFallbackListings(req.query);
  }

  res.render("listings/index.ejs", { 
    allListings, 
    category: category || "All", 
    search: search || "" 
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  let listing = null;

  try {
    if (mongoose.connection.readyState === 1 && !id.startsWith("demo_")) {
      listing = await Listing.findById(id)
        .populate({
          path: "reviews",
          populate: { path: "author" },
        })
        .populate("owner");
    }
  } catch (err) {
    console.log("DB showListing Fallback triggered:", err.message);
  }

  if (!listing) {
    listing = demoCreatedListings.find(l => l._id === id);
  }

  if (!listing) {
    const fallbackListings = getFallbackListings();
    listing = fallbackListings.find(l => l._id === id) || fallbackListings[0];
  } else {
    const extraReviews = demoReviewsMap[id] || [];
    if (!listing.reviews || listing.reviews.length === 0) {
      listing.reviews = [...defaultSampleReviews, ...extraReviews];
    } else {
      listing.reviews = [...listing.reviews, ...extraReviews];
    }
  }

  if (!listing) {
    req.flash("error", "Listing requested does not exist!");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
  const listingData = req.body.listing || {};
  let url = predictAIImage(listingData.title, listingData.location, listingData.category);
  let filename = "listingimage";

  if (req.file) {
    url = req.file.path || url;
    filename = req.file.filename || filename;
  } else if (listingData.imageUrl && typeof listingData.imageUrl === "string" && listingData.imageUrl.trim() !== "") {
    url = listingData.imageUrl.trim();
  } else if (listingData.image && typeof listingData.image === "string" && listingData.image.trim() !== "") {
    url = listingData.image.trim();
  }

  const isDbConnected = (mongoose.connection.readyState === 1);
  let savedToDb = false;

  const newId = `demo_new_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const fallbackObject = {
    _id: newId,
    title: listingData.title || "New Listing",
    description: listingData.description || "",
    image: { url, filename },
    price: Number(listingData.price) || 0,
    location: listingData.location || "",
    country: listingData.country || "",
    category: listingData.category || "Trending",
    owner: { 
      _id: (req.user && req.user._id) ? req.user._id : "demo_user_id",
      username: (req.user && req.user.username) ? req.user.username : "Jamal Ashraf", 
      email: (req.user && req.user.email) ? req.user.email : "jamal@wanderlust.com" 
    },
    reviews: [...defaultSampleReviews],
    amenities: ["Wifi", "Air Conditioning", "Free Parking", "Kitchen"],
    geometry: { type: "Point", coordinates: [73.8567, 15.2993] }
  };

  if (isDbConnected) {
    try {
      const newListing = new Listing(listingData);
      newListing.image = { url, filename };

      if (req.user && req.user._id) {
        newListing.owner = req.user._id;
      }

      await newListing.save();
      savedToDb = true;
    } catch (err) {
      console.log("DB Save Error:", err.message);
    }
  }

  if (!savedToDb) {
    demoCreatedListings.unshift(fallbackObject);
  }

  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  let listing = null;
  try {
    if (mongoose.connection.readyState === 1 && !id.startsWith("demo_")) {
      listing = await Listing.findById(id);
    }
  } catch (err) {
    console.log("DB renderEditForm Fallback:", err.message);
  }

  if (!listing) {
    listing = demoCreatedListings.find(l => l._id === id);
  }

  if (!listing) {
    const fallbackListings = getFallbackListings();
    listing = fallbackListings.find(l => l._id === id) || fallbackListings[0];
  }

  if (!listing) {
    req.flash("error", "Listing requested does not exist!");
    return res.redirect("/listings");
  }
  res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let updatedInDb = false;

  try {
    if (mongoose.connection.readyState === 1 && !id.startsWith("demo_")) {
      let listing = await Listing.findById(id);
      if (listing) {
        if (req.file) {
          listing.image = { url: req.file.path, filename: req.file.filename };
        } else if (req.body.listing && typeof req.body.listing.image === "string" && req.body.listing.image.trim() !== "") {
          listing.image = { url: req.body.listing.image, filename: "listingimage" };
        }
        Object.assign(listing, req.body.listing);
        await listing.save();
        updatedInDb = true;
      }
    }
  } catch (err) {
    console.log("DB updateListing Fallback:", err.message);
  }

  if (!updatedInDb) {
    let demoItem = demoCreatedListings.find(l => l._id === id);
    if (demoItem) {
      Object.assign(demoItem, req.body.listing);
      if (req.file) {
        demoItem.image = { url: req.file.path, filename: req.file.filename };
      }
    }
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  try {
    if (mongoose.connection.readyState === 1 && !id.startsWith("demo_")) {
      let deletedListing = await Listing.findByIdAndDelete(id);
      console.log("Deleted Listing:", deletedListing);
    }
  } catch (err) {
    console.log("DB destroyListing Fallback:", err.message);
  }

  const idx = demoCreatedListings.findIndex(l => l._id === id);
  if (idx !== -1) {
    demoCreatedListings.splice(idx, 1);
  }

  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

module.exports.demoCreatedListings = demoCreatedListings;
module.exports.getFallbackListings = getFallbackListings;
