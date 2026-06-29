import { Router } from 'express';
import { authMiddleware, verifyToken } from '../middleware/auth.js';
import { supabase, isDbConnected } from '../config/supabase.js';
import { memoryStore } from '../services/database.js';
import { asyncHandler, badRequest, cleanString, pickAllowed, requireUuid } from '../middleware/validate.js';

const router = Router();
const faqUpdateKeys = ['question', 'answer', 'category', 'sort_order', 'is_active'];

function hasValidAdminToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return false;
  try {
    const decoded = verifyToken(authHeader.split(' ')[1]);
    return decoded?.role === 'admin';
  } catch {
    return false;
  }
}

function normalizeFaqPayload(body, partial = false) {
  const payload = pickAllowed(body, faqUpdateKeys);

  if (!partial || payload.question !== undefined) {
    const question = cleanString(payload.question, 500);
    if (!question) throw badRequest('Question is required');
    payload.question = question;
  }

  if (!partial || payload.answer !== undefined) {
    const answer = cleanString(payload.answer, 4000);
    if (!answer) throw badRequest('Answer is required');
    payload.answer = answer;
  }

  if (payload.category !== undefined) payload.category = cleanString(payload.category, 80) || 'general';
  if (payload.sort_order !== undefined) payload.sort_order = Number.parseInt(payload.sort_order, 10) || 0;
  if (payload.is_active !== undefined) payload.is_active = Boolean(payload.is_active);

  return payload;
}

router.get('/', asyncHandler(async (req, res) => {
  const adminView = hasValidAdminToken(req);

  if (!isDbConnected()) {
    let faqs = [...memoryStore.faqs];
    if (!adminView) faqs = faqs.filter(f => f.is_active);
    return res.json(faqs.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
  }

  let query = supabase.from('faqs').select('*').order('sort_order').order('created_at');
  if (!adminView) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw error;
  res.json(data || []);
}));

router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const faq = { ...normalizeFaqPayload(req.body), is_active: true };

  if (!isDbConnected()) {
    const created = { ...faq, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    memoryStore.faqs.push(created);
    return res.status(201).json(created);
  }

  const { data, error } = await supabase.from('faqs').insert(faq).select().single();
  if (error) throw error;
  res.status(201).json(data);
}));

router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  requireUuid(req.params.id, 'FAQ ID');
  const updates = { ...normalizeFaqPayload(req.body, true), updated_at: new Date().toISOString() };
  if (Object.keys(updates).length === 1) throw badRequest('At least one FAQ field is required');

  if (!isDbConnected()) {
    const faq = memoryStore.faqs.find(f => f.id === req.params.id);
    if (!faq) return res.status(404).json({ error: 'FAQ not found' });
    Object.assign(faq, updates);
    return res.json(faq);
  }

  const { data, error } = await supabase.from('faqs').update(updates).eq('id', req.params.id).select().single();
  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'FAQ not found' });
  res.json(data);
}));

router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  requireUuid(req.params.id, 'FAQ ID');

  if (!isDbConnected()) {
    const before = memoryStore.faqs.length;
    memoryStore.faqs = memoryStore.faqs.filter(f => f.id !== req.params.id);
    if (memoryStore.faqs.length === before) return res.status(404).json({ error: 'FAQ not found' });
    return res.json({ success: true });
  }

  const { error } = await supabase.from('faqs').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ success: true });
}));

export default router;
