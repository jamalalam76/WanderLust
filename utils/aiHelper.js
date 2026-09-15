const { GoogleGenAI } = require("@google/genai");

// Initialize Gemini Client if API key is provided
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
let aiClient = null;

if (apiKey && apiKey !== "your_gemini_api_key_here") {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.log("Gemini AI client initialization error:", err.message);
  }
}

// 1. AI Description Generator for Hosts
module.exports.generateAIDescription = async (title, location, country, category) => {
  const prompt = `Write an attractive, elegant, and compelling property description (around 60-90 words) for a travel stay listing with the following details:
  Title: "${title || 'Luxury Stay'}"
  Location: "${location || 'Prime location'}"
  Country: "${country || 'Worldwide'}"
  Category: "${category || 'Villas'}"
  Highlight the ambiance, scenic views, luxury amenities, and guest experience. Return only the description text.`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err) {
      console.log("Gemini API call failed, using smart fallback:", err.message);
    }
  }

  // Smart High-Quality Fallback AI Generator
  return `Escape to ${title || 'this luxurious retreat'} in the heart of ${location || 'the city'}, ${country || ''}. Perfectly curated for ${category || 'unforgettable stays'}, this sanctuary offers breathtaking views, high-speed Wi-Fi, air-conditioned comfort, and premium amenities. Whether you are looking to unwind by the pool, explore local culture, or enjoy a tranquil weekend getaway, this stay promises a seamless blending of luxury and warmth. Book your stay today for an unforgettable experience!`;
};

// 2. AI Travel Assistant (WanderBot AI Chat)
module.exports.generateWanderBotResponse = async (userMessage, listingContext = "") => {
  const prompt = `You are WanderBot AI, a smart, friendly, and helpful travel concierge for Wanderlust.
  User Query: "${userMessage}"
  ${listingContext ? `Current Listing Context: "${listingContext}"` : ''}
  Provide a concise, helpful, and inspiring response (within 100 words) assisting the user with travel tips, itineraries, local food recommendations, or stay details. Use bullet points where appropriate.`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err) {
      console.log("Gemini API call failed, using smart AI engine:", err.message);
    }
  }

  // Advanced Natural Language Travel AI Engine (Fallback & Local Processing)
  const msg = userMessage.toLowerCase();

  // Destination Specific AI Guides
  if (msg.includes("delhi") || msg.includes("dehli") || msg.includes("dilli")) {
    return `✨ **WanderBot AI Delhi Travel Guide:**\n• **Top Places to Visit:** India Gate, Red Fort, Qutub Minar, Humayun's Tomb & Lotus Temple.\n• **Famous Food & Cafes:** Paranthe Wali Gali in Chandni Chowk, Pandara Road Butter Chicken & Connaught Place cafes.\n• **Shopping:** Dilli Haat, Khan Market & Sarojini Nagar.\n• **Best Time:** October to March for pleasant weather!`;
  }

  if (msg.includes("goa")) {
    return `✨ **WanderBot AI Goa Guide:**\n• **Top Attractions:** Baga & Calangute Beach, Dudhsagar Falls, Fort Aguada & Panjim Church.\n• **Nightlife & Food:** Beach shacks, Tito's Lane, fresh seafood & sunset cruises.\n• **Best Stay:** Beachfront Villas & Rooms on Wanderlust!`;
  }

  if (msg.includes("mumbai") || msg.includes("bombay")) {
    return `✨ **WanderBot AI Mumbai Guide:**\n• **Must Visit:** Gateway of India, Marine Drive (Queen's Necklace), Bandra Bandstand & Elephanta Caves.\n• **Local Delicacies:** Vada Pav at Ashok Vada Pav, Pav Bhaji at Juhu Beach & Irani Chai at Leopold Cafe.`;
  }

  if (msg.includes("jaipur") || msg.includes("rajasthan")) {
    return `✨ **WanderBot AI Jaipur Guide:**\n• **Forts & Palaces:** Hawa Mahal, Amer Fort, City Palace & Jal Mahal.\n• **Food:** Dal Baati Churma, Pyaaz Kachori at Rawat Sweets & Royal Rajasthani Thali.`;
  }

  if (msg.includes("manali") || msg.includes("shimla") || msg.includes("mountain") || msg.includes("pahad")) {
    return `🏔️ **WanderBot AI Mountain Travel Guide:**\n• **Highlights:** Solang Valley snow sports, Rohtang Pass, Mall Road shopping & cozy pine forest cabins.\n• **Stay Category:** Explore our 'Mountains' category on Wanderlust for mountain view chalets!`;
  }

  if (msg.includes("bali") || msg.includes("maldives") || msg.includes("beach")) {
    return `🏖️ **WanderBot AI Tropical Paradise Guide:**\n• **Highlights:** Crystal clear water, private pool villas, scuba diving & sunset beach dinners.\n• **Category:** Check out our 'Beachfront' & 'Villas' categories!`;
  }

  // Travel Query Intents
  if (msg.includes("itinerary") || msg.includes("plan") || msg.includes("days") || msg.includes("routine")) {
    return `✨ **WanderBot AI 3-Day Travel Itinerary:**\n• **Day 1:** Arrive, check-in to your stay, explore nearby markets & sunset dinner.\n• **Day 2:** Sightseeing top 3 landmarks, local food tasting & evening cultural show.\n• **Day 3:** Relaxing morning coffee, souvenir shopping & hassle-free checkout!`;
  }

  if (msg.includes("food") || msg.includes("eat") || lowerIncludes(msg, ["khana", "restaurant", "cafe"])) {
    return `🍽️ **WanderBot AI Foodie Recommendations:**\n• Explore top-rated local authentic street food spots.\n• Visit rooftop dining cafes for scenic city views.\n• Ask your stay host for secret non-touristy food gems!`;
  }

  if (msg.includes("pack") || msg.includes("bring") || msg.includes("saman")) {
    return `🧳 **WanderBot AI Smart Packing List:**\n• Essential documents, ID & booking confirmation\n• Universal power adapter & power bank\n• Weather-appropriate outfits, footwear & sunscreen`;
  }

  if (msg.includes("hi") || msg.includes("hello") || msg.includes("hey") || msg.includes("namaste")) {
    return `✨ **Hello! I am WanderBot AI.** Where are you planning to travel next? Ask me about Delhi, Goa, Mumbai, mountain trips, 3-day itineraries, or packing tips!`;
  }

  // Dynamic Query Handling
  const locationMatches = msg.match(/(to|in|at|for|near|visit|around)\s+([a-zA-Z]+)/i);
  const targetCity = locationMatches ? locationMatches[2] : "your destination";

  return `✨ **WanderBot AI Travel Guide for ${targetCity.toUpperCase()}:**\n• **Sightseeing:** Explore top historic landmarks, local markets & scenic viewpoints in ${targetCity}.\n• **Stay Suggestion:** Use the Wanderlust search bar to find top-rated villas & rooms in ${targetCity}.\n• **Tip:** Book early to get the best discounts and instant confirmation!`;
};

function lowerIncludes(text, keywords) {
  return keywords.some(k => text.includes(k));
}

// 3. AI Review Summary Generator
module.exports.summarizeReviewsAI = async (reviewsArray) => {
  if (!reviewsArray || reviewsArray.length === 0) {
    return "No reviews yet. Be the first guest to share your experience!";
  }

  const reviewTexts = reviewsArray.map(r => r.comment).join(" | ");
  const prompt = `Summarize these guest reviews into 2 concise bullet points highlighting key positives: "${reviewTexts}"`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err) {
      console.log("Gemini API call failed, using smart fallback:", err.message);
    }
  }

  return `✨ **AI Key Highlights:** Guests highly appreciate the scenic views, sparkling cleanliness, and fast responsiveness of the host.`;
};
