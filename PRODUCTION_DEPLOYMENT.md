# Production Deployment Guide

## Prerequisites

- PostgreSQL 15+ installed and running
- Node.js 18+ 
- Docker & Docker Compose (optional, for containerized deployment)

## Quick Start (Development)

1. **Setup Database:**
   ```bash
   createdb bcrd_trading
   psql -d bcrd_trading -f server/schema.sql
   ```

2. **Backend:**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with DATABASE_URL
   npm start
   ```

3. **Frontend:**
   ```bash
   # In project root
   npm install
   # Create .env with REACT_APP_API_BASE=http://localhost:4000
   npm start
   ```

## Production Deployment

### Option 1: Docker Compose (Recommended)

1. **Setup environment:**
   ```bash
   # Create .env file
   cat > .env << EOF
   DB_PASSWORD=your_secure_password
   FRONTEND_ORIGIN=https://your-domain.com
   EOF
   ```

2. **Start services:**
   ```bash
   docker-compose up -d
   ```

3. **Check logs:**
   ```bash
   docker-compose logs -f api
   ```

### Option 2: Manual Deployment

#### Backend (Node.js + PM2)

1. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

2. **Setup environment:**
   ```bash
   cd server
   cp .env.example .env.production
   # Edit .env.production
   ```

3. **Start with PM2:**
   ```bash
   pm2 start src/index.js --name bcrd-api --env production
   pm2 save
   pm2 startup
   ```

#### Frontend (Static Build + Nginx)

1. **Build:**
   ```bash
   npm run build
   ```

2. **Deploy to nginx:**
   ```bash
   # Copy build/ to /var/www/bcrd-trading/
   sudo cp -r build/* /var/www/bcrd-trading/
   ```

3. **Nginx config:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name your-domain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       root /var/www/bcrd-trading;
       index index.html;

       # API proxy
       location /api {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /frontend {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
       }

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/bcrd_trading
PORT=4000
NODE_ENV=production
FRONTEND_ORIGIN=https://your-domain.com
```

### Frontend (.env.production)
```env
REACT_APP_API_BASE=https://your-domain.com
```

## Security Checklist

- [ ] Change default database password
- [ ] Use strong API keys (not demo keys)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure CORS to only allow your frontend domain
- [ ] Set up rate limiting (already configured)
- [ ] Enable database backups
- [ ] Set up monitoring/alerting
- [ ] Review and restrict admin endpoints
- [ ] Use environment variables for secrets (never commit .env)

## Monitoring

### Health Checks
- `GET /api/v1/ping` - API health
- `GET /api/v1/time` - Server time sync

### Logs
- Backend logs: `pm2 logs bcrd-api` or `docker-compose logs api`
- Database logs: Check PostgreSQL logs

### Database Backup
```bash
# Daily backup
pg_dump bcrd_trading > backup_$(date +%Y%m%d).sql

# Restore
psql bcrd_trading < backup_20241222.sql
```

## Scaling

- **Horizontal scaling:** Run multiple API instances behind load balancer
- **Database:** Use read replicas for read-heavy operations
- **Caching:** Add Redis for order book caching (future enhancement)

## Troubleshooting

### Database Connection Issues
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL format
- Check firewall/network access

### API Not Responding
- Check logs: `pm2 logs` or `docker-compose logs`
- Verify port 4000 is not blocked
- Check rate limiting isn't blocking requests

### Frontend Can't Connect
- Verify REACT_APP_API_BASE is correct
- Check CORS settings in backend
- Verify nginx proxy configuration

