import { Router } from 'express';
import { getBusinessSettings, getChatbotConfig } from '../services/database.js';

const router = Router();

/** GET /api/public/config - Public chatbot & business config for widget */
router.get('/config', async (_req, res) => {
  try {
    const [business, chatbot] = await Promise.all([
      getBusinessSettings(),
      getChatbotConfig(),
    ]);

    res.json({
      business: {
        name: business.name,
        tagline: business.tagline,
        phone: business.phone,
        email: business.email,
        whatsapp: business.whatsapp,
        address: business.address,
        google_maps_url: business.google_maps_url,
        hours: business.hours,
        logo_url: business.logo_url,
      },
      chatbot: {
        welcome_message: chatbot.welcome_message,
        suggested_prompts: chatbot.suggested_prompts,
        quick_actions: chatbot.quick_actions,
        theme: chatbot.theme,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

export default router;
