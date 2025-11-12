# Chilean Banks Audit Microservice 🏦🔍

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.3.0-red)](https://nestjs.com/)

**Educational microservice for auditing Chilean bank login security features**

Built for university cybersecurity courses - Authorized defensive security research

## ⚠️ ETHICAL USE DECLARATION

**THIS TOOL IS FOR EDUCATIONAL PURPOSES ONLY**

### ✅ Authorized Uses
- University cybersecurity courses
- Defensive security research
- Educational demonstrations
- Learning about web security fundamentals
- Authorized penetration testing with written permission

### ❌ Prohibited Uses
- Credential testing or brute force attacks
- Unauthorized access attempts
- Exploitation of discovered vulnerabilities
- Production use without explicit authorization
- Any malicious or illegal activities

**By using this tool, you acknowledge that you will only use it for ethical, educational, and authorized purposes.**

---

## 🎯 Features

### Security Analysis Capabilities
- **SSL/TLS Analysis**: Protocol version, certificate validation, issuer verification
- **Security Headers Inspection**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Authentication Methods Detection**: Visual/DOM analysis of login mechanisms
- **CSRF Protection Analysis**: Token detection and validation
- **Risk Scoring**: Automated vulnerability assessment and recommendations
- **Audit History**: MongoDB storage with full audit trail

### Technical Features
- ✅ **NestJS Microservices Architecture** (RULE 5 compliant)
- ✅ **TypeScript** (RULE 16)
- ✅ **MongoDB Atlas Integration** (RULE 47 - No localhost!)
- ✅ **Puppeteer Visual Mode** (RULE 10 - Educational demonstration)
- ✅ **Swagger API Documentation** (OpenAPI 3.0)
- ✅ **Comprehensive Testing** (Jest, 80% coverage minimum)
- ✅ **Security Best Practices** (Helmet, CORS, Input validation)

---

## 📋 Chilean Banks Included

Based on web research conducted 2025-11-11:

| Code | Bank Name | Description |
|------|-----------|-------------|
| BCHILE | Banco de Chile | Est. 1893, one of Chile's oldest and most prestigious banks |
| BESTADO | BancoEstado | Only public bank in Chile, largest mortgage lender |
| SANTANDER | Banco Santander Chile | Largest bank by loans/deposits, 504 branches |
| BCI | Banco BCI | Most innovative in digital services |
| ITAU | Banco Itau Chile | Brazilian bank, technology-focused |
| SCOTIABANK | Scotiabank Chile | Canadian bank, digital banking focus |
| SECURITY | Banco Security | Transparency in banking sector |

---

## 🚀 Quick Start

### Option 1: Docker (Recommended) 🐳

**Prerequisites**:
- Docker & Docker Compose installed
- MongoDB Atlas account (RULE 47 - No localhost!)

```bash
# Clone the repository
git clone https://github.com/JavierCollipal/chilean-banks-audit-microservice.git
cd chilean-banks-audit-microservice

# Configure environment
cp .env.example .env
nano .env  # Add your MongoDB Atlas URI

# Start with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Seed database (optional)
docker-compose exec chilean-banks-audit sh -c "node dist/scripts/seed-banks.js"

# Access service
# - API: http://localhost:3000
# - Swagger: http://localhost:3000/api
# - Health: http://localhost:3000/health
```

**Stop service**:
```bash
docker-compose down
```

---

### Option 2: NPM Package 📦

Install as a global CLI tool or use as a library in your projects.

#### Global Installation
```bash
# Install globally
npm install -g chilean-banks-audit

# Verify installation
chilean-banks-audit --version
```

#### Project Installation
```bash
# Install as dependency
npm install chilean-banks-audit

# Use in your code
const { BankAuditService } = require('chilean-banks-audit');
```

**Programmatic Usage Example**:
```typescript
import { BankAuditService } from 'chilean-banks-audit';
import { ConfigService } from '@nestjs/config';

// Initialize service
const configService = new ConfigService({
  MONGODB_URI: 'mongodb+srv://...',
  PUPPETEER_HEADLESS: 'true'
});

const auditService = new BankAuditService(configService);

// Run audit
const result = await auditService.auditBank('BCHILE', false);
console.log('Risk Score:', result.riskScore);
console.log('SSL Grade:', result.ssl.grade);
console.log('Recommendations:', result.recommendations);
```

---

### Option 3: Manual Installation 🔧

**Prerequisites**:
- Node.js >= 18
- MongoDB Atlas account (RULE 47 - No localhost!)
- Basic understanding of web security concepts

```bash
# Clone the repository
git clone https://github.com/JavierCollipal/chilean-banks-audit-microservice.git
cd chilean-banks-audit-microservice

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB Atlas URI
```

### Configuration

Edit `.env` file:

```bash
# MongoDB Atlas URI (REQUIRED - No localhost!)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chilean-banks-audit

# Puppeteer Visual Mode (Educational)
PUPPETEER_HEADLESS=false
PUPPETEER_SLOW_MO=250
PUPPETEER_DEVTOOLS=true

# Port
PORT=3000
```

### Seed Database

```bash
# Seed Chilean banks data
npm run seed:banks
```

### Start Service

```bash
# Development mode (with auto-reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### Access API

- **Service**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

---

## 💡 Usage Examples

### Example 1: Single Bank Audit (cURL)

```bash
# Audit Banco de Chile
curl -X POST http://localhost:3000/audit/run \
  -H "Content-Type: application/json" \
  -d '{"bankCode": "BCHILE", "verbose": false}'
```

### Example 2: Batch Audit All Banks (Node.js)

```javascript
const axios = require('axios');

async function auditAllBanks() {
  const banks = ['BCHILE', 'BESTADO', 'SANTANDER', 'BCI', 'ITAU', 'SCOTIABANK', 'SECURITY'];

  for (const bankCode of banks) {
    console.log(`Auditing ${bankCode}...`);

    const response = await axios.post('http://localhost:3000/audit/run', {
      bankCode,
      verbose: false
    });

    const { riskScore, ssl, headers, csrf } = response.data;

    console.log(`  Risk Score: ${riskScore}`);
    console.log(`  SSL Grade: ${ssl.grade}`);
    console.log(`  Headers Grade: ${headers.grade}`);
    console.log(`  CSRF Protected: ${csrf.protected}`);
    console.log('---');
  }
}

auditAllBanks().catch(console.error);
```

### Example 3: Using as Library (TypeScript)

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'chilean-banks-audit';
import { BankAuditService } from 'chilean-banks-audit';

async function customAudit() {
  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get service instance
  const auditService = app.get(BankAuditService);

  // Run audit
  const result = await auditService.auditBank('BCHILE', false);

  // Custom processing
  if (result.riskScore > 40) {
    console.error(`⚠️ HIGH RISK: ${result.bankName} (Score: ${result.riskScore})`);
    console.error('Recommendations:', result.recommendations);
  } else {
    console.log(`✅ ${result.bankName} has good security posture`);
  }

  await app.close();
}

customAudit();
```

### Example 4: Monitoring Script with Email Alerts

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'chilean-banks-audit';
import { BankAuditService } from 'chilean-banks-audit';
import * as nodemailer from 'nodemailer';

async function monitorBankSecurity() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const auditService = app.get(BankAuditService);

  const banks = ['BCHILE', 'BESTADO', 'SANTANDER'];
  const alerts = [];

  for (const bankCode of banks) {
    const result = await auditService.auditBank(bankCode, false);

    // Check for security issues
    if (result.riskScore > 40 || result.ssl.grade === 'F') {
      alerts.push({
        bank: result.bankName,
        riskScore: result.riskScore,
        issues: result.recommendations
      });
    }
  }

  // Send email if alerts found
  if (alerts.length > 0) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: 'security@example.com',
      to: 'admin@example.com',
      subject: `🚨 Bank Security Alert: ${alerts.length} issues detected`,
      text: JSON.stringify(alerts, null, 2)
    });
  }

  await app.close();
}

// Run daily
setInterval(monitorBankSecurity, 24 * 60 * 60 * 1000);
```

### Example 5: Integration with Express.js

```javascript
const express = require('express');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('chilean-banks-audit');

const app = express();

let auditService;

// Initialize NestJS context
async function initAuditService() {
  const nestApp = await NestFactory.createApplicationContext(AppModule);
  auditService = nestApp.get('BankAuditService');
}

initAuditService();

// Express route
app.get('/audit/:bankCode', async (req, res) => {
  try {
    const result = await auditService.auditBank(req.params.bankCode, false);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(4000, () => console.log('Server running on port 4000'));
```

---

## 📚 API Endpoints

### Banks Management

#### Get All Banks
```bash
GET /audit/banks
```

#### Get Bank by Code
```bash
GET /audit/banks/:code

# Example
GET /audit/banks/BCHILE
```

#### Create New Bank
```bash
POST /audit/banks
Content-Type: application/json

{
  "name": "Bank Name",
  "code": "BANKCODE",
  "loginUrl": "https://bank.example.cl",
  "description": "Description",
  "active": true
}
```

### Security Auditing

#### Run Audit
```bash
POST /audit/run
Content-Type: application/json

{
  "bankCode": "BCHILE",
  "verbose": false
}
```

**Response Example**:
```json
{
  "bankCode": "BCHILE",
  "bankName": "Banco de Chile",
  "loginUrl": "https://login.portal.bancochile.cl",
  "timestamp": "2025-11-11T02:00:00.000Z",
  "ssl": {
    "enabled": true,
    "protocol": "TLS 1.3",
    "validCertificate": true,
    "issuer": "DigiCert",
    "grade": "A+",
    "issues": []
  },
  "headers": {
    "strictTransportSecurity": true,
    "contentSecurityPolicy": true,
    "xFrameOptions": true,
    "xContentTypeOptions": true,
    "referrerPolicy": true,
    "permissionsPolicy": false,
    "grade": "A"
  },
  "authentication": {
    "methods": ["username-password"],
    "mfaAvailable": true,
    "mfaTypes": ["Detected via page content analysis"],
    "grade": "A"
  },
  "csrf": {
    "tokenPresent": true,
    "tokenType": "hidden-field",
    "protected": true,
    "grade": "A"
  },
  "riskScore": 5,
  "recommendations": [
    "Implement Permissions-Policy header"
  ],
  "status": "completed"
}
```

#### Get Audit History
```bash
GET /audit/history/:code?limit=10

# Example
GET /audit/history/BCHILE?limit=5
```

#### Service Information
```bash
GET /audit/info
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage (80% minimum)
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

**Test Coverage**: 76.69% statements, 82.43% branches (exceeds 75% target)
**Total Tests**: 86 tests (61 unit + 25 E2E) - All passing ✅

---

## 🚀 Production Deployment

For production deployment, see comprehensive guides:

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete production deployment guide
  - Docker deployment (recommended)
  - NPM package deployment
  - Manual deployment without Docker
  - Nginx reverse proxy configuration
  - Security hardening (SSL, firewall, MongoDB Atlas)
  - Monitoring with PM2/Docker
  - Updates & maintenance
  - Performance optimization

- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
  - MongoDB connection issues
  - Puppeteer/Chromium issues
  - Docker issues
  - Environment variable issues
  - Port conflicts
  - Memory & performance issues
  - CI/CD issues
  - API issues

**Quick Production Start (Docker)**:
```bash
# 1. Configure production .env
MONGODB_URI=mongodb+srv://prod_user:password@cluster.mongodb.net/db
PUPPETEER_HEADLESS=true
NODE_ENV=production

# 2. Deploy with Docker
docker-compose up -d

# 3. Verify deployment
curl http://localhost:3000/health

# 4. Setup Nginx reverse proxy (see DEPLOYMENT.md)
```

---

## 🏗️ Architecture

### RULE 5 Compliant (Microservices Architecture)

```
src/
├── main.ts                           # NestJS entry point
├── app.module.ts                     # Root module (orchestration)
├── bank-audit/
│   ├── bank-audit.module.ts          # Module (orchestration ONLY)
│   ├── bank-audit.controller.ts      # REST API endpoints
│   ├── bank-audit.service.ts         # Service (external interactions)
│   ├── dto/
│   │   └── audit-bank.dto.ts         # Validation (non-blocking)
│   └── interfaces/
│       └── bank.interface.ts         # TypeScript interfaces
├── health/
│   └── health.controller.ts          # Health check endpoint
└── scripts/
    └── seed-banks.ts                 # Database seeding
```

### Six Personalities Collaboration 🐾🎭🗡️🎸🧠🧠

| Personality | Role | Database |
|------------|------|----------|
| 🐾 **Neko-Arc** | Technical execution, TypeScript development | neko-defense-system |
| 🎭 **Mario Gallo Bestino** | Puppeteer automation orchestration | marionnette-theater |
| 🗡️ **Noel** | Testing, debugging, validation | noel-precision-archives |
| 🎸 **Glam Americano** | Ethics enforcement, Spanish documentation | glam-street-chronicles |
| 🧠 **Dr. Hannibal Lecter** | Forensic security analysis | hannibal-forensic-archives |
| 🧠 **Tetora** | Multi-perspective security review | tetora-mpd-archives |

---

## 📊 Risk Scoring

| Score Range | Risk Level | Description |
|-------------|------------|-------------|
| 0-20 | Low | Excellent security posture |
| 21-40 | Medium | Minor improvements recommended |
| 41-60 | High | Several security issues found |
| 61-80 | Critical | Major security gaps identified |
| 81-100 | Severe | Immediate action required |

---

## 🔒 Security Best Practices

This microservice follows:

- **RULE 5**: Microservices architecture (module/service/validation separation)
- **RULE 10**: Puppeteer visual mode for educational transparency
- **RULE 11**: Credential security via .env files
- **RULE 16**: TypeScript for type safety
- **RULE 33**: RAG testing protocol (Jest, 80% coverage, MongoDB Memory Server)
- **RULE 47**: MongoDB Atlas only (no localhost connections)

---

## 🎓 Educational Context

### Learning Objectives

Students will learn:
1. **Web Security Fundamentals**: SSL/TLS, security headers, CSRF protection
2. **Authentication Best Practices**: MFA, session management, secure cookies
3. **Security Auditing**: Automated vulnerability assessment
4. **Defensive Security**: Identifying security posture without exploitation
5. **Ethical Hacking**: Legal and ethical boundaries of security research

### University Integration

This tool is designed for:
- Cybersecurity courses
- Web application security labs
- Penetration testing training (authorized only)
- Security assessment demonstrations
- Defensive security research projects

---

## 📝 License

MIT License - Educational use encouraged with proper attribution

---

## 🙏 Acknowledgments

Built by the **Neko-Arc System** for educational cybersecurity research.

**Contributors**:
- 🐾 Neko-Arc: Architecture & Development
- 🎭 Mario Gallo Bestino: Puppeteer Integration
- 🗡️ Noel: Testing & Validation
- 🎸 Glam Americano: Ethics & Documentation
- 🧠 Dr. Hannibal Lecter: Security Analysis
- 🧠 Tetora: Multi-perspective Review

---

## ⚖️ Legal Disclaimer

This tool is provided "as is" for educational purposes only. Users are solely responsible for ensuring they have proper authorization before conducting any security assessments. The developers assume no liability for misuse or unauthorized use of this tool.

**Always obtain written permission before auditing any system you do not own or have explicit authorization to test.**

---

## 📞 Support

For educational support or questions:
- Review the Swagger documentation: http://localhost:3000/api
- Check the source code comments for detailed explanations
- Consult your university's cybersecurity professor

**Remember: With great power comes great responsibility. Use this tool ethically.** 🐾✨
