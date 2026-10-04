import React, { useState } from 'react';

export default function AddTableModal({ isOpen, onClose, onSuccess }) {
  const [addMode, setAddMode] = useState('single');
  const [singleName, setSingleName] = useState('');
  const [batchPrefix, setBatchPrefix] = useState('Bàn');
  const [batchFrom, setBatchFrom] = useState(1);
  const [batchTo, setBatchTo] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      let payload;
      if (addMode === 'single') {
        if (!singleName.trim()) {
          setErrorMsg('Vui lòng nhập tên bàn.');
          setIsSubmitting(false);
          return;
        }
        payload = { name: singleName.trim() };
      } else {
        const from = parseInt(batchFrom, 10);
        const to = parseInt(batchTo, 10);
        if (isNaN(from) || isNaN(to) || from > to || from < 1 || to - from > 50) {
          setErrorMsg('Dải số không hợp lệ (từ 1 đến 999, tối đa 50 bàn).');
          setIsSubmitting(false);
          return;
        }
        payload = { batch_prefix: batchPrefix, batch_from: from, batch_to: to };
      }

      await onSuccess(payload);
      setSingleName('');
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi tạo bàn');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-primary text-white py-2">
            <h5 className="modal-title fw-bold fs-6">
              <i className="bi bi-plus-circle me-2"></i> Thêm Bàn Ăn Mới
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-3">
            {errorMsg && (
              <div className="alert alert-danger py-1 px-2 small mb-2">{errorMsg}</div>
            )}

            <div className="btn-group w-100 mb-3" role="group">
              <button
                type="button"
                className={`btn btn-sm ${addMode === 'single' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setAddMode('single')}
              >
                Tạo từng bàn
              </button>
              <button
                type="button"
                className={`btn btn-sm ${addMode === 'batch' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setAddMode('batch')}
              >
                Tạo hàng loạt
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {addMode === 'single' ? (
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Tên bàn</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Ví dụ: Bàn 09, Bàn VIP..."
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              ) : (
                <div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Tiền tố tên bàn</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={batchPrefix}
                      onChange={(e) => setBatchPrefix(e.target.value)}
                      required
                    />
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Từ số</label>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        className="form-control form-control-sm"
                        value={batchFrom}
                        onChange={(e) => setBatchFrom(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Đến số</label>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        className="form-control form-control-sm"
                        value={batchTo}
                        onChange={(e) => setBatchTo(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-sm btn-light" onClick={onClose} disabled={isSubmitting}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-sm btn-primary fw-bold" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang lưu...' : 'Tạo bàn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
