import { Router } from 'express';
import { authenticateAdmin, generateToken, authMiddleware } from '../middleware/auth.js';
import {
  getBusinessSettings,
  updateBusinessSettings,
  getChatbotConfig,
  updateChatbotConfig,
  getAllConversations,
  getConversationMessages,
  getAnalyticsSummary,
} from '../services/database.js';
import { asyncHandler, badRequest, cleanString, parseOffset, parsePositiveInt, pickAllowed, requireUuid } from '../middleware/validate.js';

const router = Router();

const businessKeys = ['name', 'tagline', 'description', 'phone', 'email', 'whatsapp', 'address', 'google_maps_url', 'hours', 'logo_url'];
const chatbotKeys = ['personality', 'welcome_message', 'suggested_prompts', 'quick_actions', 'theme'];

function normalizeBusiness(body) {
  const payload = pickAllowed(body, businessKeys);
  ['name', 'tagline', 'description', 'phone', 'email', 'whatsapp', 'address', 'google_maps_url', 'logo_url'].forEach(key => {
    if (payload[key] !== undefined) payload[key] = cleanString(payload[key], key === 'description' ? 3000 : 500);
  });
  if (payload.name === null) throw badRequest('Business name is required');
  if (payload.hours !== undefined && (typeof payload.hours !== 'object' || Array.isArray(payload.hours))) {
    throw badRequest('Hours must be an object');
  }
  if (!Object.keys(payload).length) throw badRequest('At least one business field is required');
  return payload;
}

function normalizeChatbot(body) {
  const payload = pickAllowed(body, chatbotKeys);
  if (payload.personality !== undefined) payload.personality = cleanString(payload.personality, 6000);
  if (payload.welcome_message !== undefined) payload.welcome_message = cleanString(payload.welcome_message, 1000);
  if (payload.suggested_prompts !== undefined) {
    if (!Array.isArray(payload.suggested_prompts)) throw badRequest('Suggested prompts must be an array');
    payload.suggested_prompts = payload.suggested_prompts.map(item => cleanString(item, 160)).filter(Boolean).slice(0, 8);
  }
  if (payload.quick_actions !== undefined) {
    if (!Array.isArray(payload.quick_actions)) throw badRequest('Quick actions must be an array');
    payload.quick_actions = payload.quick_actions
      .map(item => ({ label: cleanString(item?.label, 80), action: cleanString(item?.action, 80) }))
      .filter(item => item.label && item.action)
      .slice(0, 8);
  }
  if (payload.theme !== undefined && (typeof payload.theme !== 'object' || Array.isArray(payload.theme))) {
    throw badRequest('Theme must be an object');
  }
  if (!Object.keys(payload).length) throw badRequest('At least one chatbot field is required');
  return payload;
}

router.post('/login', asyncHandler(async (req, res) => {
  const email = cleanString(req.body.email, 254);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password) throw badRequest('Email and password are required');

  const user = await authenticateAdmin(email, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user: { email: user.email, role: user.role } });
}));

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

router.get('/analytics', authMiddleware, asyncHandler(async (_req, res) => {
  res.json(await getAnalyticsSummary());
}));

router.get('/conversations', authMiddleware, asyncHandler(async (req, res) => {
  const limit = parsePositiveInt(req.query.limit, 50, 200);
  const offset = parseOffset(req.query.offset);
  res.json(await getAllConversations(limit, offset));
}));

router.get('/conversations/:id/messages', authMiddleware, asyncHandler(async (req, res) => {
  requireUuid(req.params.id, 'Conversation ID');
  res.json(await getConversationMessages(req.params.id));
}));

router.get('/business', authMiddleware, asyncHandler(async (_req, res) => {
  res.json(await getBusinessSettings());
}));

router.put('/business', authMiddleware, asyncHandler(async (req, res) => {
  res.json(await updateBusinessSettings(normalizeBusiness(req.body)));
}));

router.get('/chatbot', authMiddleware, asyncHandler(async (_req, res) => {
  res.json(await getChatbotConfig());
}));

router.put('/chatbot', authMiddleware, asyncHandler(async (req, res) => {
  res.json(await updateChatbotConfig(normalizeChatbot(req.body)));
}));

export default router;
