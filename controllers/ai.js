const { generateAIDescription, generateWanderBotResponse, summarizeReviewsAI } = require("../utils/aiHelper");

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
