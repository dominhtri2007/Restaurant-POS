const { verifyToken } = require('../utils/auth');
const db = require('../config/db');

const parsePermissions = (role, perms) => {
  if (Number(role) === 1 || role === 'admin') {
    return ['pos', 'reports', 'menu', 'qrcodes', 'users'];
  }
  if (!perms) return ['pos'];
  if (Array.isArray(perms)) return perms;
  try {
    const parsed = JSON.parse(perms);
    return Array.isArray(parsed) ? parsed : ['pos'];
  } catch {
    return ['pos'];
  }
};

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Session không hợp lệ.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) {
    return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }

  const userId = parseInt(decoded.id, 10);
  if (isNaN(userId) || userId <= 0) {
    return res.status(401).json({ success: false, message: 'Thông tin tài khoản trong token không hợp lệ.' });
  }

  try {
    const [userRows] = await db.query(
      'SELECT id, username, full_name, role, permissions, is_active FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (userRows.length === 0 || !userRows[0].is_active) {
      return res.status(403).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị khóa.' });
    }

    const user = userRows[0];
    const roleNum = Number(user.role);
    const userPermissions = parsePermissions(roleNum, user.permissions);

    req.user = {
      ...user,
      role: roleNum,
      permissions: userPermissions
    };
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi xác thực hệ thống.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || (Number(req.user.role) !== 1 && req.user.role !== 'admin')) {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này (yêu cầu Admin).' });
  }
  next();
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập.' });
    }
    if (Number(req.user.role) === 1 || req.user.role === 'admin') {
      return next();
    }
    const perms = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    if (perms.includes(permission) || perms.includes('all')) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `Bạn không có quyền thực hiện thao tác này (yêu cầu quyền: ${permission}).`
    });
  };
};

const requireAdminAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập.' });
  }
  if (Number(req.user.role) === 1 || req.user.role === 'admin') {
    return next();
  }
  const perms = Array.isArray(req.user.permissions) ? req.user.permissions : [];
  const adminPerms = ['pos', 'reports', 'menu', 'qrcodes', 'users'];
  const hasAnyAdminPerm = perms.some((p) => adminPerms.includes(p));
  if (hasAnyAdminPerm) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Tài khoản nhân viên không có quyền truy cập hệ thống Quản trị POS.'
  });
};

module.exports = {
  requireAuth,
  requireAdmin,
  requirePermission,
  requireAdminAccess,
  parsePermissions
};
