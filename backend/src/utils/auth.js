const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const BCRYPT_SALT_ROUNDS = 10;

const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('JWT_SECRET must be set in production environment.'); })()
    : 'restaurant_pos_secret_key_2026'
);

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

function hashPassword(password) {
  return bcrypt.hashSync(String(password), BCRYPT_SALT_ROUNDS);
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword || !password || typeof password !== 'string') return false;

  if (/^\$2[aby]\$\d{2}\$/.test(storedPassword)) {
    try {
      return bcrypt.compareSync(password, storedPassword);
    } catch (err) {
      return false;
    }
  }

  if (storedPassword.includes(':')) {
    const [salt, key] = storedPassword.split(':');
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const derivedKey = crypto.scryptSync(password, salt, 64);
      if (keyBuffer.length !== derivedKey.length) return false;
      return crypto.timingSafeEqual(keyBuffer, derivedKey);
    } catch (err) {
      return false;
    }
  }

  try {
    const a = Buffer.from(password);
    const b = Buffer.from(storedPassword);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function generateToken(user) {
  const now = Date.now();
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      username: user.username,
      role: Number(user.role),
      full_name: user.full_name,
      iat: now,
      exp: now + TOKEN_EXPIRY_MS
    })
  ).toString('base64');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(payload)
    .digest('hex');

  return `${payload}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;

  try {
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(payload)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    if (!decoded.iat || Date.now() - decoded.iat > TOKEN_EXPIRY_MS) {
      return null;
    }

    return decoded;
  } catch (err) {
    return null;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken
};
