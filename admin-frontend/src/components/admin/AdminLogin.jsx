import React, { useState } from 'react';
import { api } from '../../services/api';
import './AdminLogin.css';

export default function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('pos_admin_remember_user') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem('pos_admin_remember_user');
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.login(trimmedUser, password);
      if (res.success) {
        if (rememberMe) {
          localStorage.setItem('pos_admin_remember_user', trimmedUser);
        } else {
          localStorage.removeItem('pos_admin_remember_user');
        }
        localStorage.setItem('pos_admin_token', res.data.token);
        localStorage.setItem('pos_admin_user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);
      } else {
        setError(res.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ backend. Vui lòng kiểm tra lại dịch vụ.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert('Vui lòng liên hệ Admin để cấp lại mật khẩu.');
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        <div className="admin-login-header">
          <div className="admin-login-logo">
            <i className="bi bi-shield-lock-fill"></i>
          </div>
          <h1 className="admin-login-title">Admin POS</h1>
          <p className="admin-login-subtitle">
            Hệ thống Quản trị
          </p>
        </div>

        {error && (
          <div className="admin-login-error">
            <i className="bi bi-exclamation-octagon-fill flex-shrink-0" style={{ fontSize: '1.1rem' }}></i>
            <span>{error}</span>
          </div>
        )}

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="admin-login-group">
            <label className="admin-login-label">Tên đăng nhập</label>
            <div className="admin-login-input-wrap">
              <i className="bi bi-person-fill admin-login-input-icon"></i>
              <input
                type="text"
                className="admin-login-input"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoFocus={!username}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="admin-login-group">
            <label className="admin-login-label">Mật khẩu</label>
            <div className="admin-login-input-wrap">
              <i className="bi bi-lock-fill admin-login-input-icon"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                className="admin-login-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoFocus={!!username}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="admin-login-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
              </button>
            </div>
          </div>

          <div className="admin-login-options">
            <label className="admin-login-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <button
              type="button"
              className="admin-login-forgot"
              onClick={handleForgotPassword}
            >
              Quên mật khẩu?
            </button>
          </div>

          <button
            type="submit"
            className="admin-login-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right"></i>
                <span>Đăng Nhập</span>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="admin-login-footer">
        Bản quyền &copy; 2026 Admin POS &bull;
      </div>
    </div>
  );
}
