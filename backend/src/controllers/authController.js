const db = require('../config/db');
const { verifyPassword, generateToken, verifyToken } = require('../utils/auth');

const parsePermissions = (role, perms) => {
  if (Number(role) === 1 || role === 'admin') {
    return ['pos', 'kitchen', 'reports', 'menu', 'qrcodes', 'users', 'settings', 'staff_order'];
  }
  if (!perms) return ['staff_order'];
  if (Array.isArray(perms)) return perms;
  try {
    const parsed = JSON.parse(perms);
    return Array.isArray(parsed) ? parsed : ['staff_order'];
  } catch {
    return ['staff_order'];
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu!' });
  }

  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length > 50 || password.length > 100) {
    return res.status(400).json({ success: false, message: 'Thông tin đăng nhập vượt quá độ dài quy định.' });
  }

  try {

    const [userRows] = await db.query(
      'SELECT id, username, password, full_name, role, permissions, is_active FROM users WHERE username = ? LIMIT 1',
      [cleanUsername]
    );

    if (userRows.length === 0) {
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    const user = userRows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin!' });
    }

    const isMatch = verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    if (!/^\$2[aby]\$\d{2}\$/.test(user.password)) {
      try {
        const { hashPassword } = require('../utils/auth');
        const upgradedHash = hashPassword(password);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [upgradedHash, user.id]);
        console.log(`[Auth] Automatically upgraded password to bcrypt hash for user: ${user.username}`);
      } catch (upgradeErr) {
        console.warn('[Auth] Auto upgrade password hash warning:', upgradeErr.message);
      }
    }

    const roleNum = Number(user.role);
    const userPermissions = parsePermissions(roleNum, user.permissions);

    const token = generateToken({
      ...user,
      role: roleNum,
      permissions: userPermissions
    });

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role: roleNum,
          permissions: userPermissions
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra trong quá trình đăng nhập.' });
  }
};

exports.getMe = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) {
    return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }

  const userId = parseInt(decoded.id, 10);
  if (isNaN(userId) || userId <= 0) {
    return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ.' });
  }

  try {
    const [userRows] = await db.query(
      'SELECT id, username, full_name, role, permissions, is_active FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (userRows.length === 0 || !userRows[0].is_active) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị khóa.' });
    }

    const user = userRows[0];
    const roleNum = Number(user.role);
    const userPermissions = parsePermissions(roleNum, user.permissions);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role: roleNum,
          permissions: userPermissions
        }
      }
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi xác thực tài khoản.' });
  }
};
