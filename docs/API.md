# API Documentation

Base URL: `http://localhost:3001/api` (development)

All admin endpoints require `Authorization: Bearer <token>` header.

---

## Public Endpoints

### GET /public/config

Returns chatbot and business configuration for the widget.

**Response:**
```json
{
  "business": {
    "name": "La Bella Cucina",
    "tagline": "Authentic Italian cuisine since 1985",
    "phone": "+1 (555) 123-4567",
    "email": "info@labellacucina.com",
    "whatsapp": "+15551234567",
    "address": "123 Main Street, New York, NY 10001",
    "google_maps_url": "https://maps.google.com/...",
    "hours": { "monday": "11:00 AM - 10:00 PM" }
  },
  "chatbot": {
    "welcome_message": "Welcome! ...",
    "suggested_prompts": ["What are your hours?", "..."],
    "quick_actions": [{ "label": "Menu", "action": "menu" }],
    "theme": { "primaryColor": "#e11d48", "accentColor": "#f97316" }
  }
}
```

---

### POST /chat

Send a message and receive a streaming AI response via Server-Sent Events.

**Request:**
```json
{
  "message": "What are your hours?",
  "sessionId": "uuid-string"
}
```

**Response:** SSE stream
```
data: {"type":"chunk","content":"We are open"}
data: {"type":"chunk","content":" Monday-Thursday..."}
data: {"type":"done","sessionId":"uuid-string"}
```

---

### GET /chat/history/:sessionId

Retrieve conversation history.

**Response:**
```json
{
  "sessionId": "uuid",
  "messages": [
    { "role": "assistant", "content": "Welcome!", "created_at": "..." },
    { "role": "user", "content": "Hours?", "created_at": "..." }
  ]
}
```

---

### DELETE /chat/history/:sessionId

Clear conversation history for a session.

---

### POST /leads

Create a lead or reservation request.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+15551234567",
  "type": "reservation",
  "party_size": 4,
  "preferred_date": "2026-07-01",
  "preferred_time": "19:00",
  "message": "Window seat please",
  "session_id": "uuid"
}
```

**Types:** `general`, `reservation`, `newsletter`, `catering`

---

### GET /faqs

List active FAQs (public, no auth required).

---

### POST /analytics/track

Track an analytics event.

**Request:**
```json
{
  "eventType": "widget_opened",
  "sessionId": "uuid",
  "metadata": {}
}
```

---

## Admin Endpoints

### POST /admin/login

**Request:**
```json
{ "email": "admin@restaurant.com", "password": "changeme123" }
```

**Response:**
```json
{ "token": "jwt-token", "user": { "email": "...", "role": "admin" } }
```

---

### GET /admin/analytics

Dashboard analytics summary.

**Response:**
```json
{
  "totalConversations": 42,
  "totalMessages": 156,
  "totalLeads": 8,
  "recentEvents": [...],
  "eventsByType": { "widget_opened": 30, "message_sent": 100 }
}
```

---

### GET /admin/conversations

List all conversations (paginated).

**Query params:** `limit`, `offset`

---

### GET /admin/conversations/:id/messages

Get messages for a specific conversation.

---

### GET /admin/business

Get business settings.

### PUT /admin/business

Update business settings. Accepts partial updates.

---

### GET /admin/chatbot

Get chatbot configuration.

### PUT /admin/chatbot

Update chatbot config (personality, welcome message, prompts, theme).

---

### POST /faqs

Create FAQ. **Body:** `{ question, answer, category?, sort_order? }`

### PUT /faqs/:id

Update FAQ.

### DELETE /faqs/:id

Delete FAQ.

---

### GET /documents

List uploaded documents.

### POST /documents/upload

Upload document (multipart/form-data).

**Fields:** `file` (PDF/TXT/MD/CSV), `category`

### DELETE /documents/:id

Delete document.

### PATCH /documents/:id

Toggle active status. **Body:** `{ is_active: boolean }`

---

### GET /leads

List all leads.

**Query params:** `status`, `limit`

### PATCH /leads/:id

Update lead status. **Body:** `{ status: "contacted" }`

**Statuses:** `new`, `contacted`, `confirmed`, `closed`

### GET /leads/export/csv

Download leads as CSV file.

---

## Error Responses

All errors return:
```json
{ "error": "Description of the error" }
```

HTTP status codes: `400` (validation), `401` (auth), `404` (not found), `500` (server error)

---

## Rate Limiting

200 requests per 15 minutes per IP on all `/api/` routes.
