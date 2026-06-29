import { useState, useEffect, useCallback, useRef } from 'react';
import type { PublicConfig, ChatMessage } from '@/lib/api';
import { generateSessionId } from '@/lib/utils';
import {
  checkApiHealth,
  loadChatConfig,
  loadChatHistory,
  clearChatHistory,
  streamChatMessage,
  trackChatEvent,
} from '@/services/chatService';

export function useChatbot() {
  const [sessionId] = useState(generateSessionId);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [initialized, setInitialized] = useState(false);

  const abortRef = useRef(false);

  // Initialize: health check → config → history
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setError(null);

      const healthy = await checkApiHealth();
      if (cancelled) return;
      setApiConnected(healthy);

      if (!healthy) {
        setError('Cannot connect to chat API. Make sure the backend is running on port 3001.');
        setInitialized(true);
        return;
      }

      try {
        const [cfg, history] = await Promise.all([
          loadChatConfig(),
          loadChatHistory(sessionId),
        ]);

        if (cancelled) return;

        setConfig(cfg);

        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([{ role: 'assistant', content: cfg.chatbot.welcome_message }]);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to initialize chatbot');
        setMessages([{
          role: 'assistant',
          content: 'Welcome! I\'m having trouble connecting to the server. Please try again in a moment.',
        }]);
      } finally {
        if (!cancelled) setInitialized(true);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [sessionId]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setIsLoading(true);
    setIsStreaming(true);

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }]);

    try {
      if (!apiConnected) {
        const healthy = await checkApiHealth();
        setApiConnected(healthy);
        if (!healthy) throw new Error('Chat API is offline. Start the backend with: npm run dev');
      }

      await streamChatMessage(
        trimmed,
        sessionId,
        (streamedText) => {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: streamedText };
            return updated;
          });
        },
        (errMsg) => setError(errMsg),
      );

      trackChatEvent('message_sent', sessionId, { length: trimmed.length });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Sorry, I couldn't process that request.\n\n**${msg}**\n\nPlease try again or contact the restaurant directly.`,
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [isLoading, sessionId, apiConnected]);

  const clearChat = useCallback(async () => {
    try {
      await clearChatHistory(sessionId);
      const welcome = config?.chatbot.welcome_message || 'Hello! How can I help you?';
      setMessages([{ role: 'assistant', content: welcome }]);
      setError(null);
      trackChatEvent('chat_cleared', sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear chat');
    }
  }, [sessionId, config]);

  const openWidget = useCallback(() => {
    trackChatEvent('widget_opened', sessionId);
  }, [sessionId]);

  const retryConnection = useCallback(async () => {
    setError(null);
    setInitialized(false);
    abortRef.current = false;

    const healthy = await checkApiHealth();
    setApiConnected(healthy);

    if (healthy) {
      try {
        const cfg = await loadChatConfig();
        setConfig(cfg);
        if (messages.length <= 1) {
          setMessages([{ role: 'assistant', content: cfg.chatbot.welcome_message }]);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Reconnect failed');
      }
    } else {
      setError('Backend still unreachable. Run: cd backend && npm run dev');
    }
    setInitialized(true);
  }, [messages.length]);

  return {
    sessionId,
    config,
    messages,
    isLoading,
    isStreaming,
    error,
    apiConnected,
    initialized,
    sendMessage,
    clearChat,
    openWidget,
    retryConnection,
  };
}
