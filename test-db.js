const { Client } = require('pg');

// Test different passwords for PostgreSQL connection
async function testConnection(password) {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: password,
  });

  try {
    console.log(`🔍 Testing password: ${password}`);
    await client.connect();
    console.log('✅ Connection successful!');
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL Version:', result.rows[0].version.split(' ')[1]);
    await client.end();
    return true;
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    return false;
  }
}

// Test common passwords
async function testCommonPasswords() {
  const commonPasswords = [
    'password',
    'postgres',
    'admin',
    '123456',
    'root',
    'password123',
    'postgres123',
    'admin123'
  ];

  console.log('🔄 Testing common PostgreSQL passwords...\n');

  for (const pwd of commonPasswords) {
    const success = await testConnection(pwd);
    if (success) {
      console.log(`\n🎉 Found working password: "${pwd}"`);
      console.log('📝 Update your config.js with this password!');
      return pwd;
    }
  }

  console.log('\n❌ None of the common passwords worked.');
  console.log('💡 Please check your PostgreSQL installation password.');
  console.log('🔧 Ways to find your password:');
  console.log('   1. pgAdmin mein login kar ke check karo');
  console.log('   2. PostgreSQL installation ke time set kiya tha');
  console.log('   3. pg_hba.conf file mein trust method enable karo');
}

// Run the test
testCommonPasswords().catch(console.error);
