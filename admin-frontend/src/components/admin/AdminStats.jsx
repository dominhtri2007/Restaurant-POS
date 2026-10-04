import React from 'react';

export default function AdminStats({ tables = [] }) {
  const totalTables = tables.length;
  const totalEmpty = tables.filter((t) => t.status === 'EMPTY').length;
  const totalInUse = tables.filter((t) => t.status === 'IN_USE').length;
  const totalServed = tables.filter((t) => t.displayStatus === 'SERVED').length;

  return (
    <div className="row g-3 mb-4">
      <div className="col-6 col-lg-3">
        <div className="card bg-primary text-white shadow-xs border-0 rounded-3">
          <div className="card-body p-3 d-flex justify-content-between align-items-center">
            <div>
              <h3 className="fw-bold mb-0">{totalTables}</h3>
              <div className="small opacity-85">Tổng Số Bàn</div>
            </div>
            <i className="bi bi-grid-3x3-gap-fill fs-1 opacity-50"></i>
          </div>
        </div>
      </div>

      <div className="col-6 col-lg-3">
        <div className="card bg-info text-white shadow-xs border-0 rounded-3">
          <div className="card-body p-3 d-flex justify-content-between align-items-center">
            <div>
              <h3 className="fw-bold mb-0">{totalEmpty}</h3>
              <div className="small opacity-85">Bàn Trống</div>
            </div>
            <i className="bi bi-grid fs-1 opacity-50"></i>
          </div>
        </div>
      </div>

      <div className="col-6 col-lg-3">
        <div className="card bg-warning text-dark shadow-xs border-0 rounded-3">
          <div className="card-body p-3 d-flex justify-content-between align-items-center">
            <div>
              <h3 className="fw-bold mb-0">{totalInUse}</h3>
              <div className="small fw-semibold">Đang Có Khách</div>
            </div>
            <i className="bi bi-people-fill fs-1 opacity-50"></i>
          </div>
        </div>
      </div>

      <div className="col-6 col-lg-3">
        <div className="card bg-success text-white shadow-xs border-0 rounded-3">
          <div className="card-body p-3 d-flex justify-content-between align-items-center">
            <div>
              <h3 className="fw-bold mb-0">{totalServed}</h3>
              <div className="small opacity-85">Đã Lên Đủ Món</div>
            </div>
            <i className="bi bi-check2-all fs-1 opacity-50"></i>
          </div>
        </div>
      </div>
    </div>
  );
}
