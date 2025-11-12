import { Test, TestingModule } from '@nestjs/testing';
import { BankAuditController } from './bank-audit.controller';
import { BankAuditService } from './bank-audit.service';
import { NotFoundException } from '@nestjs/common';

/**
 * Bank Audit Controller Tests (RULE 33 - RAG Testing Protocol)
 *
 * Testing REST API endpoints without requiring MongoDB connection
 * - Unit tests for all controller endpoints
 * - Service is mocked to isolate controller logic
 * - Validates request/response handling
 */
describe('BankAuditController', () => {
  let controller: BankAuditController;
  let service: BankAuditService;

  // Mock data
  const mockBank = {
    name: 'Banco de Chile',
    code: 'BCHILE',
    loginUrl: 'https://login.bancochile.cl',
    description: 'Test bank',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuditResult = {
    bankCode: 'BCHILE',
    bankName: 'Banco de Chile',
    loginUrl: 'https://login.bancochile.cl',
    timestamp: new Date(),
    ssl: { enabled: true, grade: 'A+' as const, issues: [] },
    headers: {
      strictTransportSecurity: true,
      contentSecurityPolicy: true,
      xFrameOptions: true,
      xContentTypeOptions: true,
      referrerPolicy: true,
      permissionsPolicy: true,
      headers: {},
      grade: 'A' as const,
    },
    authentication: {
      methods: ['username-password'],
      mfaAvailable: true,
      mfaTypes: ['SMS'],
      passwordRequirements: [],
      sessionManagement: {},
      grade: 'A' as const,
    },
    csrf: { tokenPresent: true, isProtected: true, grade: 'A' as const },
    recommendations: ['✅ Excellent security posture!'],
    riskScore: 10,
    status: 'completed' as const,
  };

  // Mock service
  const mockBankAuditService = {
    getAllBanks: jest.fn(),
    getBankByCode: jest.fn(),
    createBank: jest.fn(),
    auditBank: jest.fn(),
    getAuditHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankAuditController],
      providers: [
        {
          provide: BankAuditService,
          useValue: mockBankAuditService,
        },
      ],
    }).compile();

    controller = module.get<BankAuditController>(BankAuditController);
    service = module.get<BankAuditService>(BankAuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /audit/banks', () => {
    it('should return all banks', async () => {
      const banks = [mockBank];
      mockBankAuditService.getAllBanks.mockResolvedValue(banks);

      const result = await controller.getAllBanks();

      expect(result).toEqual(banks);
      expect(service.getAllBanks).toHaveBeenCalled();
    });

    it('should return empty array when no banks exist', async () => {
      mockBankAuditService.getAllBanks.mockResolvedValue([]);

      const result = await controller.getAllBanks();

      expect(result).toEqual([]);
      expect(service.getAllBanks).toHaveBeenCalled();
    });
  });

  describe('GET /audit/banks/:code', () => {
    it('should return a bank by code', async () => {
      mockBankAuditService.getBankByCode.mockResolvedValue(mockBank);

      const result = await controller.getBankByCode('BCHILE');

      expect(result).toEqual(mockBank);
      expect(service.getBankByCode).toHaveBeenCalledWith('BCHILE');
    });

    it('should throw NotFoundException for non-existent bank', async () => {
      mockBankAuditService.getBankByCode.mockRejectedValue(
        new NotFoundException('Bank with code NONEXISTENT not found'),
      );

      await expect(controller.getBankByCode('NONEXISTENT')).rejects.toThrow(
        NotFoundException,
      );
      expect(service.getBankByCode).toHaveBeenCalledWith('NONEXISTENT');
    });
  });

  describe('POST /audit/banks', () => {
    it('should create a new bank', async () => {
      const createDto = {
        name: 'Banco de Chile',
        code: 'BCHILE',
        loginUrl: 'https://login.bancochile.cl',
        description: 'Test bank',
        active: true,
      };

      mockBankAuditService.createBank.mockResolvedValue(mockBank);

      const result = await controller.createBank(createDto);

      expect(result).toEqual(mockBank);
      expect(service.createBank).toHaveBeenCalledWith(createDto);
    });

    it('should create bank with default active=true', async () => {
      const createDto = {
        name: 'Banco Estado',
        code: 'BESTADO',
        loginUrl: 'https://login.bancoestado.cl',
      };

      const createdBank = { ...createDto, active: true, createdAt: new Date(), updatedAt: new Date() };
      mockBankAuditService.createBank.mockResolvedValue(createdBank);

      const result = await controller.createBank(createDto);

      expect(result.active).toBe(true);
      expect(service.createBank).toHaveBeenCalledWith(createDto);
    });
  });

  describe('POST /audit/run', () => {
    it('should audit a bank successfully', async () => {
      const auditDto = { bankCode: 'BCHILE', verbose: false };
      mockBankAuditService.auditBank.mockResolvedValue(mockAuditResult);

      const result = await controller.auditBank(auditDto);

      expect(result).toEqual(mockAuditResult);
      expect(service.auditBank).toHaveBeenCalledWith('BCHILE', false);
    });

    it('should audit with verbose mode enabled', async () => {
      const auditDto = { bankCode: 'BCHILE', verbose: true };
      mockBankAuditService.auditBank.mockResolvedValue(mockAuditResult);

      const result = await controller.auditBank(auditDto);

      expect(result).toEqual(mockAuditResult);
      expect(service.auditBank).toHaveBeenCalledWith('BCHILE', true);
    });

    it('should default verbose to false if not provided', async () => {
      const auditDto = { bankCode: 'BCHILE' };
      mockBankAuditService.auditBank.mockResolvedValue(mockAuditResult);

      const result = await controller.auditBank(auditDto);

      expect(result).toEqual(mockAuditResult);
      expect(service.auditBank).toHaveBeenCalledWith('BCHILE', false);
    });

    it('should throw NotFoundException when bank not found', async () => {
      const auditDto = { bankCode: 'NONEXISTENT' };
      mockBankAuditService.auditBank.mockRejectedValue(
        new NotFoundException('Bank with code NONEXISTENT not found'),
      );

      await expect(controller.auditBank(auditDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.auditBank).toHaveBeenCalledWith('NONEXISTENT', false);
    });
  });

  describe('GET /audit/history/:code', () => {
    it('should return audit history for a bank', async () => {
      const history = [mockAuditResult];
      mockBankAuditService.getAuditHistory.mockResolvedValue(history);

      const result = await controller.getAuditHistory('BCHILE', 10);

      expect(result).toEqual(history);
      expect(service.getAuditHistory).toHaveBeenCalledWith('BCHILE', 10);
    });

    it('should use default limit of 10 when not provided', async () => {
      const history = [mockAuditResult];
      mockBankAuditService.getAuditHistory.mockResolvedValue(history);

      const result = await controller.getAuditHistory('BCHILE', undefined);

      expect(result).toEqual(history);
      expect(service.getAuditHistory).toHaveBeenCalledWith('BCHILE', 10);
    });

    it('should respect custom limit parameter', async () => {
      const history = [mockAuditResult, mockAuditResult];
      mockBankAuditService.getAuditHistory.mockResolvedValue(history);

      const result = await controller.getAuditHistory('BCHILE', 2);

      expect(result).toEqual(history);
      expect(service.getAuditHistory).toHaveBeenCalledWith('BCHILE', 2);
    });

    it('should return empty array when no history exists', async () => {
      mockBankAuditService.getAuditHistory.mockResolvedValue([]);

      const result = await controller.getAuditHistory('BCHILE', 10);

      expect(result).toEqual([]);
      expect(service.getAuditHistory).toHaveBeenCalledWith('BCHILE', 10);
    });
  });

  describe('GET /audit/info', () => {
    it('should return service information', () => {
      const result = controller.getServiceInfo();

      expect(result).toBeDefined();
      expect(result.name).toBe('Chilean Banks Audit Microservice');
      expect(result.version).toBe('1.0.0');
      expect(result.description).toContain('Educational');
    });

    it('should include ethical use information', () => {
      const result = controller.getServiceInfo();

      expect(result.ethicalUse).toBeDefined();
      expect(result.ethicalUse.purpose).toContain('University');
      expect(result.ethicalUse.capabilities).toHaveLength(4);
      expect(result.ethicalUse.prohibitions).toHaveLength(4);
    });

    it('should include compliance rules', () => {
      const result = controller.getServiceInfo();

      expect(result.compliance).toBeDefined();
      expect(result.compliance.rules).toHaveLength(4);
      expect(result.compliance.rules).toContain('RULE 47: MongoDB Atlas only');
    });

    it('should include six personalities', () => {
      const result = controller.getServiceInfo();

      expect(result.personalities).toBeDefined();
      expect(Object.keys(result.personalities)).toHaveLength(6);
      expect(result.personalities.neko).toContain('Technical execution');
      expect(result.personalities.mario).toContain('Puppeteer automation');
      expect(result.personalities.noel).toContain('Testing');
      expect(result.personalities.glam).toContain('Ethics');
      expect(result.personalities.hannibal).toContain('Forensic');
      expect(result.personalities.tetora).toContain('Multi-perspective');
    });
  });
});
