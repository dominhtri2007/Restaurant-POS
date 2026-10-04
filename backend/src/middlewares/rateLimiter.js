const hitMap = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of hitMap.entries()) {
    if (now > record.resetTime) {
      hitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

function createRateLimiter({ windowMs, maxHits, message }) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown-ip';
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    const record = hitMap.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    hitMap.set(key, record);

    if (record.count > maxHits) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message: message || 'Quá nhiều yêu cầu được gửi từ địa chỉ của bạn. Vui lòng thử lại sau.'
      });
    }

    next();
  };
}

const loginLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxHits: 10,
  message: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 5 phút.'
});

const orderLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxHits: 20,
  message: 'Bạn đang thao tác gửi đơn quá nhanh. Vui lòng đợi trong giây lát.'
});

module.exports = {
  createRateLimiter,
  loginLimiter,
  orderLimiter
};
