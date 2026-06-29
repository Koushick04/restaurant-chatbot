import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { supabase, isDbConnected } from '../config/supabase.js';
import { memoryStore, trackEvent } from '../services/database.js';
import { asyncHandler, badRequest, cleanString, isValidEmail, parsePositiveInt, requireUuid } from '../middleware/validate.js';

const router = Router();

// Reservation statuses and payment statuses
const reservationStatuses = new Set(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']);
const paymentStatuses = new Set(['pending', 'paid', 'refunded', 'cancelled']);

// Generate unique reservation ID (format: RES-YYYYMMDD-XXXXX)
function generateReservationId() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(10000 + Math.random() * 90000);
  return `RES-${dateStr}-${random}`;
}

// Validate reservation date (must be today or future)
function isValidReservationDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date >= today;
}

// Validate reservation time (basic format validation)
function isValidReservationTime(timeStr) {
  // Accept formats like "18:30", "6:30 PM", "18:30:00"
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?(\s*(AM|PM|am|pm))?$/;
  return timeRegex.test(timeStr);
}

// Normalize and validate reservation data
function normalizeReservation(body) {
  const customerName = cleanString(body.customer_name, 160);
  const phone = cleanString(body.phone, 20);
  const email = cleanString(body.email, 254);
  const reservationDate = cleanString(body.reservation_date, 20);
  const reservationTime = cleanString(body.reservation_time, 20);
  const guests = parsePositiveInt(body.guests, 2, 50);
  const specialRequest = cleanString(body.special_request, 1000);
  const sessionId = cleanString(body.session_id, 120);

  // Validation
  if (!customerName) throw badRequest('Customer name is required');
  if (!phone) throw badRequest('Phone number is required');
  if (!isValidEmail(email)) throw badRequest('A valid email is required');
  if (!reservationDate) throw badRequest('Reservation date is required');
  if (!isValidReservationDate(reservationDate)) throw badRequest('Reservation date must be today or a future date');
  if (!reservationTime) throw badRequest('Reservation time is required');
  if (!isValidReservationTime(reservationTime)) throw badRequest('Invalid reservation time format');
  if (!guests) throw badRequest('Number of guests is required (1-50)');
  if (guests < 1 || guests > 50) throw badRequest('Number of guests must be between 1 and 50');

  return {
    reservation_id: generateReservationId(),
    customer_name: customerName,
    phone,
    email: email.toLowerCase(),
    reservation_date: reservationDate,
    reservation_time: reservationTime,
    guests,
    special_request: specialRequest || null,
    booking_fee: 100.00, // Fixed booking fee of ₹100
    payment_status: 'pending',
    reservation_status: 'confirmed',
    session_id: sessionId,
  };
}

// Create a new reservation
router.post('/', asyncHandler(async (req, res) => {
  const reservation = normalizeReservation(req.body);

  if (!isDbConnected()) {
    Object.assign(reservation, { 
      id: crypto.randomUUID(), 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    });
    memoryStore.reservations = memoryStore.reservations || [];
    memoryStore.reservations.push(reservation);
  } else {
    const { data, error } = await supabase.from('reservations').insert(reservation).select().single();
    if (error) throw error;
    Object.assign(reservation, data);
  }

  await trackEvent('reservation_created', reservation.session_id, { 
    reservation_id: reservation.reservation_id,
    guests: reservation.guests,
    date: reservation.reservation_date 
  });

  res.status(201).json({
    success: true,
    message: 'Reservation created successfully',
    reservation,
    note: 'The ₹100 reservation fee will be adjusted in your final bill.'
  });
}));

// Get all reservations (admin only)
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const status = cleanString(req.query.status, 40);
  const date = cleanString(req.query.date, 20);
  const limit = parsePositiveInt(req.query.limit, 100, 500);
  const offset = parsePositiveInt(req.query.offset, 0, 1000);

  if (status && !reservationStatuses.has(status)) throw badRequest('Invalid reservation status');
  if (date && !isValidReservationDate(date)) throw badRequest('Invalid date format');

  if (!isDbConnected()) {
    let reservations = (memoryStore.reservations || []);
    if (status) reservations = reservations.filter(r => r.reservation_status === status);
    if (date) reservations = reservations.filter(r => r.reservation_date === date);
    return res.json({
      reservations: reservations.reverse().slice(offset, offset + limit),
      total: reservations.length
    });
  }

  let query = supabase.from('reservations').select('*', { count: 'exact' });
  
  if (status) query = query.eq('reservation_status', status);
  if (date) query = query.eq('reservation_date', date);
  
  query = query.order('created_at', { ascending: false })
               .range(offset, offset + limit - 1);
  
  const { data, error, count } = await query;
  if (error) throw error;

  res.json({
    reservations: data || [],
    total: count || 0
  });
}));

// Get reservation by ID or reservation_id
router.get('/:id', asyncHandler(async (req, res) => {
  const id = cleanString(req.params.id, 100);
  
  if (!isDbConnected()) {
    const reservation = (memoryStore.reservations || []).find(
      r => r.id === id || r.reservation_id === id
    );
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    return res.json(reservation);
  }

  // Try to find by reservation_id first, then by UUID
  let { data, error } = await supabase
    .from('reservations')
    .select('*')
    .or(`reservation_id.eq.${id},id.eq.${id}`)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  res.json(data);
}));

// Update reservation status (admin only)
router.patch('/:id/status', authMiddleware, asyncHandler(async (req, res) => {
  requireUuid(req.params.id, 'Reservation ID');
  const { reservation_status } = req.body;
  
  if (!reservationStatuses.has(reservation_status)) {
    throw badRequest('Invalid reservation status');
  }

  if (!isDbConnected()) {
    const reservation = (memoryStore.reservations || []).find(r => r.id === req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    reservation.reservation_status = reservation_status;
    reservation.updated_at = new Date().toISOString();
    return res.json(reservation);
  }

  const { data, error } = await supabase
    .from('reservations')
    .update({ 
      reservation_status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Reservation not found' });

  res.json(data);
}));

// Update payment status (admin only)
router.patch('/:id/payment', authMiddleware, asyncHandler(async (req, res) => {
  requireUuid(req.params.id, 'Reservation ID');
  const { payment_status } = req.body;
  
  if (!paymentStatuses.has(payment_status)) {
    throw badRequest('Invalid payment status');
  }

  if (!isDbConnected()) {
    const reservation = (memoryStore.reservations || []).find(r => r.id === req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    reservation.payment_status = payment_status;
    reservation.updated_at = new Date().toISOString();
    return res.json(reservation);
  }

  const { data, error } = await supabase
    .from('reservations')
    .update({ 
      payment_status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Reservation not found' });

  res.json(data);
}));

// Get reservations by email (for customers to view their reservations)
router.get('/email/:email', asyncHandler(async (req, res) => {
  const email = cleanString(req.params.email, 254);
  if (!isValidEmail(email)) throw badRequest('Invalid email address');

  if (!isDbConnected()) {
    const reservations = (memoryStore.reservations || []).filter(
      r => r.email.toLowerCase() === email.toLowerCase()
    );
    return res.json(reservations.reverse());
  }

  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('email', email.toLowerCase())
    .order('reservation_date', { ascending: false });

  if (error) throw error;
  res.json(data || []);
}));

// Get today's reservations (admin dashboard)
router.get('/dashboard/today', authMiddleware, asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  if (!isDbConnected()) {
    const todayReservations = (memoryStore.reservations || []).filter(
      r => r.reservation_date === today && r.reservation_status === 'confirmed'
    );
    return res.json({
      date: today,
      count: todayReservations.length,
      reservations: todayReservations
    });
  }

  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_date', today)
    .eq('reservation_status', 'confirmed')
    .order('reservation_time');

  if (error) throw error;

  res.json({
    date: today,
    count: (data || []).length,
    reservations: data || []
  });
}));

// Get reservation statistics (admin dashboard)
router.get('/dashboard/stats', authMiddleware, asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  if (!isDbConnected()) {
    const reservations = memoryStore.reservations || [];
    const todayReservations = reservations.filter(r => r.reservation_date === today);
    const recentReservations = reservations.filter(r => r.reservation_date >= thirtyDaysAgoStr);
    
    const stats = {
      total: reservations.length,
      today: todayReservations.length,
      confirmed: reservations.filter(r => r.reservation_status === 'confirmed').length,
      pending: reservations.filter(r => r.reservation_status === 'pending').length,
      cancelled: reservations.filter(r => r.reservation_status === 'cancelled').length,
      revenue_pending: reservations.filter(r => r.payment_status === 'pending').length * 100,
      revenue_paid: reservations.filter(r => r.payment_status === 'paid').length * 100,
      recent_30_days: recentReservations.length
    };
    
    return res.json(stats);
  }

  // Get total count
  const { count: total } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true });

  // Get today's count
  const { count: todayCount } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('reservation_date', today);

  // Get status counts
  const { data: statusData } = await supabase
    .from('reservations')
    .select('reservation_status, payment_status');

  const statusCounts = (statusData || []).reduce((acc, r) => {
    acc[r.reservation_status] = (acc[r.reservation_status] || 0) + 1;
    return acc;
  }, {});

  const paymentCounts = (statusData || []).reduce((acc, r) => {
    acc[r.payment_status] = (acc[r.payment_status] || 0) + 1;
    return acc;
  }, {});

  // Get recent 30 days count
  const { count: recentCount } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .gte('reservation_date', thirtyDaysAgoStr);

  const stats = {
    total: total || 0,
    today: todayCount || 0,
    confirmed: statusCounts.confirmed || 0,
    pending: statusCounts.pending || 0,
    cancelled: statusCounts.cancelled || 0,
    revenue_pending: (paymentCounts.pending || 0) * 100,
    revenue_paid: (paymentCounts.paid || 0) * 100,
    recent_30_days: recentCount || 0
  };

  res.json(stats);
}));

export default router;