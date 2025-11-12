/**
 * WebSocket Client Example - Node.js
 *
 * Sprint 3.7: Real-time Monitoring with WebSockets
 *
 * This example demonstrates how to connect to the Chilean Banks Audit
 * WebSocket server from a Node.js application to receive real-time updates.
 *
 * Installation:
 * npm install socket.io-client axios
 *
 * Usage:
 * node examples/websocket-client-node.js
 */

const { io } = require('socket.io-client');
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000';
const WS_URL = 'http://localhost:3000';
const WS_PATH = '/ws';

// Connect to WebSocket server
const socket = io(WS_URL, {
  path: WS_PATH,
  transports: ['websocket', 'polling'],
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('   Client ID:', socket.id);
  console.log('');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});

// Connection status events
socket.on('connection:status', (data) => {
  console.log('📡 Connection Status:', data.message);
  console.log('   Timestamp:', data.timestamp);
  console.log('');
});

socket.on('connection:stats', (data) => {
  console.log('📊 Server Stats:');
  console.log('   Total Clients:', data.totalClients);
  console.log('   Active Audits:', data.activeAudits);
  console.log('');
});

// Audit progress events
socket.on('audit:progress', (data) => {
  console.log(`🔄 Audit Progress: ${data.bankName} (${data.bankCode})`);
  console.log(`   Status: ${data.status}`);
  console.log(`   Progress: ${data.progress}%`);
  console.log(`   Current Step: ${data.currentStep}`);
  console.log('');
});

socket.on('audit:complete', (data) => {
  console.log(`✅ Audit Complete: ${data.bankCode}`);
  console.log(`   Risk Score: ${data.result.riskScore}/100`);
  console.log(`   SSL Grade: ${data.result.ssl.grade}`);
  console.log(`   Headers Grade: ${data.result.headers.grade}`);
  console.log('');
});

socket.on('audit:error', (data) => {
  console.log(`❌ Audit Error: ${data.bankCode}`);
  console.log(`   Error: ${data.error}`);
  console.log('');
});

// Subscription confirmations
socket.on('audit:subscribed', (data) => {
  console.log('✅ Subscribed to audit updates');
  if (data.bankCode) {
    console.log(`   Bank: ${data.bankCode}`);
  } else {
    console.log('   All banks');
  }
  console.log('');
});

// Performance metrics events
socket.on('metrics:update', (data) => {
  console.log('📈 Performance Metrics:');
  console.log(`   Memory Usage: ${data.memory.usagePercentage}%`);
  console.log(`   Active Connections: ${data.activeConnections}`);
  console.log(`   Active Audits: ${data.activeAudits}`);
  console.log(`   Uptime: ${Math.floor(data.uptime)}s`);
  console.log('');
});

socket.on('metrics:subscribed', (data) => {
  console.log('✅ Subscribed to performance metrics');
  console.log(`   Update interval: ${data.interval}`);
  console.log('');
});

// Wait for connection, then start demo
socket.on('connect', async () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 Chilean Banks Audit - Real-time Monitoring');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Subscribe to all audit updates
  console.log('📡 Subscribing to all audit updates...');
  socket.emit('audit:subscribe', {});

  // Subscribe to performance metrics
  console.log('📡 Subscribing to performance metrics...');
  socket.emit('metrics:subscribe');

  // Wait a bit for subscriptions to process
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Start an audit via REST API to trigger real-time updates
  console.log('🚀 Starting audit for BCHILE (Banco de Chile)...');
  console.log('   Watch for real-time progress updates below!');
  console.log('');

  try {
    const response = await axios.post(`${API_URL}/audit/run`, {
      bankCode: 'BCHILE',
      verbose: false,
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Final Audit Result:');
    console.log(`   Bank: ${response.data.bankName}`);
    console.log(`   Risk Score: ${response.data.riskScore}/100`);
    console.log(`   SSL Grade: ${response.data.ssl.grade}`);
    console.log(`   Headers Grade: ${response.data.headers.grade}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Keep connection open to receive metrics
    console.log('✅ Audit complete! Keeping connection open for metrics...');
    console.log('   Press Ctrl+C to exit');
    console.log('');
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
  }
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('');
  console.log('👋 Disconnecting...');
  socket.disconnect();
  process.exit(0);
});
