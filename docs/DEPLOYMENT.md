# Deployment Guide

## Overview

| Component | Platform | URL Pattern |
| --- | --- | --- |
| Frontend | Vercel | `https://your-app.vercel.app` |
| Backend | Render | `https://your-api.onrender.com` |
| Database | Supabase | Managed PostgreSQL |

## 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open the SQL Editor.
3. Paste and run the contents of `supabase/schema.sql`.
4. Copy these values from Settings > API:
   - Project URL -> `SUPABASE_URL`
   - `service_role` key -> `SUPABASE_SERVICE_ROLE_KEY`
   - `anon` key -> `SUPABASE_ANON_KEY`

## 2. Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey).
2. Create an API key.
3. Set it as `GEMINI_API_KEY` in the backend environment.

## 3. Backend Deployment On Render

### Option A: Blueprint

1. Push the code to GitHub.
2. Go to the [Render Dashboard](https://dashboard.render.com).
3. Select New > Blueprint.
4. Connect the repository. Render will read `render.yaml` automatically.
5. Set these secret environment variables in the Render dashboard:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `CORS_ORIGIN`

### Option B: Manual Web Service

1. Create a new Web Service on Render.
2. Connect the GitHub repository.
3. Use these settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node
4. Add environment variables from `.env.example`.
5. Deploy.

Your API will be available at `https://your-service.onrender.com`.

Note: Render free tier services can spin down after inactivity. The first request after inactivity may take 30-60 seconds.

## 4. Frontend Deployment On Vercel

1. Push the code to GitHub.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Use these settings:
   - Root Directory: `frontend`
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add these environment variables:

```text
VITE_API_URL=https://your-api.onrender.com/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Deploy.

The `frontend/vercel.json` file handles single-page app routing.

## 5. Post-Deployment Checklist

- [ ] Update `CORS_ORIGIN` on Render to your Vercel URL.
- [ ] Change the default admin password.
- [ ] Set a strong `JWT_SECRET`.
- [ ] Verify the health check at `GET https://your-api.onrender.com/health`.
- [ ] Test the chat widget on the production frontend.
- [ ] Test admin login at `/admin/login`.
- [ ] Upload a sample menu document through the admin dashboard.
- [ ] Submit a test lead or reservation.

## 6. Custom Domain

### Vercel

1. Go to Project Settings > Domains.
2. Add your domain and configure DNS.

### Render

1. Go to Service Settings > Custom Domains.
2. Add your domain and configure DNS CNAME records.

Update `CORS_ORIGIN` and `VITE_API_URL` after adding custom domains.

## 7. Local Production Build Test

Backend:

```bash
cd backend
npm start
```

Frontend:

```bash
cd frontend
npm run build
npm run preview
```

Visit `http://localhost:4173` to test the production frontend locally.

## Troubleshooting

| Issue | Solution |
| --- | --- |
| CORS errors | Ensure `CORS_ORIGIN` matches the frontend URL exactly. |
| 401 on admin | Check admin credentials and JWT token expiry. |
| AI not responding | Verify `GEMINI_API_KEY`; fallback mode works without it. |
| Empty database | Run `supabase/schema.sql`; local fallback works without Supabase. |
| Slow first request | Render free tier cold starts are expected after inactivity. |
| PDF upload fails | Check file size and format. Supported formats are PDF, TXT, MD, and CSV. |
