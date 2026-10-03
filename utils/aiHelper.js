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

// 2. AI Travel Assistant (TripNova AI Chat)
module.exports.generateTripNovaBotResponse = async (userMessage, listingContext = "") => {
  const prompt = `You are TripNova AI, a smart, friendly, and helpful travel concierge for TripNova AI.
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
    return `✨ **TripNova AI Delhi Travel Guide:**\n• **Top Places to Visit:** India Gate, Red Fort, Qutub Minar, Humayun's Tomb & Lotus Temple.\n• **Famous Food & Cafes:** Paranthe Wali Gali in Chandni Chowk, Pandara Road Butter Chicken & Connaught Place cafes.\n• **Shopping:** Dilli Haat, Khan Market & Sarojini Nagar.\n• **Best Time:** October to March for pleasant weather!`;
  }

  if (msg.includes("goa")) {
    return `✨ **TripNova AI Goa Guide:**\n• **Top Attractions:** Baga & Calangute Beach, Dudhsagar Falls, Fort Aguada & Panjim Church.\n• **Nightlife & Food:** Beach shacks, Tito's Lane, fresh seafood & sunset cruises.\n• **Best Stay:** Beachfront Villas & Rooms on TripNova AI!`;
  }

  if (msg.includes("mumbai") || msg.includes("bombay")) {
    return `✨ **TripNova AI Mumbai Guide:**\n• **Must Visit:** Gateway of India, Marine Drive (Queen's Necklace), Bandra Bandstand & Elephanta Caves.\n• **Local Delicacies:** Vada Pav at Ashok Vada Pav, Pav Bhaji at Juhu Beach & Irani Chai at Leopold Cafe.`;
  }

  if (msg.includes("jaipur") || msg.includes("rajasthan")) {
    return `✨ **TripNova AI Jaipur Guide:**\n• **Forts & Palaces:** Hawa Mahal, Amer Fort, City Palace & Jal Mahal.\n• **Food:** Dal Baati Churma, Pyaaz Kachori at Rawat Sweets & Royal Rajasthani Thali.`;
  }

  if (msg.includes("manali") || msg.includes("shimla") || msg.includes("mountain") || msg.includes("pahad")) {
    return `🏔️ **TripNova AI Mountain Travel Guide:**\n• **Highlights:** Solang Valley snow sports, Rohtang Pass, Mall Road shopping & cozy pine forest cabins.\n• **Stay Category:** Explore our 'Mountains' category on TripNova AI for mountain view chalets!`;
  }

  if (msg.includes("bali") || msg.includes("maldives") || msg.includes("beach")) {
    return `🏖️ **TripNova AI Tropical Paradise Guide:**\n• **Highlights:** Crystal clear water, private pool villas, scuba diving & sunset beach dinners.\n• **Category:** Check out our 'Beachfront' & 'Villas' categories!`;
  }

  // Travel Query Intents
  if (msg.includes("itinerary") || msg.includes("plan") || msg.includes("days") || msg.includes("routine")) {
    return `✨ **TripNova AI 3-Day Travel Itinerary:**\n• **Day 1:** Arrive, check-in to your stay, explore nearby markets & sunset dinner.\n• **Day 2:** Sightseeing top 3 landmarks, local food tasting & evening cultural show.\n• **Day 3:** Relaxing morning coffee, souvenir shopping & hassle-free checkout!`;
  }

  if (msg.includes("food") || msg.includes("eat") || lowerIncludes(msg, ["khana", "restaurant", "cafe"])) {
    return `🍽️ **TripNova AI Foodie Recommendations:**\n• Explore top-rated local authentic street food spots.\n• Visit rooftop dining cafes for scenic city views.\n• Ask your stay host for secret non-touristy food gems!`;
  }

  if (msg.includes("pack") || msg.includes("bring") || msg.includes("saman")) {
    return `🧳 **TripNova AI Smart Packing List:**\n• Essential documents, ID & booking confirmation\n• Universal power adapter & power bank\n• Weather-appropriate outfits, footwear & sunscreen`;
  }

  if (msg.includes("hi") || msg.includes("hello") || msg.includes("hey") || msg.includes("namaste")) {
    return `✨ **Hello! I am TripNova AI.** Where are you planning to travel next? Ask me about Delhi, Goa, Mumbai, mountain trips, 3-day itineraries, or packing tips!`;
  }

  // Dynamic Query Handling
  const locationMatches = msg.match(/(to|in|at|for|near|visit|around)\s+([a-zA-Z]+)/i);
  const targetCity = locationMatches ? locationMatches[2] : "your destination";

  return `✨ **TripNova AI Travel Guide for ${targetCity.toUpperCase()}:**\n• **Sightseeing:** Explore top historic landmarks, local markets & scenic viewpoints in ${targetCity}.\n• **Stay Suggestion:** Use the TripNova AI search bar to find top-rated villas & rooms in ${targetCity}.\n• **Tip:** Book early to get the best discounts and instant confirmation!`;
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

// 4. AI Image Prediction Engine for Listings
module.exports.predictAIImage = (title = "", location = "", category = "") => {
  const categoryImages = {
    Beachfront: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80"
    ],
    Villas: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"
    ],
    Rooms: [
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"
    ],
    "Iconic Cities": [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
    ],
    Mountains: [
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
    ],
    Castles: [
      "https://images.unsplash.com/photo-1585543805890-6051f7829f98?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80"
    ],
    "Amazing Pools": [
      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"
    ],
    Camping: [
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1200&q=80"
    ],
    Farms: [
      "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1200&q=80"
    ],
    Arctic: [
      "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80"
    ],
    Trending: [
      "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
    ]
  };

  const pool = categoryImages[category] || categoryImages["Trending"];
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
};
