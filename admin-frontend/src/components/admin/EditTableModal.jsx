import React from 'react';

export default function EditTableModal({ isOpen, tableName, onChangeName, onClose, onSave, isUpdating }) {
  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-warning text-dark py-2">
            <h6 className="modal-title fw-bold">Đổi Tên Bàn</h6>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={onSave}>
            <div className="modal-body p-3">
              <label className="form-label small fw-semibold">Tên bàn mới</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={tableName}
                onChange={(e) => onChangeName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="modal-footer py-2">
              <button type="button" className="btn btn-sm btn-light" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="btn btn-sm btn-warning fw-bold" disabled={isUpdating}>
                {isUpdating ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
