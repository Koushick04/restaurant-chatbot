import type { ChatMessage, PublicConfig } from '@/lib/api';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export type ChatStreamEvent =
  | { type: 'chunk'; content: string }
  | { type: 'done'; sessionId: string }
  | { type: 'error'; message: string };

/** Check if the backend API is reachable */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const base = API_URL.replace(/\/api\/?$/, '');
    const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Load public chatbot + business config */
export async function loadChatConfig(): Promise<PublicConfig> {
  const res = await fetch(`${API_URL}/public/config`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to load config' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/** Load conversation history for a session */
export async function loadChatHistory(sessionId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${API_URL}/chat/history/${sessionId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to load history' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.messages || [];
}

/** Clear conversation history */
export async function clearChatHistory(sessionId: string): Promise<void> {
  const res = await fetch(`${API_URL}/chat/history/${sessionId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear history');
}

/**
 * Send a message and stream the AI response via SSE.
 * Calls onChunk with accumulated text as tokens arrive.
 */
export async function streamChatMessage(
  message: string,
  sessionId: string,
  onChunk: (fullText: string) => void,
  onError?: (message: string) => void,
): Promise<{ sessionId: string; fullText: string }> {
  const res = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ message, sessionId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to send message' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream')) {
    throw new Error('Server did not return a streaming response');
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response stream available');

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let returnedSessionId = res.headers.get('X-Session-Id') || sessionId;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;

      const payload = trimmed.slice(5).trim();
      if (!payload) continue;

      try {
        const event: ChatStreamEvent = JSON.parse(payload);

        if (event.type === 'chunk') {
          fullText += event.content;
          onChunk(fullText);
        } else if (event.type === 'done') {
          returnedSessionId = event.sessionId;
        } else if (event.type === 'error') {
          onError?.(event.message);
          throw new Error(event.message);
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }

  return { sessionId: returnedSessionId, fullText };
}

/** Track analytics event (fire-and-forget) */
export function trackChatEvent(
  eventType: string,
  sessionId: string,
  metadata?: Record<string, unknown>,
): void {
  fetch(`${API_URL}/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, sessionId, metadata }),
  }).catch(() => {});
}
