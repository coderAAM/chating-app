const { Client } = require('pg');
const config = require('./config');

// Database setup script for WhatsApp Chat
async function setupDatabase() {
  // First connect to default postgres database to create our database
  const adminClient = new Client({
    host: config.database.host,
    port: config.database.port,
    database: 'postgres', // Connect to default postgres database
    user: config.database.user,
    password: config.database.password,
  });

  try {
    console.log('🔄 Connecting to PostgreSQL...');
    await adminClient.connect();

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'whatsapp_chat';
    console.log(`📦 Creating database '${dbName}' if it doesn't exist...`);

    try {
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database '${dbName}' created successfully`);
    } catch (error) {
      if (error.code === '42P04') {
        console.log(`ℹ️ Database '${dbName}' already exists`);
      } else {
        throw error;
      }
    }

    await adminClient.end();

    // Now connect to our specific database
    const client = new Client({
      host: config.database.host,
      port: config.database.port,
      database: dbName,
      user: config.database.user,
      password: config.database.password,
    });

    await client.connect();
    console.log(`✅ Connected to database '${dbName}'`);

    // Create messages table
    console.log('📋 Creating messages table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        user_name VARCHAR(255) NOT NULL DEFAULT 'Anonymous',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)
    `);

    console.log('✅ Messages table created successfully');
    console.log('✅ Database index created for performance');

    // Insert a welcome message
    const welcomeResult = await client.query(`
      INSERT INTO messages (text, user_name)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, ['Welcome to WhatsApp Chat! 🎉', 'System']);

    if (welcomeResult.rowCount > 0) {
      console.log('💬 Welcome message added');
    }

    await client.end();
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Update your .env file with correct database credentials if needed');
    console.log('3. Run: npm start');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is installed and running');
    console.log('2. Check your database credentials in .env file');
    console.log('3. Default credentials: postgres/password');
    console.log('4. Create .env file with:');
    console.log('   DB_HOST=localhost');
    console.log('   DB_PORT=5432');
    console.log('   DB_NAME=whatsapp_chat');
    console.log('   DB_USER=postgres');
    console.log('   DB_PASSWORD=your_password');
    process.exit(1);
  }
}

setupDatabase();
