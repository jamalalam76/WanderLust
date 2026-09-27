const { generateAIDescription, generateWanderBotResponse, summarizeReviewsAI, predictAIImage } = require("../utils/aiHelper");

module.exports.generateDescription = async (req, res) => {
  try {
    const { title, location, country, category } = req.body;
    const description = await generateAIDescription(title, location, country, category);
    res.json({ success: true, description });
  } catch (error) {
    console.error("AI Description Error:", error);
    res.status(500).json({ success: false, message: "Could not generate AI description" });
  }
};

module.exports.chatWithWanderBot = async (req, res) => {
  try {
    const { message, listingContext } = req.body;
    const reply = await generateWanderBotResponse(message, listingContext);
    res.json({ success: true, reply });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ success: false, message: "WanderBot AI encountered an issue" });
  }
};

module.exports.predictImage = async (req, res) => {
  try {
    const { title, location, category } = req.body;
    const imageUrl = predictAIImage(title, location, category);
    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error("AI Image Prediction Error:", error);
    res.status(500).json({ success: false, message: "Could not predict AI image" });
  }
};
