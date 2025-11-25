const { Client } = require('pg');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');
const config = require('./config');

// Fallback to LowDB if PostgreSQL is not available
let usePostgres = true;
let pool = null;
let lowdb = null;

// PostgreSQL connection configuration
const dbConfig = {
  ...config.database,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

try {
  // Try to create PostgreSQL connection
  pool = new Client(dbConfig);
} catch (error) {
  console.log('⚠️ PostgreSQL not available, using LowDB fallback');
  usePostgres = false;

  // Setup LowDB fallback
  const dbFile = path.join(__dirname, 'db.json');
  const adapter = new JSONFile(dbFile);
  lowdb = new Low(adapter, { notes: [] });
}

// Database initialization
async function initializeDatabase() {
  if (usePostgres) {
    try {
      await pool.connect();
      console.log('✅ Connected to PostgreSQL database');

      // Create messages table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          text TEXT NOT NULL,
          user_name VARCHAR(255) NOT NULL DEFAULT 'Anonymous',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ Messages table ready');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed, switching to LowDB:', error.message);
    usePostgres = false;

    // Initialize LowDB fallback
    if (!lowdb) {
      const dbFile = path.join(__dirname, 'db.json');
      const adapter = new JSONFile(dbFile);
      lowdb = new Low(adapter, { notes: [] });
    }

    await lowdb.read();
    await lowdb.write();
    console.log('✅ LowDB fallback initialized');
  }
  } else {
    // LowDB initialization
    if (!lowdb) {
      const dbFile = path.join(__dirname, 'db.json');
      const adapter = new JSONFile(dbFile);
      lowdb = new Low(adapter, { notes: [] });
    }

    await lowdb.read();
    await lowdb.write();
    console.log('✅ LowDB database ready');
  }
}

// Get all messages
async function getAllMessages() {
  if (usePostgres) {
    try {
      const result = await pool.query(
        'SELECT id, text, user_name as user, created_at as t FROM messages ORDER BY created_at DESC LIMIT 100'
      );

      return result.rows.map(row => ({
        id: row.id.toString(),
        text: row.text,
        user: row.user,
        t: row.t.toISOString()
      }));
    } catch (error) {
      console.error('PostgreSQL error, switching to LowDB:', error.message);
      usePostgres = false;
      return await getAllMessages(); // Retry with LowDB
    }
  } else {
    // LowDB fallback
    await lowdb.read();
    return lowdb.data.notes.slice().reverse().map((msg, index) => ({
      id: msg.id || (Date.now() + index).toString(),
      text: msg.text,
      user: msg.user,
      t: msg.t
    }));
  }
}

// Save a new message
async function saveMessage(text, user) {
  if (usePostgres) {
    try {
      const result = await pool.query(
        'INSERT INTO messages (text, user_name) VALUES ($1, $2) RETURNING id, created_at',
        [text, user]
      );

      return {
        id: result.rows[0].id.toString(),
        text,
        user,
        t: result.rows[0].created_at.toISOString()
      };
    } catch (error) {
      console.error('PostgreSQL save error, switching to LowDB:', error.message);
      usePostgres = false;
      return await saveMessage(text, user); // Retry with LowDB
    }
  } else {
    // LowDB fallback
    await lowdb.read();
    const message = {
      id: Date.now().toString(),
      text,
      user: user || 'Anonymous',
      t: new Date().toISOString()
    };

    lowdb.data.notes.push(message);
    await lowdb.write();
    return message;
  }
}

// Delete a message by ID and user (only sender can delete)
async function deleteMessage(id, user) {
  if (usePostgres) {
    try {
      const result = await pool.query('DELETE FROM messages WHERE id = $1 AND user_name = $2', [parseInt(id), user]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('PostgreSQL delete error, switching to LowDB:', error.message);
      usePostgres = false;
      return await deleteMessage(id, user); // Retry with LowDB
    }
  } else {
    // LowDB fallback
    await lowdb.read();
    const index = lowdb.data.notes.findIndex(msg => msg.id === id && msg.user === user);
    if (index !== -1) {
      lowdb.data.notes.splice(index, 1);
      await lowdb.write();
      return true;
    }
    return false;
  }
}

// Update a message by ID and user (only sender can update)
async function updateMessage(id, text, user) {
  if (usePostgres) {
    try {
      const result = await pool.query(
        'UPDATE messages SET text = $1 WHERE id = $2 AND user_name = $3 RETURNING id, text, user_name, created_at',
        [text, parseInt(id), user]
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          id: row.id.toString(),
          text: row.text,
          user: row.user_name,
          t: row.created_at.toISOString()
        };
      }
      return null;
    } catch (error) {
      console.error('PostgreSQL update error, switching to LowDB:', error.message);
      usePostgres = false;
      return await updateMessage(id, text, user); // Retry with LowDB
    }
  } else {
    // LowDB fallback
    await lowdb.read();
    const message = lowdb.data.notes.find(msg => msg.id === id && msg.user === user);
    if (message) {
      message.text = text;
      await lowdb.write();
      return message;
    }
    return null;
  }
}

// Clear all messages
async function clearAllMessages() {
  if (usePostgres) {
    try {
      const result = await pool.query('DELETE FROM messages');
      return result.rowCount;
    } catch (error) {
      console.error('PostgreSQL clear error, switching to LowDB:', error.message);
      usePostgres = false;
      return await clearAllMessages(); // Retry with LowDB
    }
  } else {
    // LowDB fallback
    await lowdb.read();
    const count = lowdb.data.notes.length;
    lowdb.data.notes = [];
    await lowdb.write();
    return count;
  }
}

// Close database connection
async function closeDatabase() {
  if (usePostgres && pool) {
    try {
      await pool.end();
      console.log('✅ PostgreSQL connection closed');
    } catch (error) {
      console.error('Error closing PostgreSQL:', error);
    }
  } else {
    console.log('✅ LowDB session ended');
  }
}

module.exports = {
  initializeDatabase,
  getAllMessages,
  saveMessage,
  deleteMessage,
  updateMessage,
  clearAllMessages,
  closeDatabase
};
