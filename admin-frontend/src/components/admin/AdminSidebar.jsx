import React from 'react';

export default function AdminSidebar({ activeTab, onSelectTab, currentUser, onLogout }) {
  const isAdmin = Number(currentUser?.role) === 1 || currentUser?.role === 'admin';
  const userPerms = Array.isArray(currentUser?.permissions) ? currentUser.permissions : [];
  const canAccess = (perm) => isAdmin || userPerms.includes(perm) || userPerms.includes('all');

  return (
    <aside
      className="bg-dark text-white shadow d-flex flex-column flex-shrink-0"
      style={{
        width: '260px',
        minWidth: '260px',
        maxWidth: '260px',
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}
    >
      <div className="p-3 border-bottom border-secondary d-flex align-items-center gap-2">
        <img
          src="/adminlte/assets/img/AdminLTELogo.png"
          alt="Logo"
          className="rounded-circle"
          style={{ width: 32, height: 32 }}
        />
        <span className="fw-bold fs-5 text-white">AdminLTE POS</span>
      </div>

      <div className="p-3 border-bottom border-secondary d-flex align-items-center gap-2">
        <img
          src="/adminlte/assets/img/avatar.png"
          alt="User"
          className="rounded-circle border"
          style={{ width: 36, height: 36 }}
        />
        <div className="overflow-hidden flex-grow-1">
          <div className="fw-semibold text-white small text-truncate">
            {currentUser?.full_name || 'Thu Ngân Quán'}
          </div>
          <div className="d-flex align-items-center gap-1.5 mt-0.5">
            <span className={`badge ${isAdmin ? 'bg-danger' : 'bg-primary'} text-[10px] px-1.5 py-0.5`}>
              {isAdmin ? 'Quản trị' : 'Nhân viên'}
            </span>
            <small className="text-success d-inline-flex align-items-center gap-1 text-[11px]">
              <i className="bi bi-circle-fill" style={{ fontSize: 7 }}></i> Online
            </small>
          </div>
        </div>
      </div>

      <div className="p-2 flex-grow-1">
        <ul className="nav flex-column gap-1">
          {canAccess('pos') && (
            <li className="nav-item">
              <button
                onClick={() => onSelectTab('pos')}
                className={`btn nav-link text-start w-100 d-flex align-items-center gap-2 px-3 py-2.5 rounded ${
                  activeTab === 'pos' ? 'bg-primary text-white fw-bold' : 'text-secondary'
                }`}
              >
                <i className="bi bi-grid-3x3-gap-fill fs-5"></i>
                <span>Sơ Đồ Bàn & POS</span>
              </button>
            </li>
          )}

          {canAccess('reports') && (
            <li className="nav-item">
              <button
                onClick={() => onSelectTab('reports')}
                className={`btn nav-link text-start w-100 d-flex align-items-center gap-2 px-3 py-2.5 rounded ${
                  activeTab === 'reports' ? 'bg-primary text-white fw-bold' : 'text-secondary'
                }`}
              >
                <i className="bi bi-graph-up-arrow fs-5"></i>
                <span>Báo Cáo Doanh Thu</span>
              </button>
            </li>
          )}

          {canAccess('menu') && (
            <li className="nav-item">
              <button
                onClick={() => onSelectTab('menu')}
                className={`btn nav-link text-start w-100 d-flex align-items-center gap-2 px-3 py-2.5 rounded ${
                  activeTab === 'menu' ? 'bg-primary text-white fw-bold' : 'text-secondary'
                }`}
              >
                <i className="bi bi-journal-bookmark-fill fs-5"></i>
                <span>Quản Lý Thực Đơn</span>
              </button>
            </li>
          )}

          {canAccess('qrcodes') && (
            <li className="nav-item">
              <button
                onClick={() => onSelectTab('qrcodes')}
                className={`btn nav-link text-start w-100 d-flex align-items-center gap-2 px-3 py-2.5 rounded ${
                  activeTab === 'qrcodes' ? 'bg-primary text-white fw-bold' : 'text-secondary'
                }`}
              >
                <i className="bi bi-qr-code fs-5"></i>
                <span>In Mã QR Từng Bàn</span>
              </button>
            </li>
          )}

          {canAccess('users') && (
            <li className="nav-item">
              <button
                onClick={() => onSelectTab('users')}
                className={`btn nav-link text-start w-100 d-flex align-items-center gap-2 px-3 py-2.5 rounded ${
                  activeTab === 'users' ? 'bg-primary text-white fw-bold' : 'text-secondary'
                }`}
              >
                <i className="bi bi-people-fill fs-5"></i>
                <span>Quản Lý Nhân Viên</span>
              </button>
            </li>
          )}

        </ul>
      </div>

      <div className="p-3 border-top border-secondary">
        <button
          onClick={onLogout}
          className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
          title="Đăng xuất"
        >
          <i className="bi bi-box-arrow-right"></i>
          <span>Đăng Xuất</span>
        </button>
      </div>
    </aside>
  );
}
