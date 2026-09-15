const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || "demo_cloud",
  api_key: process.env.CLOUD_API_KEY || "demo_api_key",
  api_secret: process.env.CLOUD_API_SECRET || "demo_api_secret",
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "wanderlust_DEV",
    allowedFormats: ["png", "jpg", "jpeg"],
  },
});

module.exports = {
  cloudinary,
  storage,
};
