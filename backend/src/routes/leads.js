import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { supabase, isDbConnected } from '../config/supabase.js';
import { memoryStore, trackEvent } from '../services/database.js';
import { asyncHandler, badRequest, cleanString, isValidEmail, parsePositiveInt, requireUuid } from '../middleware/validate.js';

const router = Router();
const leadTypes = new Set(['general', 'reservation', 'newsletter', 'catering']);
const leadStatuses = new Set(['new', 'contacted', 'confirmed', 'closed']);

function normalizeLead(body) {
  const name = cleanString(body.name, 160);
  const email = cleanString(body.email, 254);
  if (!name) throw badRequest('Name is required');
  if (!isValidEmail(email)) throw badRequest('A valid email is required');

  const type = body.type || 'general';
  if (!leadTypes.has(type)) throw badRequest('Lead type is invalid');

  const partySize = body.party_size === undefined || body.party_size === null || body.party_size === ''
    ? null
    : Number.parseInt(body.party_size, 10);
  if (partySize !== null && (!Number.isFinite(partySize) || partySize < 1 || partySize > 200)) {
    throw badRequest('Party size must be between 1 and 200');
  }

  return {
    name,
    email: email.toLowerCase(),
    phone: cleanString(body.phone, 40),
    type,
    message: cleanString(body.message, 4000),
    party_size: partySize,
    preferred_date: cleanString(body.preferred_date, 40),
    preferred_time: cleanString(body.preferred_time, 40),
    status: 'new',
    session_id: cleanString(body.session_id, 120),
  };
}

router.post('/', asyncHandler(async (req, res) => {
  const lead = normalizeLead(req.body);

  if (!isDbConnected()) {
    Object.assign(lead, { id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    memoryStore.leads.push(lead);
  } else {
    const { data, error } = await supabase.from('leads').insert(lead).select().single();
    if (error) throw error;
    Object.assign(lead, data);
  }

  await trackEvent('lead_created', lead.session_id, { type: lead.type });
  res.status(201).json(lead);
}));

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const status = cleanString(req.query.status, 40);
  const limit = parsePositiveInt(req.query.limit, 100, 500);
  if (status && !leadStatuses.has(status)) throw badRequest('Lead status is invalid');

  if (!isDbConnected()) {
    let leads = [...memoryStore.leads];
    if (status) leads = leads.filter(l => l.status === status);
    return res.json(leads.reverse().slice(0, limit));
  }

  let query = supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(limit);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  res.json(data || []);
}));

router.patch('/:id', authMiddleware, asyncHandler(async (req, res) => {
  requireUuid(req.params.id, 'Lead ID');
  const { status } = req.body;
  if (!leadStatuses.has(status)) throw badRequest('Lead status is invalid');

  if (!isDbConnected()) {
    const lead = memoryStore.leads.find(l => l.id === req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    lead.status = status;
    lead.updated_at = new Date().toISOString();
    return res.json(lead);
  }

  const { data, error } = await supabase
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Lead not found' });
  res.json(data);
}));

router.get('/export/csv', authMiddleware, asyncHandler(async (_req, res) => {
  let leads;
  if (!isDbConnected()) {
    leads = memoryStore.leads;
  } else {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    leads = data || [];
  }

  const headers = ['Name', 'Email', 'Phone', 'Type', 'Message', 'Party Size', 'Preferred Date', 'Preferred Time', 'Status', 'Created At'];
  const rows = leads.map(l => [
    l.name, l.email, l.phone || '', l.type, l.message || '',
    l.party_size || '', l.preferred_date || '', l.preferred_time || '', l.status, l.created_at,
  ]);
  const escape = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map(row => row.map(escape).join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=leads-export.csv');
  res.send(csv);
}));

export default router;
