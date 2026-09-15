const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

const plugin = typeof passportLocalMongoose === "function" ? passportLocalMongoose : passportLocalMongoose.default;
userSchema.plugin(plugin);

module.exports = mongoose.model("User", userSchema);
