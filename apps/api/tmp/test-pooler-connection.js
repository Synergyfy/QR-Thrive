const { Client } = require('pg');

const connectionString = "postgresql://postgres.bioastcbfnppvtjrmeiz:FmpBv8tns4qMB5wi@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function testConnection() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to pooler (6543)...');
    await client.connect();
    console.log('Successfully connected!');
    
    const res = await client.query('SELECT NOW() as current_time, version();');
    console.log('Query result:', res.rows[0]);
    
    await client.end();
    console.log('Connection closed.');
  } catch (err) {
    console.error('Connection error:', err.message);
    process.exit(1);
  }
}

testConnection();
