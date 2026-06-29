-- AI Restaurant Assistant - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Business settings (single row per restaurant)
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'La Bella Cucina',
  tagline TEXT DEFAULT 'Authentic Italian cuisine since 1985',
  description TEXT DEFAULT 'Family-owned restaurant serving handmade pasta and wood-fired pizzas.',
  phone TEXT DEFAULT '+1 (555) 123-4567',
  email TEXT DEFAULT 'info@labellacucina.com',
  whatsapp TEXT DEFAULT '+15551234567',
  address TEXT DEFAULT '123 Main Street, New York, NY 10001',
  google_maps_url TEXT DEFAULT 'https://maps.google.com/?q=123+Main+Street+New+York',
  hours JSONB DEFAULT '{"monday":"11:00 AM - 10:00 PM","tuesday":"11:00 AM - 10:00 PM","wednesday":"11:00 AM - 10:00 PM","thursday":"11:00 AM - 10:00 PM","friday":"11:00 AM - 11:00 PM","saturday":"10:00 AM - 11:00 PM","sunday":"10:00 AM - 9:00 PM"}'::jsonb,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chatbot personality & theme
CREATE TABLE IF NOT EXISTS chatbot_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personality TEXT DEFAULT 'You are a friendly, knowledgeable restaurant assistant for La Bella Cucina. Be warm, helpful, and concise. Use the knowledge base to answer questions accurately.',
  welcome_message TEXT DEFAULT 'Welcome to La Bella Cucina! I''m your AI assistant. Ask me about our menu, hours, reservations, or anything else!',
  suggested_prompts JSONB DEFAULT '["What are your hours?","Show me the menu","Do you have vegetarian options?","How do I make a reservation?","Where are you located?"]'::jsonb,
  quick_actions JSONB DEFAULT '[{"label":"Menu","action":"menu"},{"label":"Reservations","action":"reservation"},{"label":"Location","action":"location"},{"label":"Contact","action":"contact"}]'::jsonb,
  theme JSONB DEFAULT '{"primaryColor":"#e11d48","accentColor":"#f97316","fontFamily":"Inter","borderRadius":"1rem","glassOpacity":0.8}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQs
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uploaded documents / knowledge base
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INT,
  content TEXT,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  visitor_name TEXT,
  visitor_email TEXT,
  message_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  type TEXT DEFAULT 'general' CHECK (type IN ('general', 'reservation', 'newsletter', 'catering')),
  message TEXT,
  party_size INT,
  preferred_date DATE,
  preferred_time TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'confirmed', 'closed')),
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  session_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);

-- Seed default business settings
INSERT INTO business_settings (name, tagline) VALUES ('La Bella Cucina', 'Authentic Italian cuisine since 1985')
ON CONFLICT DO NOTHING;

INSERT INTO chatbot_config (personality, welcome_message) VALUES (
  'You are a friendly, knowledgeable restaurant assistant for La Bella Cucina. Be warm, helpful, and concise.',
  'Welcome to La Bella Cucina! I''m your AI assistant. Ask me about our menu, hours, reservations, or anything else!'
) ON CONFLICT DO NOTHING;

-- Seed sample FAQs
INSERT INTO faqs (question, answer, category, sort_order) VALUES
  ('What are your hours?', 'We are open Monday-Thursday 11 AM - 10 PM, Friday 11 AM - 11 PM, Saturday 10 AM - 11 PM, and Sunday 10 AM - 9 PM.', 'hours', 1),
  ('Do you offer delivery?', 'Yes! We offer delivery through DoorDash, Uber Eats, and our own delivery service within a 5-mile radius.', 'delivery', 2),
  ('Do you have vegetarian options?', 'Absolutely! We have a dedicated vegetarian section with 12 dishes including our famous Eggplant Parmigiana and Mushroom Risotto.', 'menu', 3),
  ('Can I make a reservation?', 'Yes, you can make a reservation through our chat, by calling us, or via our website reservation form.', 'reservations', 4),
  ('Do you accommodate dietary restrictions?', 'Yes, we accommodate gluten-free, vegan, nut-free, and other dietary needs. Please inform your server or mention it when booking.', 'dietary', 5)
ON CONFLICT DO NOTHING;

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TEXT NOT NULL,
  guests INTEGER NOT NULL CHECK (guests >= 1 AND guests <= 50),
  special_request TEXT,
  booking_fee DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled')),
  reservation_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (reservation_status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_reservation_id ON reservations(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservations_email ON reservations(email);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(reservation_status);

-- Seed sample menu document content
INSERT INTO documents (filename, original_name, file_type, content, category) VALUES
  ('menu.txt', 'Menu', 'text', E'MENU - La Bella Cucina\n\nAPPETIZERS\n- Bruschetta Classica - $12\n- Calamari Fritti - $16\n- Caprese Salad - $14\n\nPASTA\n- Spaghetti Carbonara - $22\n- Fettuccine Alfredo - $20\n- Penne Arrabbiata - $18\n- Lobster Ravioli - $32\n\nPIZZA (Wood-fired)\n- Margherita - $18\n- Quattro Formaggi - $22\n- Diavola - $24\n\nMAIN COURSES\n- Osso Buco - $38\n- Grilled Branzino - $34\n- Chicken Parmigiana - $26\n\nDESSERTS\n- Tiramisu - $12\n- Panna Cotta - $10\n- Gelato (3 scoops) - $9\n\nWINE LIST available upon request.', 'menu')
ON CONFLICT DO NOTHING;

