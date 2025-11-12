# 🔧 Troubleshooting Guide

Common issues and solutions for Chilean Banks Audit Microservice deployment.

---

## 📋 Table of Contents

- [MongoDB Connection Issues](#mongodb-connection-issues)
- [Puppeteer/Chromium Issues](#puppeteerchromium-issues)
- [Docker Issues](#docker-issues)
- [Environment Variable Issues](#environment-variable-issues)
- [Port Conflicts](#port-conflicts)
- [Memory & Performance Issues](#memory--performance-issues)
- [CI/CD Issues](#cicd-issues)
- [API Issues](#api-issues)
- [Common Deployment Errors](#common-deployment-errors)

---

## 🗄️ MongoDB Connection Issues

### Issue: "RULE 47 Violation: MongoDB must use Atlas URI"

**Symptoms**:
```
Error: RULE 47 Violation: MongoDB MCP must use Atlas URI, NEVER localhost!
```

**Cause**: Using localhost MongoDB connection in production

**Solution**:
```bash
# Check your .env file
cat .env | grep MONGODB_URI

# Should be MongoDB Atlas URI:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# NOT localhost:
MONGODB_URI=mongodb://localhost:27017/database  # ❌ WRONG
```

**Note**: Exception only for `NODE_ENV=test` with MongoDB Memory Server

---

### Issue: "MongoServerError: bad auth"

**Symptoms**:
```
MongoServerError: bad auth: Authentication failed
```

**Cause**: Invalid MongoDB credentials

**Solution**:
1. Verify credentials in MongoDB Atlas dashboard
2. Check if IP address is whitelisted
3. Ensure connection string is properly URL-encoded

```bash
# If password has special characters, URL encode them:
# Example: password with ! becomes %21
MONGODB_URI=mongodb+srv://user:p%40ssw0rd@cluster.mongodb.net/db
```

---

### Issue: "MongoNetworkError: connection timed out"

**Symptoms**:
```
MongoNetworkError: connection timed out
MongooseServerSelectionError: connect ETIMEDOUT
```

**Cause**: Network connectivity or IP whitelist issue

**Solution**:
1. Check MongoDB Atlas IP whitelist:
   - Go to Network Access in Atlas dashboard
   - Add current server IP or `0.0.0.0/0` (for testing only)

2. Test connectivity:
```bash
# Test DNS resolution
nslookup cluster.mongodb.net

# Test network connectivity
curl -v telnet://cluster.mongodb.net:27017
```

3. Check firewall rules:
```bash
sudo ufw status
# Ensure outbound connections are allowed
```

---

## 🎭 Puppeteer/Chromium Issues

### Issue: "Error: Failed to launch the browser process"

**Symptoms**:
```
Error: Failed to launch the browser process!
/usr/bin/chromium-browser: error while loading shared libraries
```

**Cause**: Missing system dependencies for Chromium

**Solution (Docker)**:
```bash
# Already handled in Dockerfile, but if custom image:
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont
```

**Solution (Ubuntu/Debian)**:
```bash
sudo apt-get update
sudo apt-get install -y \
    chromium-browser \
    libxss1 \
    libnss3 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0
```

---

### Issue: "TimeoutError: Navigation timeout exceeded"

**Symptoms**:
```
TimeoutError: Navigation timeout of 30000 ms exceeded
```

**Cause**: Slow network or target website not responding

**Solution**:
1. Increase timeout in environment:
```bash
PUPPETEER_TIMEOUT=60000  # 60 seconds
```

2. Check target website availability:
```bash
curl -I https://portales.bancoestado.cl
```

3. Add retry logic in application code (already implemented)

---

### Issue: "Protocol error: Target closed"

**Symptoms**:
```
ProtocolError: Protocol error (Runtime.callFunctionOn): Target closed
```

**Cause**: Browser crashed or was forcefully closed

**Solution**:
1. Increase memory allocation:
```bash
# For Docker
docker run -m 2g chilean-banks-audit

# For Node.js
node --max-old-space-size=2048 dist/main.js
```

2. Enable headless mode in production:
```bash
PUPPETEER_HEADLESS=true  # Recommended for servers
```

---

## 🐳 Docker Issues

### Issue: "Cannot connect to the Docker daemon"

**Symptoms**:
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Cause**: Docker service not running or permission issue

**Solution**:
```bash
# Start Docker service
sudo systemctl start docker

# Enable on boot
sudo systemctl enable docker

# Add user to docker group (logout/login required)
sudo usermod -aG docker $USER
```

---

### Issue: "docker-compose: command not found"

**Symptoms**:
```
bash: docker-compose: command not found
```

**Cause**: Docker Compose not installed

**Solution**:
```bash
# Ubuntu/Debian
sudo apt-get install docker-compose

# Or install v2 (recommended)
sudo apt-get install docker-compose-plugin

# Use as:
docker compose up -d  # Note: no hyphen
```

---

### Issue: "Error response from daemon: Conflict"

**Symptoms**:
```
Error response from daemon: Conflict. The container name "/chilean-banks-audit" is already in use
```

**Cause**: Container already exists

**Solution**:
```bash
# Stop and remove existing container
docker stop chilean-banks-audit
docker rm chilean-banks-audit

# Or use docker-compose
docker-compose down
docker-compose up -d
```

---

### Issue: "Docker build fails: npm ERR! code ENOTFOUND"

**Symptoms**:
```
npm ERR! code ENOTFOUND
npm ERR! syscall getaddrinfo
npm ERR! errno ENOTFOUND
```

**Cause**: Network issues during Docker build

**Solution**:
```bash
# Use Docker build args for proxy (if needed)
docker build --build-arg HTTP_PROXY=http://proxy:8080 .

# Or configure Docker DNS
# Edit /etc/docker/daemon.json
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}

# Restart Docker
sudo systemctl restart docker
```

---

## 🔧 Environment Variable Issues

### Issue: "Missing environment variable: MONGODB_URI"

**Symptoms**:
```
Error: Missing required environment variable: MONGODB_URI
```

**Cause**: .env file not loaded or variable not set

**Solution**:
1. Verify .env file exists:
```bash
ls -la .env
```

2. Check .env content:
```bash
cat .env | grep MONGODB_URI
```

3. For Docker, ensure .env is in same directory as docker-compose.yml:
```bash
# docker-compose.yml automatically loads .env
docker-compose config  # Verify environment variables
```

4. For PM2, use ecosystem file:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'chilean-banks-audit',
    script: 'dist/main.js',
    env_file: '.env'
  }]
};
```

---

### Issue: "Environment variable contains invalid characters"

**Symptoms**:
```
Error parsing environment variables
```

**Cause**: Unescaped special characters in .env

**Solution**:
```bash
# Wrap values with special characters in quotes
MONGODB_URI="mongodb+srv://user:p@ssw0rd@cluster.mongodb.net/db"

# Or URL encode special characters
MONGODB_URI=mongodb+srv://user:p%40ssw0rd@cluster.mongodb.net/db
```

---

## 🔌 Port Conflicts

### Issue: "Error: listen EADDRINUSE: address already in use :::3000"

**Symptoms**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Cause**: Port 3000 already in use

**Solution**:
1. Find process using port:
```bash
# Linux
sudo lsof -i :3000
sudo netstat -tulpn | grep :3000

# Kill process
sudo kill -9 <PID>
```

2. Or use different port:
```bash
# .env
PORT=3001

# docker-compose.yml
ports:
  - "3001:3000"
```

---

## 🧠 Memory & Performance Issues

### Issue: "JavaScript heap out of memory"

**Symptoms**:
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Cause**: Insufficient memory allocation

**Solution**:
1. Increase Node.js memory:
```bash
# Direct execution
node --max-old-space-size=2048 dist/main.js

# PM2
pm2 start dist/main.js --node-args="--max-old-space-size=2048"

# Docker
# Add to Dockerfile CMD
CMD ["node", "--max-old-space-size=2048", "dist/main"]
```

2. Optimize Puppeteer usage:
```bash
PUPPETEER_HEADLESS=true
PUPPETEER_DEVTOOLS=false
PUPPETEER_SLOW_MO=0
```

---

### Issue: "High CPU usage during audits"

**Symptoms**: CPU usage > 80% during bank audits

**Cause**: Multiple concurrent Puppeteer instances

**Solution**:
1. Limit concurrent audits:
```typescript
// Add rate limiting in controller
@UseGuards(ThrottlerGuard)
@Post('run')
async runAudit() { ... }
```

2. Use headless mode:
```bash
PUPPETEER_HEADLESS=true
```

3. Add process limits (Docker):
```yaml
# docker-compose.yml
services:
  chilean-banks-audit:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

---

## 🔄 CI/CD Issues

### Issue: "GitHub Actions: Tests fail with ECONNREFUSED 127.0.0.1:27017"

**Symptoms**:
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Cause**: MongoDB Memory Server not starting in CI environment

**Solution**:
Already handled in `.github/workflows/ci.yml`:
```yaml
- name: Run Unit Tests
  run: npm run test:cov
  env:
    NODE_ENV: test  # Critical for RULE 47 exception
```

Ensure `NODE_ENV=test` is set for test runs.

---

### Issue: "E2E tests timeout in CI"

**Symptoms**:
```
TimeoutError: Waiting for selector 'button[type="submit"]' failed
```

**Cause**: GitHub Actions runner has limited resources

**Solution**:
1. Increase test timeout:
```typescript
// test/jest-e2e.json
{
  "testTimeout": 30000  // 30 seconds
}
```

2. Use headless mode in CI:
```yaml
env:
  PUPPETEER_HEADLESS: true
```

---

## 🌐 API Issues

### Issue: "404 Not Found on /api endpoint"

**Symptoms**:
```
GET /api -> 404 Not Found
```

**Cause**: Swagger not properly configured

**Solution**:
Verify Swagger setup in `src/main.ts`:
```typescript
const config = new DocumentBuilder()
  .setTitle('Chilean Banks Audit API')
  .setVersion('1.0')
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);
```

Access at: `http://localhost:3000/api`

---

### Issue: "CORS error when accessing API from frontend"

**Symptoms**:
```
Access to fetch at 'http://localhost:3000' from origin 'http://localhost:4200'
has been blocked by CORS policy
```

**Cause**: CORS not enabled

**Solution**:
Enable CORS in `src/main.ts`:
```typescript
app.enableCors({
  origin: ['http://localhost:4200', 'https://yourdomain.com'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
});
```

---

### Issue: "Request timeout on /audit/run endpoint"

**Symptoms**:
```
504 Gateway Timeout
```

**Cause**: Audit takes longer than default timeout

**Solution**:
Increase Nginx timeout:
```nginx
# /etc/nginx/sites-available/chilean-banks-audit
location /audit/run {
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
}
```

---

## 🚨 Common Deployment Errors

### Issue: "npm ERR! 404 Not Found - GET https://registry.npmjs.org/chilean-banks-audit"

**Symptoms**:
```
npm ERR! 404 Not Found - GET https://registry.npmjs.org/chilean-banks-audit
```

**Cause**: Package not yet published or typo in package name

**Solution**:
```bash
# Verify package exists
npm view chilean-banks-audit

# If publishing for first time
npm publish --access public
```

---

### Issue: "Permission denied when binding to port 80"

**Symptoms**:
```
Error: listen EACCES: permission denied 0.0.0.0:80
```

**Cause**: Non-root user cannot bind to port < 1024

**Solution**:
1. Use port > 1024 (recommended):
```bash
PORT=3000
```

2. Use Nginx reverse proxy (recommended):
```nginx
server {
    listen 80;
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

3. Or grant capability (not recommended):
```bash
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

---

### Issue: "Module not found: Cannot find module 'dist/main'"

**Symptoms**:
```
Error: Cannot find module '/app/dist/main'
```

**Cause**: Application not built before deployment

**Solution**:
```bash
# Always build before deploying
npm run build

# Verify build output
ls -la dist/

# Should contain:
# - main.js
# - main.d.ts
# - *.module.js
# - *.controller.js
# - *.service.js
```

---

## 🔍 Diagnostic Commands

### Quick Health Check
```bash
# Application health
curl http://localhost:3000/health

# Service info
curl http://localhost:3000/audit/info

# Docker health
docker inspect chilean-banks-audit | grep -A5 Health

# PM2 status
pm2 describe chilean-banks-audit
```

### Log Collection
```bash
# Docker logs
docker logs chilean-banks-audit --tail 100 -f

# PM2 logs
pm2 logs chilean-banks-audit --lines 100

# System logs
journalctl -u chilean-banks-audit -f
```

### System Resources
```bash
# Memory usage
free -h
docker stats chilean-banks-audit --no-stream

# CPU usage
top -bn1 | grep "Cpu(s)"
docker stats chilean-banks-audit --no-stream

# Disk usage
df -h
du -sh /home/wakibaka/Documents/github/chilean-banks-audit-microservice
```

---

## 📞 Getting Help

If you encounter an issue not listed here:

1. **Check logs** first (Docker/PM2/System)
2. **Verify environment variables** (.env file)
3. **Test MongoDB connectivity** separately
4. **Review** [DEPLOYMENT.md](./DEPLOYMENT.md) for setup steps
5. **Search** existing GitHub issues
6. **Create** a new issue with:
   - Full error message
   - Environment details (OS, Node version, Docker version)
   - Steps to reproduce
   - Relevant logs

---

## 🐾 Additional Resources

- [README.md](./README.md) - Getting started guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
- [ETHICAL-USAGE-GUIDE.md](./ETHICAL-USAGE-GUIDE.md) - Ethical guidelines
- [GitHub Issues](https://github.com/JavierCollipal/chilean-banks-audit-microservice/issues)

---

**Remember: This tool is for EDUCATIONAL purposes only. Always obtain proper authorization before conducting security assessments.** 🐾✨
