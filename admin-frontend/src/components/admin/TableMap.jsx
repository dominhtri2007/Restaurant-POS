import React from 'react';

export default function TableMap({ tables, onSelectTable }) {
  const getTableMeta = (displayStatus) => {
    switch (displayStatus) {
      case 'SERVED':
        return {
          cardClass: 'border-success bg-success bg-opacity-10 text-success',
          badgeClass: 'bg-success text-white',
          label: 'Đã lên đủ món',
          icon: 'bi-check-all'
        };
      case 'IN_USE':
        return {
          cardClass: 'border-warning bg-warning bg-opacity-10 text-dark',
          badgeClass: 'bg-warning text-dark',
          label: 'Đang có khách',
          icon: 'bi-people-fill'
        };
      case 'EMPTY':
      default:
        return {
          cardClass: 'border-secondary border-opacity-25 bg-white text-muted',
          badgeClass: 'bg-light text-secondary border',
          label: 'Bàn trống',
          icon: 'bi-dash-circle'
        };
    }
  };

  return (
    <div className="card card-outline card-primary shadow-sm h-100 mb-0">
      <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h3 className="card-title text-primary fw-bold m-0 fs-6">
          <i className="bi bi-grid-3x3-gap-fill me-2"></i>
          SƠ ĐỒ BÀN NHÀ HÀNG
        </h3>

        <div className="d-flex align-items-center gap-3 small fw-semibold">
          <span className="d-inline-flex align-items-center">
            <span className="d-inline-block rounded me-1 border" style={{ width: 12, height: 12, backgroundColor: '#fff' }}></span>
            Trống
          </span>
          <span className="d-inline-flex align-items-center">
            <span className="d-inline-block rounded me-1 bg-warning" style={{ width: 12, height: 12 }}></span>
            Đang phục vụ
          </span>
          <span className="d-inline-flex align-items-center">
            <span className="d-inline-block rounded me-1 bg-success" style={{ width: 12, height: 12 }}></span>
            Lên đủ món
          </span>
        </div>
      </div>

      <div className="card-body p-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 310px)' }}>
        {tables.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-inbox fs-1 d-block mb-2"></i>
            <h6 className="fw-bold">Chưa có bàn nào trong sơ đồ</h6>
            <p className="small mb-0">Vui lòng vào mục "Mã QR bàn ăn" để thêm bàn mới.</p>
          </div>
        ) : (
          <div className="row g-3">
            {tables.map((table) => {
            const meta = getTableMeta(table.displayStatus || table.status);
            const isClickable = true;

            return (
              <div key={table.id} className="col-6 col-md-4 col-xl-3">
                <div
                  onClick={() => onSelectTable(table)}
                  className={`card h-100 border-2 rounded-3 transition-all ${meta.cardClass} cursor-pointer shadow-sm hover-shadow-md`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-body p-3 d-flex flex-column justify-content-between">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="fw-bold mb-0 fs-6 text-dark">{table.name}</h5>
                      <span className={`badge ${meta.badgeClass} rounded-pill fs-8 px-2 py-1`}>
                        <i className={`bi ${meta.icon} me-1`}></i>
                        {meta.label}
                      </span>
                    </div>

                    {table.status !== 'EMPTY' ? (
                      <div className="small mt-2 pt-2 border-top border-light">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted">Tạm tính:</span>
                          <span className="fw-bold text-danger fs-6">
                            {Number(table.current_total || 0).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                        <div className="text-center mt-2">
                          <span className="badge bg-primary bg-opacity-10 text-primary small px-2 py-1">
                            Xem
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3 text-muted small">
                        Bàn sẵn sàng
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
