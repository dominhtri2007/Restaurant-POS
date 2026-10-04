const mysql = require('mysql2/promise');

const requiredEnvironmentVariables = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvironmentVariables = requiredEnvironmentVariables.filter((key) => process.env[key] === undefined);

if (missingEnvironmentVariables.length > 0) {
  throw new Error(`[Database] Missing required environment variables: ${missingEnvironmentVariables.join(', ')}`);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  timezone: '+07:00',
  charset: 'utf8mb4'
});

pool.testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Connected to MySQL database: ${process.env.DB_NAME}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('[Database] Connection failed:', error.message);
    return false;
  }
};

module.exports = pool;
