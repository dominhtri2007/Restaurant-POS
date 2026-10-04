import React, { useState } from 'react';

export default function UserPasswordModal({ user, onClose, onSubmit, submitting, errorMsg, successMsg }) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4 shadow-lg border-0">
          <div className="modal-header bg-dark text-white rounded-top-4">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-key-fill me-2"></i>Đổi Mật Khẩu: {user.username}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {errorMsg && <div className="alert alert-danger py-2 small mb-3">{errorMsg}</div>}
              {successMsg && <div className="alert alert-success py-2 small mb-3">{successMsg}</div>}
              <div className="mb-3">
                <label className="form-label small fw-bold">Nhân viên: {user.full_name}</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Mật khẩu mới (tối thiểu 4 ký tự)..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer bg-light border-0">
              <button type="button" className="btn btn-light border" onClick={onClose}>Hủy</button>
              <button type="submit" className="btn btn-primary fw-bold" disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Lưu Mật Khẩu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
