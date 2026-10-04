import React from 'react';
import { PERMISSION_CONFIGS } from './permissionsConfig';

export default function UserTable({
  users,
  loading,
  currentUser,
  onRefresh,
  onEdit,
  onEditPassword,
  onToggleStatus,
  onDelete
}) {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
        <h6 className="fw-bold mb-0 text-secondary">Danh Sách ({users.length} tài khoản)</h6>
        <button onClick={onRefresh} className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-repeat me-1"></i> Làm mới
        </button>
      </div>
      <div className="card-body p-0">
        {loading ? (
          <div className="text-center py-5 text-secondary">Đang tải danh sách...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-secondary">
                <tr>
                  <th className="ps-4">Tài Khoản</th>
                  <th>Họ Tên</th>
                  <th>Vai Trò</th>
                  <th>Quyền Hạn Được Cấp</th>
                  <th>Trạng Thái</th>
                  <th>Ngày Tạo</th>
                  <th className="text-end pe-4">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isUserAdmin = Number(u.role) === 1 || u.role === 'admin';
                  const userPerms = Array.isArray(u.permissions) ? u.permissions : [];

                  return (
                    <tr key={u.id}>
                      <td className="ps-4 fw-bold text-dark">
                        <span className={`badge me-2 ${isUserAdmin ? 'bg-danger' : 'bg-primary'} rounded-pill`}>
                          {isUserAdmin ? 'Admin' : 'Staff'}
                        </span>
                        {u.username}
                      </td>
                      <td className="fw-semibold">{u.full_name}</td>
                      <td>
                        <span className={isUserAdmin ? 'text-danger fw-bold' : 'text-primary fw-semibold'}>
                          {isUserAdmin ? 'Quản trị viên' : 'Nhân viên'}
                        </span>
                      </td>
                      <td>
                        {isUserAdmin ? (
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 rounded-pill">
                            <i className="bi bi-stars me-1"></i> Toàn quyền hệ thống
                          </span>
                        ) : userPerms.length === 0 ? (
                          <span className="text-muted small fst-italic">Chưa cấp quyền</span>
                        ) : (
                          <div className="d-flex flex-wrap gap-1">
                            {userPerms.map((permId) => {
                              const conf = PERMISSION_CONFIGS.find((p) => p.id === permId);
                              if (!conf) return null;
                              return (
                                <span key={permId} className={`badge ${conf.badgeColor} rounded-pill text-[11px] px-2 py-0.5`}>
                                  {conf.name}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${u.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {u.is_active ? 'Hoạt Động' : 'Đã Khóa'}
                        </span>
                      </td>
                      <td className="small text-secondary">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="text-end pe-4">
                        <div className="btn-group btn-group-sm">
                          <button
                            onClick={() => onEdit(u)}
                            className="btn btn-outline-primary"
                            title="Chỉnh sửa thông tin & quyền"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button
                            onClick={() => onEditPassword(u)}
                            className="btn btn-outline-secondary"
                            title="Đổi mật khẩu"
                          >
                            <i className="bi bi-key-fill"></i>
                          </button>
                          {u.id !== 1 && (
                            <button
                              onClick={() => onToggleStatus(u)}
                              className="btn btn-outline-warning"
                              title="Khóa/Mở"
                            >
                              <i className={`bi ${u.is_active ? 'bi-lock-fill' : 'bi-unlock-fill'}`}></i>
                            </button>
                          )}
                          {u.id !== 1 && (!currentUser || currentUser.id !== u.id) && (
                            <button
                              onClick={() => onDelete(u)}
                              className="btn btn-outline-danger"
                              title="Xóa"
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
