const io = require('socket.io-client');

// Test script to send a message via Socket.IO
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('🔌 Connected to server');

  // Send a test message
  const testMessage = {
    text: 'Test message from script - ' + new Date().toISOString(),
    user: 'TestBot'
  };

  console.log('📤 Sending message:', testMessage);
  socket.emit('notes:create', testMessage);

  // Wait a bit and then disconnect
  setTimeout(() => {
    console.log('🔌 Disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 2000);
});

socket.on('notes:new', (message) => {
  console.log('📨 Received message:', message);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
  process.exit(1);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});
