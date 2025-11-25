// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const config = require('./config');
const { initializeDatabase, getAllMessages, saveMessage, deleteMessage, updateMessage, clearAllMessages } = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Initialize database
initializeDatabase().catch(console.error);

app.use(express.static(path.join(__dirname, 'public'))); // serve frontend

io.on('connection', (socket) => {
  console.log('👤 Client connected:', socket.id);

  // Send existing messages to new client
  (async () => {
    try {
      const messages = await getAllMessages();
      socket.emit('notes:init', messages);
      console.log(`📨 Sent ${messages.length} messages to client ${socket.id}`);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  })();

  // Handle new message from client
  socket.on('notes:create', async (payload) => {
    try {
      const { text, user } = payload;

      if (!text || !text.trim()) {
        socket.emit('error', 'Message cannot be empty');
        return;
      }

      // Save message to database
      const savedMessage = await saveMessage(text.trim(), user || 'Anonymous');

      console.log(`💬 New message from ${savedMessage.user}: ${savedMessage.text.substring(0, 50)}...`);

      // Broadcast to all connected clients (including sender)
      io.emit('notes:new', savedMessage);

    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('error', 'Failed to save message');
    }
  });

  // Handle message deletion
  socket.on('notes:delete', async (payload) => {
    try {
      const { id, user } = payload;

      if (!id || !user) {
        socket.emit('error', 'Message ID and user are required');
        return;
      }

      const deleted = await deleteMessage(id, user);

      if (deleted) {
        console.log(`🗑️ Message deleted by ${user}: ${id}`);

        // Broadcast deletion to all connected clients (including sender)
        io.emit('notes:deleted', id);
      } else {
        socket.emit('error', 'Message not found, could not be deleted, or you can only delete your own messages');
      }

    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('error', 'Failed to delete message');
    }
  });

  // Handle message update
  socket.on('notes:update', async (payload) => {
    try {
      const { id, text, user } = payload;

      if (!id || !text || !text.trim() || !user) {
        socket.emit('error', 'Message ID, text, and user are required');
        return;
      }

      const updatedMessage = await updateMessage(id, text.trim(), user);

      if (updatedMessage) {
        console.log(`✏️ Message updated by ${user}: ${id}`);

        // Broadcast update to all connected clients (including sender)
        io.emit('notes:updated', updatedMessage);
      } else {
        socket.emit('error', 'Message not found, could not be updated, or you can only edit your own messages');
      }

    } catch (error) {
      console.error('Error updating message:', error);
      socket.emit('error', 'Failed to update message');
    }
  });

  // Handle clear all messages
  socket.on('notes:clear', async () => {
    try {
      const deletedCount = await clearAllMessages();

      console.log(`🧹 Chat cleared: ${deletedCount} messages deleted`);

      // Broadcast clear to all connected clients (including sender)
      io.emit('notes:cleared');

    } catch (error) {
      console.error('Error clearing chat:', error);
      socket.emit('error', 'Failed to clear chat');
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('👋 Client disconnected:', socket.id);
  });
});

const port = config.server.port;
server.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));
