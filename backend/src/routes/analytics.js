import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { trackEvent, getAnalyticsSummary } from '../services/database.js';

const router = Router();

/** POST /api/analytics/track - Track a public event */
router.post('/track', async (req, res) => {
  const { eventType, sessionId, metadata } = req.body;
  if (!eventType) return res.status(400).json({ error: 'eventType is required' });

  try {
    await trackEvent(eventType, sessionId, metadata || {});
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track event' });
  }
});

/** GET /api/analytics/summary - Analytics summary (admin) */
router.get('/summary', authMiddleware, async (_req, res) => {
  try {
    const summary = await getAnalyticsSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
