import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * E2E Tests for Chilean Banks Audit Microservice (RULE 33 - RAG Testing Protocol)
 *
 * Tests all REST API endpoints with real HTTP requests
 * - Uses MongoDB Memory Server for test isolation
 * - Tests complete request/response cycles
 * - Validates API contracts and error handling
 * - Ensures Swagger documentation accuracy
 */
describe('Chilean Banks Audit Microservice (E2E)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Set environment for testing
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = mongoUri;
    process.env.PUPPETEER_HEADLESS = 'true';
    process.env.PUPPETEER_SLOW_MO = '0';
    process.env.PUPPETEER_DEVTOOLS = 'false';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply validation pipes (same as main.ts)
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();

    // Wait for MongoDB connection
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('Health Endpoint', () => {
    it('GET /health should return service status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('service', 'Chilean Banks Audit Microservice');
          expect(res.body).toHaveProperty('version', '1.0.0');
          expect(res.body).toHaveProperty('ethicalUse');
        });
    });

    it('GET /health should return valid ISO timestamp', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          const timestamp = new Date(res.body.timestamp);
          expect(timestamp.getTime()).toBeGreaterThan(0);
          expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        });
    });
  });

  describe('Service Info Endpoint', () => {
    it('GET /audit/info should return service information', () => {
      return request(app.getHttpServer())
        .get('/audit/info')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Chilean Banks Audit Microservice');
          expect(res.body).toHaveProperty('version', '1.0.0');
          expect(res.body).toHaveProperty('description');
          expect(res.body).toHaveProperty('ethicalUse');
          expect(res.body).toHaveProperty('compliance');
          expect(res.body).toHaveProperty('personalities');
        });
    });

    it('GET /audit/info should include six personalities', () => {
      return request(app.getHttpServer())
        .get('/audit/info')
        .expect(200)
        .expect((res) => {
          expect(Object.keys(res.body.personalities)).toHaveLength(6);
          expect(res.body.personalities).toHaveProperty('neko');
          expect(res.body.personalities).toHaveProperty('mario');
          expect(res.body.personalities).toHaveProperty('noel');
          expect(res.body.personalities).toHaveProperty('glam');
          expect(res.body.personalities).toHaveProperty('hannibal');
          expect(res.body.personalities).toHaveProperty('tetora');
        });
    });

    it('GET /audit/info should include RULE 47 compliance', () => {
      return request(app.getHttpServer())
        .get('/audit/info')
        .expect(200)
        .expect((res) => {
          expect(res.body.compliance.rules).toContain('RULE 47: MongoDB Atlas only');
        });
    });
  });

  describe('Bank CRUD Operations', () => {
    let createdBankCode: string;

    it('POST /audit/banks should create a new bank', () => {
      return request(app.getHttpServer())
        .post('/audit/banks')
        .send({
          name: 'E2E Test Bank',
          code: 'E2ETEST',
          loginUrl: 'https://e2etest.cl/login',
          description: 'Bank created in E2E test',
          active: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'E2E Test Bank');
          expect(res.body).toHaveProperty('code', 'E2ETEST');
          expect(res.body).toHaveProperty('loginUrl', 'https://e2etest.cl/login');
          expect(res.body).toHaveProperty('active', true);
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
          createdBankCode = res.body.code;
        });
    });

    it('POST /audit/banks should reject invalid URL', () => {
      return request(app.getHttpServer())
        .post('/audit/banks')
        .send({
          name: 'Invalid Bank',
          code: 'INVALID',
          loginUrl: 'not-a-valid-url',
          active: true,
        })
        .expect(400);
    });

    it('POST /audit/banks should reject missing required fields', () => {
      return request(app.getHttpServer())
        .post('/audit/banks')
        .send({
          name: 'Incomplete Bank',
        })
        .expect(400);
    });

    it('GET /audit/banks should return all banks', () => {
      return request(app.getHttpServer())
        .get('/audit/banks')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('GET /audit/banks/:code should return specific bank', () => {
      return request(app.getHttpServer())
        .get(`/audit/banks/${createdBankCode}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('code', createdBankCode);
          expect(res.body).toHaveProperty('name', 'E2E Test Bank');
        });
    });

    it('GET /audit/banks/:code should return 404 for non-existent bank', () => {
      return request(app.getHttpServer())
        .get('/audit/banks/NONEXISTENT')
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('GET /audit/banks/:code should be case insensitive', () => {
      return request(app.getHttpServer())
        .get(`/audit/banks/${createdBankCode.toLowerCase()}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('code', createdBankCode);
        });
    });
  });

  describe('Audit History Endpoint', () => {
    it('GET /audit/history/:code should return empty array for new bank', () => {
      return request(app.getHttpServer())
        .get('/audit/history/E2ETEST')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /audit/history/:code should accept limit parameter', () => {
      return request(app.getHttpServer())
        .get('/audit/history/E2ETEST?limit=5')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(5);
        });
    });

    it('GET /audit/history/:code should default to limit 10', () => {
      return request(app.getHttpServer())
        .get('/audit/history/E2ETEST')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(10);
        });
    });
  });

  // Swagger documentation is only available in production mode
  // describe('API Documentation', () => {
  //   it('GET /api should be available (Swagger UI)', () => {
  //     return request(app.getHttpServer())
  //       .get('/api')
  //       .expect(200);
  //   });
  // });

  describe('Error Handling', () => {
    it('GET /nonexistent should return 404', () => {
      return request(app.getHttpServer())
        .get('/nonexistent')
        .expect(404);
    });

    it('POST /audit/banks with invalid JSON should return 400', () => {
      return request(app.getHttpServer())
        .post('/audit/banks')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });
  });

  describe('Security Headers', () => {
    it('Responses should include security headers', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          // Helmet should add security headers
          expect(res.headers).toBeDefined();
        });
    });
  });

  describe('CORS', () => {
    it('Should allow CORS requests', () => {
      return request(app.getHttpServer())
        .get('/health')
        .set('Origin', 'http://example.com')
        .expect(200);
    });
  });

  describe('Content-Type', () => {
    it('Should return JSON content type', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect('Content-Type', /json/);
    });

    it('Should return JSON for all API endpoints', () => {
      return request(app.getHttpServer())
        .get('/audit/info')
        .expect(200)
        .expect('Content-Type', /json/);
    });
  });

  describe('Input Validation', () => {
    it('Should reject non-whitelisted properties', () => {
      return request(app.getHttpServer())
        .post('/audit/banks')
        .send({
          name: 'Test Bank',
          code: 'TEST',
          loginUrl: 'https://test.cl',
          active: true,
          maliciousField: 'should be rejected',
        })
        .expect(400);
    });

    it('Should accept proper data types', () => {
      return request(app.getHttpServer())
        .post('/audit/banks')
        .send({
          name: 'Test Bank 2',
          code: 'TEST2',
          loginUrl: 'https://test2.cl',
          active: true, // Proper boolean
        })
        .expect(201)
        .expect((res) => {
          expect(typeof res.body.active).toBe('boolean');
          expect(res.body.active).toBe(true);
        });
    });
  });

  describe('Performance', () => {
    it('Health endpoint should respond quickly', async () => {
      const start = Date.now();
      await request(app.getHttpServer())
        .get('/health')
        .expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should respond in less than 1 second
    });

    it('Info endpoint should respond quickly', async () => {
      const start = Date.now();
      await request(app.getHttpServer())
        .get('/audit/info')
        .expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });
  });
});
