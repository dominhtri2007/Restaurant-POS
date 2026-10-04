import React, { useState } from 'react';
import PermissionSelector from './PermissionSelector';

export default function UserAddModal({ onClose, onSubmit, submitting, errorMsg, successMsg }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 0,
    permissions: ['staff_order']
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content rounded-4 shadow-lg border-0">
          <div className="modal-header bg-primary text-white rounded-top-4">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-person-plus-fill me-2"></i>Tạo Tài Khoản Nhân Viên & Phân Quyền
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {errorMsg && <div className="alert alert-danger py-2 small mb-3">{errorMsg}</div>}
              {successMsg && <div className="alert alert-success py-2 small mb-3">{successMsg}</div>}

              <div className="row g-3 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold">Tên đăng nhập (Username) *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="vd: nhanvien1"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold">Mật khẩu ban đầu *</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Tối thiểu 6 ký tự..."
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold">Họ và tên nhân viên *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="vd: Nguyễn Văn A"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold">Vai trò tài khoản *</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: parseInt(e.target.value, 10) })}
                  >
                    <option value={0}>Nhân Viên</option>
                    <option value={1}>ADMIN</option>
                  </select>
                </div>
              </div>

              {formData.role === 1 ? (
                <div className="alert alert-warning small mb-0">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  Tài khoản <strong>ADMIN</strong> sẽ có toàn quyền truy cập tất cả chức năng trong hệ thống (POS, Bếp, Báo cáo, Thực đơn, Bàn QR, Cài đặt và Quản lý nhân viên).
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
                {submitting ? 'Đang tạo...' : 'Tạo Tài Khoản'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
