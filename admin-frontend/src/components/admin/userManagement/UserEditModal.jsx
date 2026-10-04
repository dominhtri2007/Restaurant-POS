import React, { useState } from 'react';
import PermissionSelector from './PermissionSelector';

export default function UserEditModal({ user, onClose, onSubmit, submitting, errorMsg, successMsg }) {
  const initialPerms = Array.isArray(user.permissions)
    ? user.permissions
    : (Number(user.role) === 1 ? ['pos', 'kitchen', 'reports', 'menu', 'qrcodes', 'users', 'settings', 'staff_order'] : ['staff_order']);

  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    role: Number(user.role),
    permissions: initialPerms,
    is_active: user.is_active ? 1 : 0,
    new_password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isRootAdmin = user.id === 1;

  return (
    <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content rounded-4 shadow-lg border-0">
          <div className="modal-header bg-dark text-white rounded-top-4">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-pencil-square me-2"></i>Chỉnh Sửa Tài Khoản: {user.username}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {errorMsg && <div className="alert alert-danger py-2 small mb-3">{errorMsg}</div>}
              {successMsg && <div className="alert alert-success py-2 small mb-3">{successMsg}</div>}

              <div className="row g-3 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold">Họ và tên nhân viên *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold">Vai trò</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    disabled={isRootAdmin}
                    onChange={(e) => setFormData({ ...formData, role: parseInt(e.target.value, 10) })}
                  >
                    <option value={0}>Nhân Viên</option>
                    <option value={1}>ADMIN</option>
                  </select>
                  {isRootAdmin && (
                    <small className="text-muted text-[11px]">Không thể thay đổi vai trò của Admin gốc.</small>
                  )}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold">Mật khẩu mới (Tùy chọn)</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Để trống nếu không muốn đổi mật khẩu..."
                    value={formData.new_password}
                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold">Trạng thái hoạt động</label>
                  <select
                    className="form-select"
                    value={formData.is_active}
                    disabled={isRootAdmin}
                    onChange={(e) => setFormData({ ...formData, is_active: parseInt(e.target.value, 10) })}
                  >
                    <option value={1}>Live</option>
                    <option value={0}>Banned</option>
                  </select>
                </div>
              </div>

              {formData.role === 1 ? (
                <div className="alert alert-warning small mb-0">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  Tài khoản <strong>Quản Trị Viên</strong> luôn có toàn quyền truy cập tất cả các chức năng.
                </div>
              ) : (
                <PermissionSelector
                  permissions={formData.permissions}
                  onChange={(nextPerms) => setFormData({ ...formData, permissions: nextPerms })}
                />
              )}
            </div>
            <div className="modal-footer bg-light border-0">
              <button type="button" className="btn btn-light border" onClick={onClose}>Hủy</button>
              <button type="submit" className="btn btn-primary fw-bold px-4" disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
