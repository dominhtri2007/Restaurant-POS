const fs = require('fs');
const path = require('path');

const backendEnvPath = path.resolve(__dirname, '../.env');
const rootEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(backendEnvPath)) require('dotenv').config({ path: backendEnvPath });
if (fs.existsSync(rootEnvPath)) require('dotenv').config({ path: rootEnvPath, override: false });

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const customerRoutes = require('./routes/customerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const server = http.createServer(app);

app.disable('x-powered-by');
app.enable('trust proxy');

const customOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const envOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  ...customOrigins
].filter(Boolean);

const allowedOrigins = Array.from(new Set([
  ...envOrigins,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]));

const corsOptions = {
  origin: (origin, callback) => {

    if (!origin) return callback(null, true);

    if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|100\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    if (process.env.ALLOWED_ORIGINS === '*' || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const isDomainMatched = envOrigins.some((allowed) => {
      try {
        const allowedHost = new URL(allowed).hostname;
        const originHost = new URL(origin).hostname;
        return originHost === allowedHost || originHost.endsWith(`.${allowedHost}`);
      } catch {
        return false;
      }
    });

    if (isDomainMatched) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};

const io = new Server(server, {
  cors: corsOptions
});

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api', customerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Live.' });
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('join_table', (tableId) => {
    const cleanTableId = parseInt(tableId, 10);
    if (!isNaN(cleanTableId) && cleanTableId > 0) {
      socket.join(`table_${cleanTableId}`);
      console.log(`[Socket] Table ${cleanTableId} joined room: table_${cleanTableId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`[Server] POS Server listening on port: ${PORT}`);

  const connected = await pool.testConnection();
  if (connected) {
    try {
      const [cols] = await pool.query('SHOW COLUMNS FROM orders');
      const colNames = cols.map((c) => c.Field);
      if (!colNames.includes('daily_order_number')) {
        await pool.query('ALTER TABLE `orders` ADD COLUMN `daily_order_number` INT NULL AFTER `id`');
        console.log('[Schema Sync] Added daily_order_number column to orders table');
      }
      if (!colNames.includes('staff_name')) {
        await pool.query('ALTER TABLE `orders` ADD COLUMN `staff_name` VARCHAR(100) NULL AFTER `customer_name`');
      }
      if (!colNames.includes('order_source')) {
        await pool.query("ALTER TABLE `orders` ADD COLUMN `order_source` VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER' AFTER `staff_name`");
      }

      const [userTableCheck] = await pool.query("SHOW TABLES LIKE 'users'");
      if (userTableCheck.length > 0) {
        const [userCols] = await pool.query('SHOW COLUMNS FROM users');
        const userColNames = userCols.map((c) => c.Field);
        if (!userColNames.includes('permissions')) {
          await pool.query('ALTER TABLE `users` ADD COLUMN `permissions` TEXT NULL AFTER `role`');
          console.log('[Schema Sync] Added permissions column to users table');
        }
      }
    } catch (migErr) {
      console.warn('[Schema Sync] Migration check warning:', migErr.message);
    }
  }
});
