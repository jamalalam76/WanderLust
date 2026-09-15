const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("Connected to MongoDB for database initialization");
    initDB();
  })
  .catch((err) => {
    console.log("DB Connection Error:", err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const categoriesList = [
  "Beachfront",
  "Villas",
  "Trending",
  "Rooms",
  "Iconic Cities",
  "Mountains",
  "Castles",
  "Amazing Pools",
  "Camping",
  "Farms",
  "Arctic",
];

const cityCoords = {
  "Goa": [73.8567, 15.2993],
  "Malibu": [-118.7798, 34.0259],
  "New York City": [-74.006, 40.7128],
  "Aspen": [-106.8175, 39.1911],
  "Florence": [11.2558, 43.7696],
  "Portland": [-122.6784, 45.5152],
  "Cancun": [-86.8515, 21.1619],
  "Lake Tahoe": [-120.0324, 39.0968],
  "Los Angeles": [-118.2437, 34.0522],
  "Verbier": [7.2286, 46.0961],
  "Serengeti National Park": [34.8333, -2.3333],
  "Amsterdam": [4.9041, 52.3676],
  "Fiji": [178.065, -17.7134],
  "Cotswolds": [-1.7201, 51.833],
  "Boston": [-71.0589, 42.3601],
  "Bali": [115.1889, -8.4095],
  "Banff": [-115.5708, 51.1784],
  "Miami": [-80.1918, 25.7617],
  "Phuket": [98.3981, 7.8804],
  "Scottish Highlands": [-4.2026, 57.3061],
  "Dubai": [55.2708, 25.2048],
  "Montana": [-110.3626, 46.8797],
  "Mykonos": [25.3289, 37.4467],
  "Costa Rica": [-84.0907, 9.7489],
  "Charleston": [-79.9311, 32.7765],
  "Tokyo": [139.6917, 35.6895],
  "New Hampshire": [-71.5724, 43.1939],
  "Maldives": [73.2207, 3.2028],
};

const initDB = async () => {
  await Listing.deleteMany({});
  await User.deleteMany({ username: "demouser" });

  // Create default admin/host user
  const demoUser = new User({
    email: "demo@wanderlust.com",
    username: "demouser",
  });
  const registeredUser = await User.register(demoUser, "demo123");

  const seededData = initData.data.map((obj, idx) => ({
    ...obj,
    owner: registeredUser._id,
    category: obj.location === "Goa" ? "Beachfront" : categoriesList[idx % categoriesList.length],
    geometry: {
      type: "Point",
      coordinates: cityCoords[obj.location] || [77.209, 28.6139],
    },
    amenities: ["Wifi", "Air Conditioning", "Free Parking", "Kitchen", "Workspace"],
  }));

  await Listing.insertMany(seededData);
  console.log("Database initialized successfully with Goa sample listings!");
  mongoose.connection.close();
};