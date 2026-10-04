import React from 'react';

export default function AdminNavbar({
  onSync,
  currentUser,
  onLogout,
  shiftStatus,
  onCloseShift,
  onOpenShift,
  isProcessing,
  onOpenSettings,
  onOpenAnnouncement
}) {
  const isAdmin = Number(currentUser?.role) === 1 || currentUser?.role === 'admin';
  const isOpen = shiftStatus ? shiftStatus.is_open : true;
  const currentOrderSeq = shiftStatus?.current_order_seq || 0;
  const handleSettingsClick = onOpenSettings || onOpenAnnouncement;

  return (
    <nav className="navbar navbar-expand bg-white border-bottom px-4 py-2 justify-content-between shadow-xs">
      <div className="d-flex align-items-center gap-2">
        <span className="fw-bold text-dark fs-6">ADMINLTE</span>
      </div>

      <div className="d-flex align-items-center gap-2 gap-md-3">

        {isOpen ? (
          <div className="d-flex align-items-center gap-2">
            <span
              className="badge bg-success text-white px-2.5 py-2 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs rounded-2"
              style={{ color: '#ffffff' }}
            >
              <i className="bi bi-check-circle-fill"></i>
              <span>Ca #{shiftStatus?.shift_number || 1} • Đơn hôm nay: #{currentOrderSeq}</span>
            </span>
            <button
              disabled={isProcessing}
              onClick={onCloseShift}
              className="btn btn-danger btn-sm fw-bold shadow-xs d-flex align-items-center gap-1.5"
              title="Đóng máy kết thúc ngày làm việc"
            >
              <i className="bi bi-power"></i>
              <span>Đóng máy</span>
            </button>
          </div>
        ) : (
          <div className="d-flex align-items-center gap-2">
            <span
              className="badge bg-danger text-white px-2.5 py-2 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs rounded-2"
              style={{ color: '#ffffff' }}
            >
              <i className="bi bi-slash-circle-fill"></i>
              <span>Máy Đã Đóng</span>
            </span>
            <button
              disabled={isProcessing}
              onClick={onOpenShift}
              className="btn btn-success btn-sm fw-bold shadow-xs d-flex align-items-center gap-1.5"
              title="Mở máy bắt đầu ngày mới"
            >
              <i className="bi bi-play-circle-fill"></i>
              <span>Mở máy</span>
            </button>
          </div>
        )}

        {handleSettingsClick && (
          <button
            onClick={handleSettingsClick}
            className="btn btn-outline-secondary btn-sm text-dark fw-semibold d-none d-md-inline-flex align-items-center gap-1.5"
            title="Cài đặt hệ thống, hóa đơn & thông báo nhà hàng"
          >
            <i className="bi bi-gear-fill text-warning"></i>
            <span>Cài đặt</span>
          </button>
        )}

        <button onClick={onSync} className="btn btn-outline-primary btn-sm fw-semibold d-flex align-items-center gap-1">
          <i className="bi bi-arrow-repeat"></i>
          <span>Đồng bộ</span>
        </button>

        {currentUser && (
          <div className="d-flex align-items-center gap-2 ps-2 border-start">
            <div className="d-none d-md-block text-end">
              <div className="fw-bold text-dark small leading-tight">{currentUser.full_name}</div>
              <span className={`badge ${isAdmin ? 'bg-danger' : 'bg-primary'} text-xs`}>
                {isAdmin ? 'Admin' : 'Thu Ngân'}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="btn btn-outline-danger btn-sm"
              title="Đăng xuất"
            >
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
