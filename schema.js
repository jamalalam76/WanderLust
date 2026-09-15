const Joi = require("joi");

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required().min(2),
    description: Joi.string().required().min(5),
    location: Joi.string().required().min(2),
    country: Joi.string().required().min(2),
    price: Joi.number().required().min(0),
    image: Joi.alternatives().try(
      Joi.string().allow("", null),
      Joi.object({
        url: Joi.string().allow("", null),
        filename: Joi.string().allow("", null),
      })
    ).optional(),
    category: Joi.string().optional(),
  }).required(),
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required().min(2),
  }).required(),
});
