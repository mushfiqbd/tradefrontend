# Production Deployment Guide

This guide covers the steps to deploy the BCRD Trading Platform to production.

## Pre-Deployment Checklist

### 1. Environment Variables

Create a `.env.production` file with production values:

```bash
REACT_APP_ENV=production
REACT_APP_BNB_USD_PRICE=380.00
REACT_APP_BCRD_USD_PEGGED_PRICE=1.0
REACT_APP_TRADINGVIEW_SYMBOL=BINANCE:BNBUSDT
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_ERROR_REPORTING=true
REACT_APP_MAX_TRADE_AMOUNT=1000000
REACT_APP_MIN_TRADE_AMOUNT=1
```

### 2. Security Checklist

- [ ] Review and update all API endpoints
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Review input validation
- [ ] Enable error reporting service
- [ ] Set up monitoring and alerts
- [ ] Review wallet connection security
- [ ] Audit smart contract interactions

### 3. Build for Production

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build for production
npm run build:prod

# The build folder contains optimized production files
```

### 4. Build Optimization

The production build includes:
- Minified JavaScript and CSS
- Optimized asset bundling
- Tree shaking (removed unused code)
- Code splitting for better performance
- Source maps (optional, disable in production)

### 5. Deployment Options

#### Option A: Static Hosting (Recommended)

**Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

**Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**AWS S3 + CloudFront:**
1. Build the project: `npm run build:prod`
2. Upload `build/` folder to S3 bucket
3. Configure CloudFront distribution
4. Set up SSL certificate

#### Option B: Traditional Web Server

1. Build the project: `npm run build:prod`
2. Copy `build/` folder to web server
3. Configure web server (nginx/Apache) to serve static files
4. Set up reverse proxy if needed

### 6. Web Server Configuration

#### Nginx Example

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/bcrd-trading/build;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location /static {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7. Performance Optimization

1. **Enable Compression**: Configure gzip/brotli compression
2. **CDN**: Use CDN for static assets
3. **Caching**: Set appropriate cache headers
4. **Lazy Loading**: Components are lazy-loaded where applicable
5. **Code Splitting**: Automatic code splitting is enabled

### 8. Monitoring & Analytics

#### Error Tracking

Integrate error tracking service (e.g., Sentry):

```javascript
// In src/utils/errorHandler.js
import * as Sentry from "@sentry/react";

if (process.env.REACT_APP_ENABLE_ERROR_REPORTING === 'true') {
  Sentry.init({
    dsn: "YOUR_SENTRY_DSN",
    environment: process.env.REACT_APP_ENV,
  });
}
```

#### Analytics

Integrate analytics (e.g., Google Analytics):

```javascript
// In src/App.js
import ReactGA from 'react-ga4';

if (process.env.REACT_APP_ENABLE_ANALYTICS === 'true') {
  ReactGA.initialize('YOUR_GA_ID');
}
```

### 9. Security Best Practices

1. **Content Security Policy (CSP)**
   - Add CSP headers to prevent XSS attacks
   - Configure allowed sources for scripts, styles, etc.

2. **HTTPS Only**
   - Force HTTPS redirects
   - Use HSTS headers

3. **Input Validation**
   - All user inputs are validated
   - Sanitize data before processing

4. **Wallet Security**
   - Validate wallet addresses
   - Check network compatibility
   - Handle connection errors gracefully

### 10. Post-Deployment

1. **Verify Deployment**
   - Test all features
   - Check console for errors
   - Verify wallet connections
   - Test trading functionality

2. **Monitor**
   - Set up uptime monitoring
   - Monitor error rates
   - Track performance metrics
   - Review user feedback

3. **Backup**
   - Regular backups of configuration
   - Version control for code
   - Document deployment process

## Troubleshooting

### Build Fails
- Check Node.js version (requires 14+)
- Clear node_modules and reinstall
- Check for syntax errors

### Runtime Errors
- Check browser console
- Review error logs
- Verify environment variables
- Check network connectivity

### Performance Issues
- Analyze bundle size: `npm run analyze`
- Check for memory leaks
- Optimize images and assets
- Enable compression

## Support

For issues or questions:
1. Check documentation in `/docs`
2. Review error logs
3. Contact development team

---

**Last Updated**: 2024
**Version**: 1.0.0

