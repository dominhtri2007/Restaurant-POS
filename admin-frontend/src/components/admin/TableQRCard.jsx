import React from 'react';

export default function TableQRCard({ table, onEdit, onDelete, onPrintSingle }) {
  const customerBaseUrl = process.env.REACT_APP_CUSTOMER_URL || (
    typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? `${window.location.protocol}//${window.location.hostname}:${process.env.REACT_APP_CUSTOMER_PORT || 3000}`
      : (typeof window !== 'undefined' ? window.location.origin : '')
  );
  const directUrl = table.qr_target_url || `${customerBaseUrl}/scan/${table.id}`;
  const qrSrc = table.qr_data_url || table.qr_image_url || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(directUrl)}`;

  return (
    <div className="col-12 col-sm-6 col-md-4 col-lg-3">
      <div className="card text-center shadow-sm border-2 border-primary border-opacity-25 rounded-3 p-3 h-100 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="badge bg-primary fs-6 px-3 py-1 rounded-pill">{table.name}</span>
          <div className="d-flex gap-1">
            <button
              onClick={() => onEdit(table)}
              className="btn btn-sm btn-outline-warning p-1"
              title="Đổi tên bàn"
            >
              <i className="bi bi-pencil"></i>
            </button>
            <button
              onClick={() => onDelete(table)}
              disabled={table.status !== 'EMPTY'}
              className="btn btn-sm btn-outline-danger p-1"
              title={table.status !== 'EMPTY' ? 'Không thể xóa bàn đang hoạt động' : 'Xóa bàn'}
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <div className="d-flex justify-content-center my-2 p-2 bg-light rounded border">
          <img
            src={qrSrc}
            alt={`QR ${table.name}`}
            className="img-fluid rounded"
            style={{ width: '160px', height: '160px', objectFit: 'contain' }}
          />
        </div>

        <div className="small text-muted text-truncate mb-3" title={directUrl}>
          <code>{directUrl}</code>
        </div>

        <div className="mt-auto d-flex gap-2">
          <a
            href={directUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline-primary btn-sm flex-grow-1"
          >
            <i className="bi bi-box-arrow-up-right me-1"></i> Quét Thử
          </a>
          <button
            onClick={() => onPrintSingle(table)}
            className="btn btn-outline-dark btn-sm"
            title="In mã QR này"
          >
            <i className="bi bi-printer"></i>
          </button>
          <a
            href={qrSrc}
            download={`QR_${table.name.replace(/\s+/g, '_')}.png`}
            className="btn btn-outline-secondary btn-sm"
            title="Tải ảnh QR"
          >
            <i className="bi bi-download"></i>
          </a>
        </div>
      </div>
    </div>
  );
}
