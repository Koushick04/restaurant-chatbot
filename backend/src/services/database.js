import { supabase, isDbConnected } from '../config/supabase.js';

/** In-memory fallback when Supabase is not configured */
const memoryStore = {
  business: {
    name: 'Annalakshmi Fine Dining',
    tagline: 'Authentic South Indian Cuisine Since 1998',
    description: 'Family-owned restaurant serving authentic South Indian cuisine in Coimbatore since 1998. From hand-spread dosas to Chettinad specialities and frothy filter coffee.',
    phone: '+91 98765 43210',
    email: 'reservations@annalakshmi.in',
    whatsapp: '+919876543210',
    address: '45, Race Course Road, Coimbatore, Tamil Nadu 641029',
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=45+Race+Course+Road+Coimbatore+Tamil+Nadu+641029',
    hours: {
      monday: '7:00 AM - 11:00 PM',
      tuesday: '7:00 AM - 11:00 PM',
      wednesday: '7:00 AM - 11:00 PM',
      thursday: '7:00 AM - 11:00 PM',
      friday: '7:00 AM - 11:00 PM',
      saturday: '6:30 AM - 11:30 PM',
      sunday: '6:30 AM - 11:30 PM',
    },
  },
  chatbot: {
    personality: 'You are Priya, a warm and knowledgeable AI dining assistant for Annalakshmi Fine Dining, an authentic South Indian restaurant in Coimbatore since 1998. Be friendly, helpful, and concise. You may use a touch of Tamil warmth (e.g. "Semma!") but keep responses clear. Use the knowledge base to answer questions accurately.',
    welcome_message: 'Welcome to Annalakshmi! 🙏 I\'m Priya, your AI dining assistant. I can help you with our South Indian menu, make a reservation, or answer any questions. Semma food waiting for you! 😊',
    suggested_prompts: [
      'What\'s on the menu today?',
      'I want to make a reservation',
      'Do you have vegetarian meals?',
      'What is your Chettinad special?',
      'What time do you open?',
    ],
    quick_actions: [
      { label: 'Menu', action: 'menu' },
      { label: 'Reservations', action: 'reservation' },
      { label: 'Location', action: 'location' },
      { label: 'Contact', action: 'contact' },
    ],
    theme: {
      primaryColor: '#C0392B',
      accentColor: '#E67E22',
      fontFamily: 'Inter',
      borderRadius: '1rem',
      glassOpacity: 0.8,
    },
  },
  faqs: [
    { id: '1', question: 'What are your hours?', answer: 'We are open Monday to Friday 7 AM - 11 PM, and Saturday to Sunday 6:30 AM - 11:30 PM.', category: 'hours', is_active: true },
    { id: '2', question: 'Do you have vegetarian options?', answer: 'Absolutely! We have extensive vegetarian options including Full South Indian Meals (₹220), Masala Dosa (₹100), Pongal (₹90), Idli, Sambar Rice, Curd Rice and many more.', category: 'menu', is_active: true },
    { id: '3', question: 'What is your Chettinad special?', answer: 'Our Chettinad specialities include Chettinad Pepper Chicken (₹290, very hot), Chicken Chettinad Curry (₹320, bestseller), and Chettinad Kuzhambu (₹180).', category: 'menu', is_active: true },
    { id: '4', question: 'Is there a reservation fee?', answer: 'Yes, there is a ₹100 pre-booking fee to secure your table. This ₹100 reservation fee is fully adjustable against your final bill.', category: 'reservations', is_active: true },
    { id: '5', question: 'Where are you located?', answer: 'We are at 45, Race Course Road, Coimbatore, Tamil Nadu 641029. You can find us on Google Maps.', category: 'location', is_active: true },
  ],
  documents: [
    {
      id: '1',
      filename: 'menu.txt',
      original_name: 'Menu',
      file_type: 'text',
      content: `MENU - Annalakshmi Fine Dining (All prices in ₹)

BREAKFAST (7AM-11AM)
- Plain Dosa - ₹80
- Masala Dosa - ₹100 (Popular)
- Ghee Roast Dosa - ₹130
- Idli (3 pcs) - ₹70
- Mini Idli Sambar (12 pcs) - ₹120
- Medu Vada (2 pcs) - ₹80
- Pongal - ₹90 (Popular)
- Onion Uttapam - ₹110

VEG STARTERS
- Gobi 65 - ₹180 (Hot)
- Paneer 65 - ₹220 (Hot)
- Banana Chips - ₹120
- Masala Papad - ₹80

NON-VEG STARTERS
- Chicken 65 - ₹260 (Hot, Popular)
- Chettinad Pepper Chicken - ₹290 (Very Hot, Popular)
- Fish Fry (Vanjaram) - ₹340 (Popular)
- Prawn Masala Fry - ₹380
- Tandoori Chicken Half - ₹380

RICE & MEALS
- Full South Indian Meals (Veg) - ₹220 (Bestseller)
- Mini Meals (Veg) - ₹160
- Sambar Rice - ₹130
- Curd Rice - ₹100
- Lemon Rice - ₹120
- Tamarind Rice - ₹130
- Chicken Meals - ₹280
- Mutton Meals - ₹320
- Fish Meals - ₹300

BIRYANI
- Vegetable Biryani - ₹200
- Paneer Biryani - ₹250
- Chicken Biryani (Dindigul Style) - ₹310 (Bestseller)
- Mutton Biryani - ₹380
- Prawn Biryani - ₹420
- Egg Biryani - ₹240

CURRIES
- Dal Tadka - ₹160
- Sambar - ₹140
- Chettinad Kuzhambu - ₹180
- Paneer Butter Masala - ₹260
- Chicken Chettinad Curry - ₹320 (Bestseller)
- Chicken Salna - ₹280
- Fish Curry (Meen Kuzhambu) - ₹300

BREADS
- Parotta (2 pcs) - ₹60
- Chapati (2 pcs) - ₹50
- Butter Naan - ₹80
- Garlic Naan - ₹90
- Appam (2 pcs) - ₹80
- Idiappam (3 pcs) - ₹80

DESSERTS
- Payasam - ₹120
- Mysore Pak - ₹100
- Kesari - ₹100
- Ice Cream (2 scoops) - ₹150
- Filter Coffee - ₹60 (Popular)

BEVERAGES
- Tender Coconut Water - ₹80
- Sweet Lassi - ₹100
- Salted Buttermilk - ₹60
- Mango Lassi - ₹130
- Filter Coffee - ₹60
- Masala Chai - ₹50
- Fresh Lime Soda - ₹70

RESERVATIONS: ₹100 pre-booking fee, fully adjustable against the final bill.
HOURS: Mon-Fri 7AM-11PM, Sat-Sun 6:30AM-11:30PM.
LOCATION: 45, Race Course Road, Coimbatore, Tamil Nadu 641029.
PHONE: +91 98765 43210 | WhatsApp: +919876543210 | Email: reservations@annalakshmi.in`,
      category: 'menu',
      is_active: true,
    },
  ],
  conversations: [],
  messages: [],
  leads: [],
  analytics: [],
  reservations: [],
};

export { memoryStore };

/** Get business settings */
export async function getBusinessSettings() {
  if (!isDbConnected()) return memoryStore.business;
  const { data } = await supabase.from('business_settings').select('*').limit(1).single();
  return data || memoryStore.business;
}

/** Update business settings */
export async function updateBusinessSettings(updates) {
  if (!isDbConnected()) {
    Object.assign(memoryStore.business, updates);
    return memoryStore.business;
  }
  const { data: existing } = await supabase.from('business_settings').select('id').limit(1).single();
  if (existing) {
    const { data } = await supabase.from('business_settings').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', existing.id).select().single();
    return data;
  }
  const { data } = await supabase.from('business_settings').insert(updates).select().single();
  return data;
}

/** Get chatbot config */
export async function getChatbotConfig() {
  if (!isDbConnected()) return memoryStore.chatbot;
  const { data } = await supabase.from('chatbot_config').select('*').limit(1).single();
  return data || memoryStore.chatbot;
}

/** Update chatbot config */
export async function updateChatbotConfig(updates) {
  if (!isDbConnected()) {
    Object.assign(memoryStore.chatbot, updates);
    return memoryStore.chatbot;
  }
  const { data: existing } = await supabase.from('chatbot_config').select('id').limit(1).single();
  if (existing) {
    const { data } = await supabase.from('chatbot_config').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', existing.id).select().single();
    return data;
  }
  const { data } = await supabase.from('chatbot_config').insert(updates).select().single();
  return data;
}

/** Build knowledge base context from FAQs and documents */
export async function buildKnowledgeBase() {
  let faqs = memoryStore.faqs.filter(f => f.is_active);
  let docs = memoryStore.documents.filter(d => d.is_active);

  if (isDbConnected()) {
    const { data: faqData } = await supabase.from('faqs').select('*').eq('is_active', true).order('sort_order');
    const { data: docData } = await supabase.from('documents').select('*').eq('is_active', true);
    if (faqData) faqs = faqData;
    if (docData) docs = docData;
  }

  const business = await getBusinessSettings();

  let context = `RESTAURANT INFORMATION:\n`;
  context += `Name: ${business.name}\n`;
  context += `Tagline: ${business.tagline}\n`;
  context += `Description: ${business.description}\n`;
  context += `Phone: ${business.phone}\n`;
  context += `Email: ${business.email}\n`;
  context += `Address: ${business.address}\n`;
  context += `Hours: ${JSON.stringify(business.hours)}\n\n`;

  if (faqs.length) {
    context += `FREQUENTLY ASKED QUESTIONS:\n`;
    faqs.forEach(f => {
      context += `Q: ${f.question}\nA: ${f.answer}\n\n`;
    });
  }

  if (docs.length) {
    context += `DOCUMENTS & KNOWLEDGE BASE:\n`;
    docs.forEach(d => {
      context += `--- ${d.original_name || d.filename} ---\n${d.content}\n\n`;
    });
  }

  return context;
}

/** Get or create conversation */
export async function getOrCreateConversation(sessionId) {
  if (!isDbConnected()) {
    let conv = memoryStore.conversations.find(c => c.session_id === sessionId);
    if (!conv) {
      conv = { id: crypto.randomUUID(), session_id: sessionId, message_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      memoryStore.conversations.push(conv);
    }
    return conv;
  }

  let { data } = await supabase.from('conversations').select('*').eq('session_id', sessionId).single();
  if (!data) {
    ({ data } = await supabase.from('conversations').insert({ session_id: sessionId }).select().single());
  }
  return data;
}

/** Save message */
export async function saveMessage(conversationId, role, content) {
  const msg = { conversation_id: conversationId, role, content, created_at: new Date().toISOString() };

  if (!isDbConnected()) {
    msg.id = crypto.randomUUID();
    memoryStore.messages.push(msg);
    const conv = memoryStore.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.message_count = (conv.message_count || 0) + 1;
      conv.updated_at = new Date().toISOString();
    }
    return msg;
  }

  const { data, error } = await supabase.from('messages').insert(msg).select().single();
  if (error) throw error;

  const { data: conversation } = await supabase
    .from('conversations')
    .select('message_count')
    .eq('id', conversationId)
    .single();

  await supabase.from('conversations').update({
    message_count: (conversation?.message_count || 0) + 1,
    updated_at: new Date().toISOString(),
  }).eq('id', conversationId);

  return data;
}

/** Get conversation messages */
export async function getConversationMessages(conversationId) {
  if (!isDbConnected()) {
    return memoryStore.messages.filter(m => m.conversation_id === conversationId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }
  const { data } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at');
  return data || [];
}

/** Get all conversations (admin) */
export async function getAllConversations(limit = 50, offset = 0) {
  if (!isDbConnected()) {
    return memoryStore.conversations.slice(offset, offset + limit);
  }
  const { data } = await supabase.from('conversations').select('*').order('updated_at', { ascending: false }).range(offset, offset + limit - 1);
  return data || [];
}

/** Track analytics event */
export async function trackEvent(eventType, sessionId, metadata = {}) {
  const event = { event_type: eventType, session_id: sessionId, metadata, created_at: new Date().toISOString() };
  if (!isDbConnected()) {
    event.id = crypto.randomUUID();
    memoryStore.analytics.push(event);
    return event;
  }
  const { data } = await supabase.from('analytics_events').insert(event).select().single();
  return data;
}

/** Get analytics summary */
export async function getAnalyticsSummary() {
  if (!isDbConnected()) {
    const events = memoryStore.analytics;
    const conversations = memoryStore.conversations;
    const leads = memoryStore.leads;
    return {
      totalConversations: conversations.length,
      totalMessages: memoryStore.messages.length,
      totalLeads: leads.length,
      recentEvents: events.slice(-10).reverse(),
      eventsByType: events.reduce((acc, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1;
        return acc;
      }, {}),
    };
  }

  const [convRes, msgRes, leadRes, eventRes] = await Promise.all([
    supabase.from('conversations').select('id', { count: 'exact', head: true }),
    supabase.from('messages').select('id', { count: 'exact', head: true }),
    supabase.from('leads').select('id', { count: 'exact', head: true }),
    supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(20),
  ]);

  const events = eventRes.data || [];
  return {
    totalConversations: convRes.count || 0,
    totalMessages: msgRes.count || 0,
    totalLeads: leadRes.count || 0,
    recentEvents: events,
    eventsByType: events.reduce((acc, e) => {
      acc[e.event_type] = (acc[e.event_type] || 0) + 1;
      return acc;
    }, {}),
  };
}

