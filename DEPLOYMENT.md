# 🚀 Production Deployment Guide

Complete guide for deploying Chilean Banks Audit Microservice to production.

---

## 📋 Prerequisites

### Required
- Node.js >= 18.0.0
- MongoDB Atlas account (RULE 47 - **NO localhost!**)
- Domain with SSL certificate (recommended)
- At least 1GB RAM
- 2 CPU cores (recommended)

### Recommended
- Docker & Docker Compose
- Reverse proxy (Nginx/Apache)
- Process manager (PM2)
- Monitoring solution (optional)

---

## 🐳 Docker Deployment (Recommended)

### Step 1: Clone Repository

```bash
git clone https://github.com/JavierCollipal/chilean-banks-audit-microservice.git
cd chilean-banks-audit-microservice
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with production values
nano .env
```

**Production `.env` example**:
```bash
# MongoDB Atlas (REQUIRED - RULE 47: No localhost!)
MONGODB_URI=mongodb+srv://prod_user:secure_password@cluster.mongodb.net/chilean-banks-audit?retryWrites=true&w=majority

# Puppeteer (Headless mode for production)
PUPPETEER_HEADLESS=true
PUPPETEER_SLOW_MO=0
PUPPETEER_DEVTOOLS=false

# Application
NODE_ENV=production
PORT=3000
```

### Step 3: Build and Start

```bash
# Build Docker image
docker-compose build

# Start service
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 4: Verify Deployment

```bash
# Health check
curl http://localhost:3000/health

# Service info
curl http://localhost:3000/audit/info

# Swagger docs
curl http://localhost:3000/api
```

### Step 5: Seed Database

```bash
# Enter container
docker-compose exec chilean-banks-audit sh

# Run seed script
node dist/scripts/seed-banks.js

# Exit container
exit
```

---

## 📦 NPM Package Deployment

### Global Installation

```bash
# Install globally from NPM
npm install -g chilean-banks-audit@latest

# Verify installation
chilean-banks-audit --version
```

### Project Installation

```bash
# Install as dependency
npm install chilean-banks-audit

# Use in your code
const { BankAuditService } = require('chilean-banks-audit');
```

---

## 🔧 Manual Deployment (Without Docker)

### Step 1: Install Dependencies

```bash
# Install Node.js 18+ (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 9.0.0
```

### Step 2: Clone & Configure

```bash
# Clone repository
git clone <repository-url>
cd chilean-banks-audit-microservice

# Install dependencies
npm ci --only=production

# Configure environment
cp .env.example .env
nano .env  # Edit with production values
```

### Step 3: Build Application

```bash
# Build TypeScript
npm run build

# Verify build
ls -la dist/
```

### Step 4: Start with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start dist/main.js --name chilean-banks-audit

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

# Check status
pm2 status
pm2 logs chilean-banks-audit
```

---

## 🌐 Nginx Reverse Proxy (Recommended)

### Step 1: Install Nginx

```bash
# Ubuntu/Debian
sudo apt-get install nginx

# CentOS/RHEL
sudo yum install nginx
```

### Step 2: Configure Nginx

Create `/etc/nginx/sites-available/chilean-banks-audit`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts (for Puppeteer operations)
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=audit_limit:10m rate=10r/s;
    location /audit/run {
        limit_req zone=audit_limit burst=5 nodelay;
        proxy_pass http://localhost:3000;
    }
}
```

### Step 3: Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/chilean-banks-audit /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔐 Security Hardening

### 1. Environment Variables

```bash
# Never commit .env files
echo ".env" >> .gitignore

# Use secure permissions
chmod 600 .env
```

### 2. MongoDB Atlas Security

```bash
# Use IP whitelist
# Add your server's IP in MongoDB Atlas dashboard

# Use strong credentials
# Minimum 16 characters, mixed case, numbers, symbols

# Enable authentication
# Always use mongodb+srv:// protocol
```

### 3. Firewall Rules

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Block direct access to application port
sudo ufw deny 3000/tcp
```

### 4. SSL/TLS Certificate

```bash
# Using Let's Encrypt (free)
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (cron)
sudo certbot renew --dry-run
```

---

## 📊 Monitoring

### Health Checks

```bash
# Manual health check
curl http://localhost:3000/health

# Automated monitoring (cron)
*/5 * * * * curl -f http://localhost:3000/health || systemctl restart chilean-banks-audit
```

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Generate status
pm2 describe chilean-banks-audit

# View logs
pm2 logs chilean-banks-audit --lines 100

# Flush logs
pm2 flush
```

### Docker Monitoring

```bash
# Container stats
docker stats chilean-banks-audit

# Container logs
docker logs -f chilean-banks-audit --tail 100

# Health status
docker inspect chilean-banks-audit | grep Health
```

---

## 🔄 Updates & Maintenance

### Docker Update

```bash
# Pull latest changes
git pull origin main

# Rebuild image
docker-compose build

# Restart with zero downtime
docker-compose up -d --no-deps --build chilean-banks-audit
```

### Manual Update

```bash
# Stop service
pm2 stop chilean-banks-audit

# Pull changes
git pull origin main

# Install new dependencies
npm ci --only=production

# Rebuild
npm run build

# Restart service
pm2 restart chilean-banks-audit
```

### Database Backup

```bash
# MongoDB Atlas has automatic backups
# Configure in Atlas dashboard: Backup > Configure

# Manual export (if needed)
mongoexport --uri="MONGODB_URI" --collection=banks --out=banks_backup.json
```

---

## 🚨 Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

---

## 📈 Performance Optimization

### 1. Node.js Optimization

```bash
# Set NODE_ENV to production
export NODE_ENV=production

# Increase memory limit (if needed)
node --max-old-space-size=2048 dist/main.js
```

### 2. Puppeteer Optimization

```bash
# Use headless mode in production
PUPPETEER_HEADLESS=true

# Disable unnecessary features
PUPPETEER_DEVTOOLS=false
PUPPETEER_SLOW_MO=0
```

### 3. MongoDB Optimization

- Use connection pooling (default: 10 connections)
- Create indexes on frequently queried fields
- Enable compression in Atlas

---

## 🔒 Compliance & Legal

### RULE 47 Compliance

✅ **MongoDB Atlas ONLY** - No localhost connections allowed
✅ Configure `MONGODB_URI` with `mongodb+srv://` protocol
✅ Test environment exception: MongoDB Memory Server

### Ethical Use

⚠️ **This tool is for EDUCATIONAL purposes only**
- Obtain written authorization before auditing
- Only audit systems you own or have permission to test
- No credential testing or brute force attacks
- No exploitation of discovered vulnerabilities

---

## 📞 Support

For deployment issues:
1. Check logs: `pm2 logs` or `docker logs`
2. Verify environment variables
3. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
4. Check MongoDB Atlas connectivity

---

**Remember: Always follow ethical guidelines and obtain proper authorization before conducting security assessments.** 🐾✨
