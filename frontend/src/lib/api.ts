import { toast } from '@/components/ui/toast';
import {
  streamChatMessage,
  loadChatHistory,
  clearChatHistory,
  loadChatConfig,
  checkApiHealth,
  trackChatEvent,
} from '@/services/chatService';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    const message = err.error || `HTTP ${res.status}`;
    toast({ title: 'Request failed', description: message, variant: 'error' });
    throw new Error(message);
  }
  return res.json();
}
export const api = {
  // Public - chat uses dedicated chatService
  getConfig: () => loadChatConfig(),
  checkHealth: () => checkApiHealth(),

  sendMessage: (
    message: string,
    sessionId: string,
    onChunk: (text: string) => void,
  ) => streamChatMessage(message, sessionId, onChunk).then(r => r.sessionId),

  getHistory: (sessionId: string) =>
    loadChatHistory(sessionId).then(messages => ({ sessionId, messages })),

  clearHistory: (sessionId: string) => clearChatHistory(sessionId),

  trackEvent: (eventType: string, sessionId: string, metadata?: Record<string, unknown>) =>
    trackChatEvent(eventType, sessionId, metadata),

  createLead: (data: LeadFormData) =>
    fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => handleResponse(r)),

  // Admin
  login: (email: string, password: string) =>
    fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(r => handleResponse<{ token: string; user: { email: string; role: string } }>(r)),

  getAnalytics: () =>
    fetch(`${API_URL}/admin/analytics`, { headers: getAuthHeaders() }).then(r => handleResponse<AnalyticsSummary>(r)),

  getConversations: () =>
    fetch(`${API_URL}/admin/conversations`, { headers: getAuthHeaders() }).then(r => handleResponse<Conversation[]>(r)),

  getConversationMessages: (id: string) =>
    fetch(`${API_URL}/admin/conversations/${id}/messages`, { headers: getAuthHeaders() }).then(r => handleResponse<ChatMessage[]>(r)),

  getBusiness: () =>
    fetch(`${API_URL}/admin/business`, { headers: getAuthHeaders() }).then(r => handleResponse<BusinessSettings>(r)),

  updateBusiness: (data: Partial<BusinessSettings>) =>
    fetch(`${API_URL}/admin/business`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => handleResponse<BusinessSettings>(r)),

  getChatbotConfig: () =>
    fetch(`${API_URL}/admin/chatbot`, { headers: getAuthHeaders() }).then(r => handleResponse<ChatbotConfig>(r)),

  updateChatbotConfig: (data: Partial<ChatbotConfig>) =>
    fetch(`${API_URL}/admin/chatbot`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => handleResponse<ChatbotConfig>(r)),

  getFaqs: () =>
    fetch(`${API_URL}/faqs`, { headers: getAuthHeaders() }).then(r => handleResponse<Faq[]>(r)),

  createFaq: (data: { question: string; answer: string; category?: string }) =>
    fetch(`${API_URL}/faqs`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => handleResponse<Faq>(r)),

  updateFaq: (id: string, data: Partial<Faq>) =>
    fetch(`${API_URL}/faqs/${id}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => handleResponse<Faq>(r)),

  deleteFaq: (id: string) =>
    fetch(`${API_URL}/faqs/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(r => handleResponse(r)),

  getDocuments: () =>
    fetch(`${API_URL}/documents`, { headers: getAuthHeaders() }).then(r => handleResponse<Document[]>(r)),

  uploadDocument: (file: File, category: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('category', category);
    return fetch(`${API_URL}/documents/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: form,
    }).then(r => handleResponse<Document>(r));
  },

  deleteDocument: (id: string) =>
    fetch(`${API_URL}/documents/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(r => handleResponse(r)),

  toggleDocument: (id: string, is_active: boolean) =>
    fetch(`${API_URL}/documents/${id}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active }),
    }).then(r => handleResponse(r)),

  getLeads: () =>
    fetch(`${API_URL}/leads`, { headers: getAuthHeaders() }).then(r => handleResponse<Lead[]>(r)),

  updateLeadStatus: (id: string, status: string) =>
    fetch(`${API_URL}/leads/${id}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(r => handleResponse(r)),

  exportLeads: () => {
    const token = localStorage.getItem('admin_token');
    return fetch(`${API_URL}/leads/export/csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(r => r.blob());
  },

  // Reservations
  createReservation: (data: ReservationFormData) =>
    fetch(`${API_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => handleResponse<ReservationResponse>(r)),

  getReservation: (id: string) =>
    fetch(`${API_URL}/reservations/${id}`).then(r => handleResponse<Reservation>(r)),

  getReservationsByEmail: (email: string) =>
    fetch(`${API_URL}/reservations/email/${email}`).then(r => handleResponse<Reservation[]>(r)),

  // Admin reservation endpoints
  getAllReservations: (params?: { status?: string; date?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.date) query.append('date', params.date);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    
    return fetch(`${API_URL}/reservations?${query.toString()}`, {
      headers: getAuthHeaders(),
    }).then(r => handleResponse<{ reservations: Reservation[]; total: number }>(r));
  },

  updateReservationStatus: (id: string, reservation_status: string) =>
    fetch(`${API_URL}/reservations/${id}/status`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservation_status }),
    }).then(r => handleResponse<Reservation>(r)),

  updateReservationPayment: (id: string, payment_status: string) =>
    fetch(`${API_URL}/reservations/${id}/payment`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status }),
    }).then(r => handleResponse<Reservation>(r)),

  getTodayReservations: () =>
    fetch(`${API_URL}/reservations/dashboard/today`, {
      headers: getAuthHeaders(),
    }).then(r => handleResponse<{ date: string; count: number; reservations: Reservation[] }>(r)),

  getReservationStats: () =>
    fetch(`${API_URL}/reservations/dashboard/stats`, {
      headers: getAuthHeaders(),
    }).then(r => handleResponse<ReservationStats>(r)),
};

// Types
export interface PublicConfig {
  business: {
    name: string;
    tagline: string;
    phone: string;
    email: string;
    whatsapp: string;
    address: string;
    google_maps_url: string;
    hours: Record<string, string>;
    logo_url?: string;
  };
  chatbot: {
    welcome_message: string;
    suggested_prompts: string[];
    quick_actions: { label: string; action: string }[];
    theme: {
      primaryColor: string;
      accentColor: string;
      fontFamily: string;
      borderRadius: string;
      glassOpacity: number;
    };
  };
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
}

export interface LeadFormData {
  name: string;
  email: string;
  phone?: string;
  type?: string;
  message?: string;
  party_size?: number;
  preferred_date?: string;
  preferred_time?: string;
  session_id?: string;
}

export interface AnalyticsSummary {
  totalConversations: number;
  totalMessages: number;
  totalLeads: number;
  recentEvents: { event_type: string; created_at: string }[];
  eventsByType: Record<string, number>;
}

export interface Conversation {
  id: string;
  session_id: string;
  visitor_name?: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessSettings {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  google_maps_url: string;
  hours: Record<string, string>;
  logo_url?: string;
}

export interface ChatbotConfig {
  personality: string;
  welcome_message: string;
  suggested_prompts: string[];
  quick_actions: { label: string; action: string }[];
  theme: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    borderRadius: string;
    glassOpacity: number;
  };
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

export interface Document {
  id: string;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: string;
  message?: string;
  party_size?: number;
  preferred_date?: string;
  preferred_time?: string;
  status: string;
  created_at: string;
}

// Reservation Types
export interface ReservationFormData {
  customer_name: string;
  phone: string;
  email: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  special_request?: string;
  session_id?: string;
}

export interface Reservation {
  id: string;
  reservation_id: string;
  customer_name: string;
  phone: string;
  email: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  special_request?: string;
  booking_fee: number;
  payment_status: 'pending' | 'paid' | 'refunded' | 'cancelled';
  reservation_status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  session_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ReservationResponse {
  success: boolean;
  message: string;
  reservation: Reservation;
  note: string;
}

export interface ReservationStats {
  total: number;
  today: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  revenue_pending: number;
  revenue_paid: number;
  recent_30_days: number;
}




