import { Module } from '@nestjs/common';
import { MonitoringGateway } from './monitoring.gateway';

/**
 * WebSockets Module
 *
 * Sprint 3.7: Real-time Monitoring with WebSockets
 *
 * This module provides real-time capabilities via WebSocket connections:
 * - Real-time audit progress streaming
 * - Live performance metrics updates (every 5 seconds)
 * - Connection management
 * - Optional authentication support
 *
 * Usage:
 * Import this module in AppModule to enable WebSocket functionality
 *
 * Client connection:
 * ```typescript
 * import { io } from 'socket.io-client';
 * const socket = io('http://localhost:3000', { path: '/ws' });
 * ```
 */
@Module({
  providers: [MonitoringGateway],
  exports: [MonitoringGateway],
})
export class WebsocketsModule {}
