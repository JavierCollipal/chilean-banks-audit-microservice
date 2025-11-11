/**
 * Chilean Bank Interface
 */
export interface IChileanBank {
  _id?: string;
  name: string;
  code: string;
  loginUrl: string;
  description?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Security Audit Result Interface
 */
export interface ISecurityAuditResult {
  bankCode: string;
  bankName: string;
  loginUrl: string;
  timestamp: Date;
  ssl: ISSLAnalysis;
  headers: ISecurityHeaders;
  authentication: IAuthenticationAnalysis;
  csrf: ICSRFAnalysis;
  recommendations: string[];
  riskScore: number; // 0-100 (0 = excellent, 100 = critical)
  status: 'completed' | 'failed' | 'timeout';
  error?: string;
}

/**
 * SSL/TLS Analysis
 */
export interface ISSLAnalysis {
  enabled: boolean;
  protocol?: string;
  validCertificate?: boolean;
  issuer?: string;
  expiryDate?: Date;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' | 'UNKNOWN';
  issues: string[];
}

/**
 * Security Headers Analysis
 */
export interface ISecurityHeaders {
  strictTransportSecurity: boolean;
  contentSecurityPolicy: boolean;
  xFrameOptions: boolean;
  xContentTypeOptions: boolean;
  referrerPolicy: boolean;
  permissionsPolicy: boolean;
  headers: Record<string, string>;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

/**
 * Authentication Analysis
 */
export interface IAuthenticationAnalysis {
  methods: string[]; // e.g., ['username-password', '2FA', 'biometric']
  mfaAvailable: boolean;
  mfaTypes: string[]; // e.g., ['SMS', 'App', 'Token']
  passwordRequirements: string[];
  sessionManagement: {
    timeout?: number;
    secureFlag?: boolean;
    httpOnlyFlag?: boolean;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

/**
 * CSRF Protection Analysis
 */
export interface ICSRFAnalysis {
  tokenPresent: boolean;
  tokenType?: 'hidden-field' | 'header' | 'cookie' | 'unknown';
  tokenValue?: string;
  isProtected: boolean;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}
