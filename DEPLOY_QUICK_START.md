# Quick Deploy Guide - Netlify + Railway

## 🚀 5-Minute Deployment

### Step 1: Deploy Backend to Railway (2 min)

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will detect it's a Node.js project
5. Click on the service → Settings:
   - **Root Directory:** `server`
   - **Start Command:** `npm start`
6. Add PostgreSQL:
   - Click "+ New" → "Database" → "PostgreSQL"
7. Add Environment Variables:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (auto-set by Railway)
   - `PORT` = `${{PORT}}` (auto-set by Railway)
   - `NODE_ENV` = `production`
   - `FRONTEND_ORIGIN` = `*` (or your Netlify URL later)
8. Copy the public URL (e.g., `https://your-app.railway.app`)

### Step 2: Initialize Database (1 min)

1. In Railway dashboard, click on PostgreSQL service
2. Click "Connect" → Copy connection string
3. Run schema:
   ```bash
   psql "your-connection-string" -f server/schema.sql
   ```
   Or use Railway's built-in SQL editor

### Step 3: Deploy Frontend to Netlify (2 min)

**Option A: Via Netlify Dashboard**
1. Go to [app.netlify.com](https://app.netlify.com)
2. "Add new site" → "Import an existing project"
3. Connect your GitHub repo
4. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
5. Environment variables:
   - `REACT_APP_API_BASE` = `https://your-app.railway.app` (from Step 1)
6. Click "Deploy site"

**Option B: Via Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify init
# Follow prompts, then:
netlify deploy --prod
```

### Step 4: Update CORS (30 sec)

1. In Railway, go to your backend service
2. Add environment variable:
   - `FRONTEND_ORIGIN` = `https://your-site.netlify.app`
3. Redeploy (Railway auto-redeploys on env change)

## ✅ Done!

- Frontend: `https://your-site.netlify.app`
- Backend: `https://your-app.railway.app`
- Database: Managed by Railway

## 🔧 Troubleshooting

**Frontend shows API errors:**
- Check `REACT_APP_API_BASE` in Netlify env vars
- Verify backend URL is accessible

**Backend can't connect to DB:**
- Check `DATABASE_URL` in Railway env vars
- Verify PostgreSQL service is running
- Run schema: `psql $DATABASE_URL -f server/schema.sql`

**CORS errors:**
- Update `FRONTEND_ORIGIN` in Railway to match Netlify URL

## 📝 Notes

- Railway gives you a free $5 credit to start
- Netlify free tier is generous for static sites
- Both auto-deploy on git push (if connected to GitHub)

## 🎯 Next Steps

1. Add custom domains (optional)
2. Set up monitoring
3. Configure backups
4. Add SSL certificates (auto-handled by both platforms)

---

**Total Cost: ~$5/month (Railway) + Free (Netlify)** 💰

