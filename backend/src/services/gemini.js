import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildKnowledgeBase, getChatbotConfig } from './database.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { getRestaurantInfo } = require('./restaurantKnowledgeBase.js');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

if (!genAI) {
  console.warn('⚠️  GEMINI_API_KEY not set — using rule-based fallback responses.');
} else {
  console.log(`✅ Gemini AI enabled (model: ${GEMINI_MODEL})`);
}

/**
 * Build the system prompt with knowledge base context.
 * Instructs the AI to only answer from provided knowledge.
 */
async function buildSystemPrompt() {
  const config = await getChatbotConfig();
  const knowledgeBase = await buildKnowledgeBase();

  return `${config.personality}

IMPORTANT RULES:
1. ONLY answer questions using the information provided in the KNOWLEDGE BASE below.
2. If the answer is not in the knowledge base, politely say you don't have that information and suggest the user contact the restaurant directly via phone, email, or WhatsApp.
3. Never make up menu items, prices, hours, or policies not in the knowledge base.
4. Be concise but friendly. Use markdown formatting when helpful (lists, bold for emphasis).
5. For reservation requests, guide users to use the reservation form in the chat widget.
6. Keep responses under 300 words unless listing menu items.

KNOWLEDGE BASE:
${knowledgeBase}`;
}

/**
 * Generate a streaming AI response using Gemini.
 * Falls back to a rule-based response if Gemini is not configured.
 */
export async function* streamChatResponse(userMessage, conversationHistory = []) {
  // First, try to answer from the restaurant knowledge base
  const restaurantInfo = getRestaurantInfo(userMessage);
  if (typeof restaurantInfo !== "string") {
    yield JSON.stringify(restaurantInfo, null, 2);
    return;
  }

  const systemPrompt = await buildSystemPrompt();

  if (!genAI) {
    yield* fallbackResponse(userMessage);
    return;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: systemPrompt,
    });

    const history = conversationHistory.slice(-10).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history });

    const result = await chat.sendMessageStream(userMessage);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  } catch (error) {
    console.error('Gemini API error:', error.message);
    yield* fallbackResponse(userMessage);
  }
}

export async function generateContent(prompt) {
  const restaurantInfo = getRestaurantInfo(prompt);

  if (typeof restaurantInfo === "string") {
    // If it's a general query, use Gemini to generate a response
    const systemPrompt = await buildSystemPrompt();
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: systemPrompt,
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } else {
    // If it's a specific knowledge base query, return the info directly
    return JSON.stringify(restaurantInfo, null, 2);
  }
}

/**
 * Rule-based fallback when Gemini API is unavailable.
 * Searches FAQs and knowledge base for keyword matches.
 */
async function* fallbackResponse(userMessage) {
  const knowledgeBase = await buildKnowledgeBase();
  const lower = userMessage.toLowerCase();

  if (lower.includes('hour') || lower.includes('open') || lower.includes('close') || lower.includes('time')) {
    yield 'We are open Monday to Friday **7 AM - 11 PM**, and Saturday to Sunday **6:30 AM - 11:30 PM**. 🕐 Come enjoy semma South Indian food any day!';
    return;
  }

  if (lower.includes('menu') || lower.includes('food') || lower.includes('eat') || lower.includes('dos') || lower.includes('biryani')) {
    yield 'We serve authentic South Indian cuisine! Highlights include **Masala Dosa (₹100)**, **Chicken Biryani Dindigul Style (₹310)**, **Full South Indian Meals (₹220)**, **Chicken Chettinad Curry (₹320)**, and **Filter Coffee (₹60)**. Would you like details on a specific category — Breakfast, Starters, Biryani, Curries, or Desserts? 🍛';
    return;
  }

  if (lower.includes('chettinad')) {
    yield 'Our Chettinad specialities are a must-try! 🌶️ **Chettinad Pepper Chicken (₹290, very hot)**, **Chicken Chettinad Curry (₹320, bestseller)**, and **Chettinad Kuzhambu (₹180)**. Bold, spicy, and authentic Tamil Nadu flavours!';
    return;
  }

  if (lower.includes('reserv') || lower.includes('book') || lower.includes('table')) {
    yield 'You can make a reservation using the reservation form in this chat, or call us at **+91 98765 43210**. Please note there is a **₹100 pre-booking fee**, fully adjustable against your final bill. We\'d love to host you! 📅';
    return;
  }

  if (lower.includes('location') || lower.includes('address') || lower.includes('where')) {
    yield 'We\'re located at **45, Race Course Road, Coimbatore, Tamil Nadu 641029**. Click the Map button below for directions! 📍';
    return;
  }

  if (lower.includes('vegetarian') || lower.includes('vegan') || lower.includes('veg') || lower.includes('diet')) {
    yield 'Absolutely! We have extensive vegetarian options including **Full South Indian Meals (₹220)**, **Masala Dosa (₹100)**, **Pongal (₹90)**, Idli, Sambar Rice, Curd Rice and many more. 🥗';
    return;
  }

  if (lower.includes('fee') || lower.includes('charge') || lower.includes('cost') || lower.includes('price')) {
    yield 'There is a **₹100 pre-booking fee** for reservations, which is fully adjustable against your final bill. Menu prices range from ₹50 (Masala Chai) to ₹420 (Prawn Biryani). All prices are in ₹. 💰';
    return;
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('vanakkam')) {
    yield 'Vanakkam! Welcome to Annalakshmi Fine Dining! 🙏 I\'m Priya. How can I help you today? Ask me about our South Indian menu, hours, reservations, or location.';
    return;
  }

  yield 'I don\'t have specific information about that in my knowledge base. Please contact us directly:\n\n📞 **+91 98765 43210**\n📧 **reservations@annalakshmi.in**\n💬 WhatsApp: **+919876543210**\n\nOur team will be happy to help!';
}
