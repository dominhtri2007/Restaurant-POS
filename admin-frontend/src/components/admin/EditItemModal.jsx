import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { toast } from '../../context/FeedbackContext';

export default function EditItemModal({ editingItem, products, onClose, onSuccess }) {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState('DONE');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setProductId(editingItem.product_id);
      setQuantity(editingItem.quantity || editingItem.total_quantity || 1);
      setPrice(editingItem.price || 0);
      setStatus(editingItem.status || 'DONE');
    }
  }, [editingItem]);

  if (!editingItem) return null;

  const handleProductChange = (newId) => {
    const cleanId = Number(newId);
    setProductId(cleanId);
    const prod = (products || []).find(p => p.id === cleanId);
    if (prod) setPrice(prod.price);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.updateOrderItem(editingItem.id, {
        product_id: Number(productId),
        quantity: Number(quantity) || 1,
        price: Number(price) || 0,
        status
      });
      if (res.success) {
        toast.success('Đã cập nhật món thành công');
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Cập nhật thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối khi cập nhật món');
    } finally {
      setLoading(false);
    }
  };

  const lineTotal = (Number(quantity) || 1) * (Number(price) || 0);

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow border-0 rounded-4 overflow-hidden">
          <div className="modal-header bg-primary text-white py-2.5 px-3">
            <h6 className="modal-title fw-bold mb-0">
              <i className="bi bi-pencil-square me-1.5"></i> Chỉnh Sửa Món
            </h6>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-3">
              <div className="mb-2">
                <label className="form-label small fw-bold mb-1">Món ăn:</label>
                <select
                  className="form-select form-select-sm"
                  value={productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  required
                >
                  {(products || []).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {Number(p.price).toLocaleString('vi-VN')} đ
                    </option>
                  ))}
                </select>
              </div>

              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label className="form-label small fw-bold mb-1">Số lượng:</label>
                  <div className="input-group input-group-sm">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
                    <input
                      type="number"
                      className="form-control text-center fw-bold"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      required
                    />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setQuantity(q => q + 1)}>+</button>
                  </div>
                </div>

                <div className="col-6">
                  <label className="form-label small fw-bold mb-1">Đơn giá (đ):</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min="0"
                    step="1000"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div className="bg-light p-2 rounded border small d-flex justify-content-between align-items-center">
                <span>Thành tiền:</span>
                <span className="fw-bold text-danger fs-6">{lineTotal.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="modal-footer bg-light py-2 px-3 border-0">
              <button type="button" className="btn btn-sm btn-secondary" onClick={onClose} disabled={loading}>Hủy</button>
              <button type="submit" className="btn btn-sm btn-primary fw-bold px-3" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
