# Netlify Deployment Guide

## Overview

Netlify is great for frontend static sites, but our backend needs persistent connections (PostgreSQL, WebSocket). Here are the best deployment options:

## Option 1: Frontend on Netlify + Backend on Railway/Render (Recommended)

### Frontend (Netlify)

1. **Build Configuration:**
   - Build command: `npm run build`
   - Publish directory: `build`
   - Node version: `18.x`

2. **Environment Variables (Netlify Dashboard):**
   ```
   REACT_APP_API_BASE=https://your-backend-url.railway.app
   ```

3. **Deploy Steps:**
   ```bash
   # Connect your GitHub repo to Netlify
   # Or use Netlify CLI:
   npm install -g netlify-cli
   netlify login
   netlify init
   netlify deploy --prod
   ```

### Backend (Railway/Render)

**Railway (Recommended):**
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repo → Add PostgreSQL service
4. Add environment variables:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   PORT=4000
   NODE_ENV=production
   FRONTEND_ORIGIN=https://your-netlify-site.netlify.app
   ```
5. Deploy from `server/` directory

**Render:**
1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Environment: Node
5. Add PostgreSQL database
6. Set environment variables

---

## Option 2: Full Stack on Netlify (Serverless Functions)

Netlify Functions can work but requires refactoring. Here's a hybrid approach:

### Setup Netlify Functions

1. **Create `netlify.toml`:**
   ```toml
   [build]
     command = "npm run build"
     publish = "build"
     functions = "netlify/functions"

   [build.environment]
     NODE_VERSION = "18"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/api/:splat"
     status = 200

   [[redirects]]
     from = "/frontend/*"
     to = "/.netlify/functions/frontend/:splat"
     status = 200
   ```

2. **Create `netlify/functions/api.js`** (serverless wrapper)

3. **Environment Variables:**
   ```
   DATABASE_URL=your_postgres_url
   FRONTEND_ORIGIN=https://your-site.netlify.app
   ```

**Note:** This requires significant refactoring. Option 1 is easier.

---

## Option 3: Netlify + Separate Backend Host

### Frontend: Netlify
- Static build
- Environment: `REACT_APP_API_BASE=https://api.yourdomain.com`

### Backend: VPS/Cloud
- Deploy to DigitalOcean, AWS EC2, or similar
- Use PM2 or Docker
- Point domain to backend IP

---

## Quick Start: Frontend on Netlify

### Step 1: Prepare Frontend

1. **Create `netlify.toml` in project root:**
   ```toml
   [build]
     command = "npm run build"
     publish = "build"

   [build.environment]
     NODE_VERSION = "18"
   ```

2. **Update `.env.production` or Netlify env vars:**
   ```
   REACT_APP_API_BASE=https://your-backend-url.com
   ```

### Step 2: Deploy to Netlify

**Via Netlify Dashboard:**
1. Go to [app.netlify.com](https://app.netlify.com)
2. "Add new site" → "Import an existing project"
3. Connect GitHub/GitLab/Bitbucket
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
5. Add environment variable: `REACT_APP_API_BASE`
6. Deploy!

**Via Netlify CLI:**
```bash
npm install -g netlify-cli
netlify login
netlify init
# Follow prompts, then:
netlify deploy --prod
```

### Step 3: Deploy Backend (Railway - Easiest)

1. **Sign up at [railway.app](https://railway.app)**

2. **Create New Project:**
   - "Deploy from GitHub repo"
   - Select your repository

3. **Add PostgreSQL:**
   - Click "+ New" → "Database" → "PostgreSQL"
   - Railway auto-generates `DATABASE_URL`

4. **Deploy Backend Service:**
   - Click "+ New" → "GitHub Repo"
   - Select same repo
   - Settings:
     - Root Directory: `server`
     - Start Command: `npm start`
     - Build Command: `npm install`

5. **Environment Variables:**
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   PORT=${{PORT}}
   NODE_ENV=production
   FRONTEND_ORIGIN=https://your-netlify-site.netlify.app
   ```

6. **Get Backend URL:**
   - Railway provides a public URL like `https://your-app.railway.app`
   - Update Netlify env var: `REACT_APP_API_BASE=https://your-app.railway.app`

---

## Database Setup on Railway

Railway PostgreSQL is automatically provisioned. To initialize schema:

1. **Get connection string from Railway dashboard**
2. **Run schema:**
   ```bash
   psql $DATABASE_URL -f server/schema.sql
   ```
   Or use Railway's PostgreSQL service → Connect → Run SQL

---

## CORS Configuration

Make sure backend allows Netlify domain:

**Backend `.env`:**
```
FRONTEND_ORIGIN=https://your-site.netlify.app
```

Or allow all (dev):
```
FRONTEND_ORIGIN=*
```

---

## Custom Domain Setup

### Frontend (Netlify)
1. Netlify Dashboard → Domain settings
2. Add custom domain
3. Netlify provides DNS records

### Backend (Railway)
1. Railway → Settings → Networking
2. Add custom domain
3. Update DNS records

---

## Monitoring

### Netlify
- Deploy logs in dashboard
- Function logs (if using serverless)
- Analytics available

### Railway
- Deploy logs
- Metrics dashboard
- Logs streaming

---

## Troubleshooting

### Frontend can't connect to backend
- Check `REACT_APP_API_BASE` is set correctly
- Verify backend URL is accessible
- Check CORS settings in backend

### Backend database errors
- Verify `DATABASE_URL` is set
- Check PostgreSQL is running (Railway dashboard)
- Run schema: `psql $DATABASE_URL -f server/schema.sql`

### Build fails on Netlify
- Check Node version (should be 18+)
- Verify build command: `npm run build`
- Check for missing dependencies

---

## Cost Estimate

- **Netlify:** Free tier (100GB bandwidth, 300 build minutes)
- **Railway:** $5/month starter plan (includes PostgreSQL)
- **Total:** ~$5/month for full stack

---

## Recommended Architecture

```
┌─────────────┐
│   Netlify   │  (Frontend - Static)
│  (Frontend) │
└──────┬──────┘
       │ HTTPS
       │ API Calls
       ▼
┌─────────────┐
│   Railway    │  (Backend API)
│  (Backend)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  PostgreSQL  │  (Database)
│  (Railway)   │
└─────────────┘
```

This is the **easiest and most cost-effective** setup! 🚀

