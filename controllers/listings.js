const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
  const { category, search } = req.query;
  let filter = {};

  if (category && category !== "All") {
    filter.category = category;
  }

  if (search && search.trim() !== "") {
    const searchRegex = new RegExp(search.trim(), "i");
    filter.$or = [
      { title: searchRegex },
      { location: searchRegex },
      { country: searchRegex },
      { category: searchRegex },
    ];
  }

  const allListings = await Listing.find(filter);
  res.render("listings/index.ejs", { allListings, category: category || "All", search: search || "" });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing requested does not exist!");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
  let url = "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?auto=format&fit=crop&w=800&q=60";
  let filename = "listingimage";

  if (req.file) {
    url = req.file.path;
    filename = req.file.filename;
  } else if (req.body.listing && typeof req.body.listing.image === "string" && req.body.listing.image.trim() !== "") {
    url = req.body.listing.image;
  }

  const newListing = new Listing(req.body.listing);
  newListing.image = { url, filename };
  if (req.user) {
    newListing.owner = req.user._id;
  }
  await newListing.save();
  req.flash("success", "New Listing Created Successfully!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing requested does not exist!");
    return res.redirect("/listings");
  }
  res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);

  if (req.file) {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
  } else if (req.body.listing && typeof req.body.listing.image === "string" && req.body.listing.image.trim() !== "") {
    listing.image = { url: req.body.listing.image, filename: "listingimage" };
  }

  Object.assign(listing, req.body.listing);
  await listing.save();

  req.flash("success", "Listing Updated Successfully!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log("Deleted Listing:", deletedListing);
  req.flash("success", "Listing Deleted Successfully!");
  res.redirect("/listings");
};
