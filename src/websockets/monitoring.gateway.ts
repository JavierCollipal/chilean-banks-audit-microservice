import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * Monitoring WebSocket Gateway
 *
 * Sprint 3.7: Real-time Monitoring with WebSockets
 *
 * Provides real-time updates for:
 * - Audit progress streaming
 * - Performance metrics streaming
 * - Connection management
 * - Optional authentication
 *
 * Events:
 * - 'audit:progress' - Real-time audit progress updates
 * - 'metrics:update' - Live performance metrics
 * - 'connection:status' - Connection health status
 *
 * Client connection:
 * const socket = io('http://localhost:3000', { path: '/ws' });
 */
@WebSocketGateway({
  cors: {
    origin: '*', // Educational mode - allow all origins
    credentials: true,
  },
  namespace: '/', // Default namespace
  path: '/ws', // Custom path for WebSocket connections
})
export class MonitoringGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MonitoringGateway.name);
  private connectedClients = new Map<string, any>();
  private auditProgress = new Map<string, any>();
  private metricsInterval: NodeJS.Timeout;

  /**
   * Initialize gateway and start metrics broadcasting
   */
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    // Start broadcasting metrics every 5 seconds
    this.metricsInterval = setInterval(() => {
      this.broadcastPerformanceMetrics();
    }, 5000);
  }

  /**
   * Handle client connection
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, {
      id: client.id,
      connectedAt: new Date(),
      subscriptions: [],
    });

    // Send welcome message
    client.emit('connection:status', {
      status: 'connected',
      clientId: client.id,
      timestamp: new Date(),
      message: 'Welcome to Chilean Banks Audit Real-time Monitoring',
    });

    // Send current stats
    client.emit('connection:stats', {
      totalClients: this.connectedClients.size,
      activeAudits: this.auditProgress.size,
    });
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  /**
   * Subscribe to audit progress updates
   */
  @SubscribeMessage('audit:subscribe')
  handleAuditSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { bankCode?: string }
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      if (data.bankCode) {
        clientInfo.subscriptions.push(`audit:${data.bankCode}`);
        client.emit('audit:subscribed', {
          bankCode: data.bankCode,
          message: `Subscribed to audit updates for ${data.bankCode}`,
        });
      } else {
        clientInfo.subscriptions.push('audit:*');
        client.emit('audit:subscribed', {
          message: 'Subscribed to all audit updates',
        });
      }
    }
  }

  /**
   * Unsubscribe from audit progress updates
   */
  @SubscribeMessage('audit:unsubscribe')
  handleAuditUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { bankCode?: string }
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      const subscription = data.bankCode ? `audit:${data.bankCode}` : 'audit:*';
      clientInfo.subscriptions = clientInfo.subscriptions.filter(
        (sub: string) => sub !== subscription
      );
      client.emit('audit:unsubscribed', {
        bankCode: data.bankCode,
        message: 'Unsubscribed from audit updates',
      });
    }
  }

  /**
   * Subscribe to performance metrics
   */
  @SubscribeMessage('metrics:subscribe')
  handleMetricsSubscribe(@ConnectedSocket() client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      clientInfo.subscriptions.push('metrics');
      client.emit('metrics:subscribed', {
        message: 'Subscribed to performance metrics',
        interval: '5 seconds',
      });
    }
  }

  /**
   * Unsubscribe from performance metrics
   */
  @SubscribeMessage('metrics:unsubscribe')
  handleMetricsUnsubscribe(@ConnectedSocket() client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      clientInfo.subscriptions = clientInfo.subscriptions.filter(
        (sub: string) => sub !== 'metrics'
      );
      client.emit('metrics:unsubscribed', {
        message: 'Unsubscribed from performance metrics',
      });
    }
  }

  /**
   * Emit audit progress update
   * Called by BankAuditService during audit execution
   */
  emitAuditProgress(bankCode: string, progress: any) {
    this.auditProgress.set(bankCode, progress);

    // Emit to all clients subscribed to this bank or all audits
    this.connectedClients.forEach((clientInfo, clientId) => {
      if (
        clientInfo.subscriptions.includes(`audit:${bankCode}`) ||
        clientInfo.subscriptions.includes('audit:*')
      ) {
        this.server.to(clientId).emit('audit:progress', {
          bankCode,
          ...progress,
          timestamp: new Date(),
        });
      }
    });
  }

  /**
   * Emit audit completion
   */
  emitAuditComplete(bankCode: string, result: any) {
    this.auditProgress.delete(bankCode);

    this.connectedClients.forEach((clientInfo, clientId) => {
      if (
        clientInfo.subscriptions.includes(`audit:${bankCode}`) ||
        clientInfo.subscriptions.includes('audit:*')
      ) {
        this.server.to(clientId).emit('audit:complete', {
          bankCode,
          result,
          timestamp: new Date(),
        });
      }
    });
  }

  /**
   * Emit audit error
   */
  emitAuditError(bankCode: string, error: any) {
    this.auditProgress.delete(bankCode);

    this.connectedClients.forEach((clientInfo, clientId) => {
      if (
        clientInfo.subscriptions.includes(`audit:${bankCode}`) ||
        clientInfo.subscriptions.includes('audit:*')
      ) {
        this.server.to(clientId).emit('audit:error', {
          bankCode,
          error: error.message || 'Audit failed',
          timestamp: new Date(),
        });
      }
    });
  }

  /**
   * Broadcast performance metrics to subscribed clients
   * Called via setInterval every 5 seconds
   */
  private broadcastPerformanceMetrics() {
    const metrics = this.getPerformanceMetrics();

    this.connectedClients.forEach((clientInfo, clientId) => {
      if (clientInfo.subscriptions.includes('metrics')) {
        this.server.to(clientId).emit('metrics:update', {
          ...metrics,
          timestamp: new Date(),
        });
      }
    });
  }

  /**
   * Get current performance metrics
   */
  private getPerformanceMetrics() {
    const memoryUsage = process.memoryUsage();

    return {
      memory: {
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        usagePercentage: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2),
      },
      uptime: process.uptime(),
      activeConnections: this.connectedClients.size,
      activeAudits: this.auditProgress.size,
      platform: process.platform,
      nodeVersion: process.version,
    };
  }

  /**
   * Get connected clients info
   */
  getConnectionStats() {
    return {
      totalClients: this.connectedClients.size,
      activeAudits: this.auditProgress.size,
      clients: Array.from(this.connectedClients.values()).map(client => ({
        id: client.id,
        connectedAt: client.connectedAt,
        subscriptions: client.subscriptions,
      })),
    };
  }
}
