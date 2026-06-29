# Restaurant Chatbot

An AI-powered restaurant chatbot and admin dashboard for answering customer questions, collecting leads, handling reservation requests, and managing restaurant knowledge from one place.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=fff)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=fff)
![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=fff)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=111)
![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google&logoColor=fff)

## Overview

Restaurant Chatbot is a full-stack SaaS-style demo for restaurants. Customers get a polished floating chat widget with streaming AI replies, suggested prompts, contact actions, lead capture, and reservation forms. Restaurant staff get a protected admin dashboard for conversations, analytics, FAQs, documents, business settings, theme controls, and chatbot configuration.

The app can run locally with in-memory fallback data, or connect to Supabase for persistent production storage.

## Features

### Customer Chat Widget

- Floating responsive chatbot for restaurant websites
- Streaming Gemini AI responses with a typing indicator
- Suggested prompts, quick actions, and markdown support
- Voice input through the Web Speech API
- Message copy, conversation history, and clear-chat controls
- WhatsApp, Google Maps, phone, and email actions
- Lead capture and reservation request forms

### Admin Dashboard

- JWT-protected admin login
- Analytics dashboard and event tracking
- Conversation and message viewer
- FAQ create, update, and delete workflows
- Document upload for restaurant knowledge base content
- Business profile and chatbot personality settings
- Lead management with CSV export
- Theme customization with live preview

### AI And Data

- Google Gemini integration with streaming responses
- Knowledge-base-oriented answers from FAQs and uploaded documents
- Graceful fallback behavior when AI credentials are unavailable
- Supabase PostgreSQL schema and production hardening migration
- In-memory fallback for quick local demos

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Radix UI, Framer Motion |
| Backend | Node.js, Express |
| AI | Google Gemini API |
| Database | Supabase PostgreSQL |
| Deployment | Vercel frontend, Render backend |

## Project Structure

```text
restaurant-chatbot/
|-- backend/                 # Express API server
|   |-- src/
|   |   |-- config/          # Supabase config
|   |   |-- middleware/      # Auth and validation middleware
|   |   |-- routes/          # API route handlers
|   |   `-- services/        # Gemini, database, and knowledge base logic
|   `-- uploads/             # Runtime uploads, kept empty in Git
|-- frontend/                # React + Vite application
|   |-- public/
|   `-- src/
|       |-- auth/            # Admin route protection
|       |-- components/      # Chat and UI components
|       |-- context/         # Theme and auth providers
|       |-- hooks/           # Chatbot state hooks
|       |-- lib/             # API client and utilities
|       |-- pages/           # Landing and admin pages
|       `-- services/        # Frontend service adapters
|-- supabase/                # Schema and migrations
|-- docs/                    # API and deployment guides
|-- render.yaml              # Render backend blueprint
`-- .env.example             # Safe environment template
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- Optional: Supabase project
- Optional: Google Gemini API key

### 1. Clone The Repository

```bash
git clone https://github.com/Koushick04/restaurant-chatbot.git
cd restaurant-chatbot
```

### 2. Configure Environment Variables

Copy the example file and create environment files for each app:

```bash
cp .env.example backend/.env
cp .env.example frontend/.env
```

Update the values in `backend/.env` and `frontend/.env`. For a quick local demo, the app can run without Gemini or Supabase credentials, but production deployments should set all required secrets.

### 3. Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 4. Run Locally

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`.

### 5. Admin Login

Default local credentials come from your environment file:

```text
Email: admin@restaurant.com
Password: changeme123
```

Change these before deploying.

## Database Setup

The app includes an in-memory fallback for local demos. For persistent storage:

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Run migrations from `supabase/migrations/` if needed.
4. Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY` to the relevant environment files.

## Useful Commands

| Command | Location | Purpose |
| --- | --- | --- |
| `npm run dev` | `backend/` | Start the Express API with watch mode |
| `npm start` | `backend/` | Start the Express API for production |
| `npm run dev` | `frontend/` | Start the Vite development server |
| `npm run build` | `frontend/` | Type-check and build the frontend |
| `npm run preview` | `frontend/` | Preview the frontend production build |

## Environment Variables

| Variable | Used By | Description |
| --- | --- | --- |
| `PORT` | Backend | API server port |
| `NODE_ENV` | Backend | Runtime environment |
| `JWT_SECRET` | Backend | Secret used to sign admin JWTs |
| `ADMIN_EMAIL` | Backend | Admin login email |
| `ADMIN_PASSWORD` | Backend | Admin login password |
| `GEMINI_API_KEY` | Backend | Google Gemini API key |
| `GEMINI_MODEL` | Backend | Gemini model name |
| `SUPABASE_URL` | Backend, Frontend | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Supabase privileged service key |
| `SUPABASE_ANON_KEY` | Frontend | Supabase public anon key |
| `VITE_API_URL` | Frontend | Backend API base URL |
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL exposed to Vite |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase anon key exposed to Vite |
| `CORS_ORIGIN` | Backend | Allowed frontend origins |

## Deployment

- Frontend: deploy `frontend/` to Vercel.
- Backend: deploy `backend/` to Render, or use the included `render.yaml` blueprint.
- Database: run the Supabase schema and set production environment variables.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full deployment checklist.

## Documentation

- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## Security Notes

- Never commit `.env` files or real API keys.
- Rotate any secret that has been copied into a repository, chat, screenshot, or shared folder.
- Replace the default admin password and use a strong `JWT_SECRET` before production deployment.
- Keep the Supabase service-role key on the backend only.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
