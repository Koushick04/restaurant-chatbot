import { Router } from 'express';
import { streamChatResponse, generateContent } from '../services/gemini.js';
import {
  getOrCreateConversation,
  saveMessage,
  getConversationMessages,
  trackEvent,
} from '../services/database.js';

const router = Router();

/**
 * POST /api/chat
 * Send a message and receive a streaming AI response via SSE.
 */
router.post('/', async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const session = sessionId || crypto.randomUUID();

  try {
    const conversation = await getOrCreateConversation(session);
    await saveMessage(conversation.id, 'user', message.trim());
    await trackEvent('message_sent', session, { messageLength: message.length });

    const history = await getConversationMessages(conversation.id);
    const priorMessages = history.slice(0, -1);

    // Set up Server-Sent Events for streaming
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('X-Session-Id', session);
    res.flushHeaders?.();

    const responseContent = await generateContent(message.trim(), priorMessages);

    await saveMessage(conversation.id, "assistant", responseContent);
    res.json({ type: "done", content: responseContent, sessionId: session });

  } catch (error) {
    console.error('Chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process message' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Something went wrong' })}\n\n`);
      res.end();
    }
  }
});

/**
 * GET /api/chat/history/:sessionId
 * Retrieve conversation history for a session.
 */
router.get('/history/:sessionId', async (req, res) => {
  try {
    const conversation = await getOrCreateConversation(req.params.sessionId);
    const messages = await getConversationMessages(conversation.id);
    res.json({ sessionId: req.params.sessionId, messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * DELETE /api/chat/history/:sessionId
 * Clear conversation history for a session.
 */
router.delete('/history/:sessionId', async (req, res) => {
  try {
    const { supabase, isDbConnected } = await import('../config/supabase.js');
    const { memoryStore } = await import('../services/database.js');

    if (isDbConnected()) {
      const { data: conv } = await supabase.from('conversations').select('id').eq('session_id', req.params.sessionId).single();
      if (conv) {
        await supabase.from('messages').delete().eq('conversation_id', conv.id);
      }
    } else {
      const conv = memoryStore.conversations.find(c => c.session_id === req.params.sessionId);
      if (conv) {
        memoryStore.messages = memoryStore.messages.filter(m => m.conversation_id !== conv.id);
        conv.message_count = 0;
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

export default router;
