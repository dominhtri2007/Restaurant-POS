import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import AddItemModal from './AddItemModal';
import EditItemModal from './EditItemModal';
import { confirmDialog, toast } from '../../context/FeedbackContext';

export default function TableDetailModal({ table, currentUser, onClose, onClearTable, onMarkServed, isProcessing }) {
  const [orderDetails, setOrderDetails] = useState({ orders: [], itemsSummary: [], allItems: [] });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const reloadData = async () => {
    if (!table?.id) return;
    try {
      const res = await api.getTableOrders(table.id);
      if (res?.success) {
        setOrderDetails({
          orders: res.data.orders || [],
          itemsSummary: res.data.itemsSummary || [],
          allItems: res.data.allItems || []
        });
      }
    } catch (err) {
      console.error('Lỗi tải lại món:', err);
    }
  };

  useEffect(() => {
    if (!table?.id) return;
    setLoading(true);
    Promise.all([
      api.getTableOrders(table.id),
      api.getProducts().catch(() => ({ success: false, data: [] }))
    ])
      .then(([orderRes, prodRes]) => {
        if (orderRes?.success) {
          setOrderDetails({
            orders: orderRes.data.orders || [],
            itemsSummary: orderRes.data.itemsSummary || [],
            allItems: orderRes.data.allItems || []
          });
        }
        if (prodRes?.success && Array.isArray(prodRes.data)) {
          setProducts(prodRes.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [table?.id]);

  if (!table) return null;

  const displayItems = (orderDetails.allItems && orderDetails.allItems.length > 0)
    ? orderDetails.allItems
    : orderDetails.itemsSummary;

  const totalCalculated = displayItems.reduce(
    (sum, it) => sum + Number(it.line_total || it.total_price || (it.price * (it.quantity || it.total_quantity || 1))),
    0
  ) || Number(table.current_total || 0);

  const handleQuickQuantity = async (item, newQty) => {
    if (!item?.id || actionLoading) return;
    if (newQty <= 0) {
      const confirmDelete = await confirmDialog({
        title: 'Xoá món khỏi bàn',
        message: `Bạn có chắc muốn xoá món "${item.product_name}" khỏi bàn?`,
        type: 'danger',
        confirmText: 'Xoá món',
        cancelText: 'Huỷ'
      });
      if (!confirmDelete) return;
      setActionLoading(true);
      try {
        const res = await api.deleteOrderItem(item.id);
        if (res.success) {
          toast.success('Đã xoá món khỏi bàn');
          await reloadData();
        } else {
          toast.error(res.message || 'Xoá món thất bại');
        }
      } catch {
        toast.error('Lỗi khi xoá món');
      } finally {
        setActionLoading(false);
      }
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.updateOrderItem(item.id, { quantity: newQty });
      if (res.success) {
        await reloadData();
      } else {
        toast.error(res.message || 'Cập nhật thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối khi cập nhật');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!item?.id || actionLoading) return;
    const confirmDelete = await confirmDialog({
      title: 'Xoá món khỏi bàn',
      message: `Xác nhận xoá món "${item.product_name}" khỏi bàn?`,
      type: 'danger',
      confirmText: 'Xoá món',
      cancelText: 'Huỷ'
    });
    if (!confirmDelete) return;

    setActionLoading(true);
    try {
      const res = await api.deleteOrderItem(item.id);
      if (res.success) {
        toast.success('Đã xoá món khỏi bàn');
        await reloadData();
      } else {
        toast.error(res.message || 'Xoá món không thành công');
      }
    } catch {
      toast.error('Lỗi kết nối khi xoá món');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          <div className="modal-header bg-dark text-white px-4 py-3">
            <h5 className="modal-title fw-bold mb-0">
              <i className="bi bi-grid-3x3-gap-fill text-warning me-2"></i>
              Chi Tiết Bàn: {table.name}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            <div className="row g-2 mb-3">
              <div className="col-4">
                <div className="bg-light p-2 rounded border">
                  <small className="text-secondary d-block">Phiên:</small>
                  <span className="fw-bold">#{table.current_session_id || 'Trống'}</span>
                </div>
              </div>
              <div className="col-4">
                <div className="bg-light p-2 rounded border">
                  <small className="text-secondary d-block">Trạng thái:</small>
                  <span className={`badge ${table.displayStatus === 'SERVED' ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {table.displayStatus === 'SERVED' ? 'Đã lên đủ món' : 'Đang phục vụ'}
                  </span>
                </div>
              </div>
              <div className="col-4">
                <div className="bg-light p-2 rounded border">
                  <small className="text-secondary d-block">Giờ vào:</small>
                  <span className="fw-bold">
                    {table.start_time ? new Date(table.start_time).toLocaleTimeString('vi-VN') : 'Mới vào'}
                  </span>
                </div>
              </div>
            </div>

            {orderDetails.orders.some((o) => o.customer_name || o.staff_name || o.customer_phone || o.note) && (() => {
              const staffOrder = orderDetails.orders.find((o) => o.order_source === 'STAFF' || o.staff_name);
              const custOrder = orderDetails.orders.find((o) => o.customer_name && o.customer_name !== 'Tại bàn');
              const anyPhone = orderDetails.orders.find((o) => o.customer_phone)?.customer_phone;
              const anyNote = orderDetails.orders.find((o) => o.note)?.note;
              const isStaff = Boolean(staffOrder && staffOrder.staff_name);
              const staffName = staffOrder?.staff_name || 'Nhân viên';
              const customerName = custOrder?.customer_name;

              return (
                <div className="bg-light p-2.5 rounded-3 border mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      {isStaff ? (
                        <div>
                          <small className="text-secondary d-block fw-semibold" style={{ fontSize: '12px' }}>Nhân viên:</small>
                          <div className="fw-bold text-dark fs-6 d-flex align-items-center gap-1.5">
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                              <i className="bi bi-person-badge-fill me-1"></i> {staffName}
                            </span>
                          </div>
                          {customerName && (
                            <small className="text-muted d-block mt-1">
                              Khách: <strong className="text-dark">{customerName}</strong> {anyPhone ? `- ${anyPhone}` : ''}
                            </small>
                          )}
                        </div>
                      ) : (
                        <div>
                          <small className="text-secondary d-block fw-semibold" style={{ fontSize: '12px' }}>Khách hàng:</small>
                          <span className="fw-bold text-dark fs-6">
                            👤 {customerName || 'Khách vãng lai'}
                            {anyPhone ? ` - ${anyPhone}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    {anyNote && (
                      <div className="text-end small">
                        <span className="badge bg-warning text-dark">
                          Ghi chú: {anyNote}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="card border rounded-3 mb-3 overflow-hidden shadow-none">
              <div className="card-header bg-light py-2 px-3 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold small text-secondary">
                    <i className="bi bi-receipt me-1"></i>DANH SÁCH MÓN ĐÃ ORDER
                  </span>
                  <span className="badge bg-secondary">{displayItems.length} món</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  disabled={isProcessing || actionLoading}
                  className="btn btn-sm btn-success fw-bold d-flex align-items-center gap-1 shadow-xs px-2.5 py-1 rounded-2"
                >
                  <i className="bi bi-plus-circle-fill"></i>
                  <span>Thêm Món</span>
                </button>
              </div>
              <div className="card-body p-0" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                {loading ? (
                  <div className="text-center py-3 text-secondary small">
                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                    Đang tải chi tiết món...
                  </div>
                ) : displayItems.length === 0 ? (
                  <div className="text-center py-4 text-muted small">
                    <i className="bi bi-cart-x fs-3 d-block mb-1 opacity-50"></i>
                    Chưa có món nào được gọi trong phiên này.
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-sm btn-outline-success fw-bold"
                      >
                        <i className="bi bi-plus-lg me-1"></i> Thêm món vào bàn
                      </button>
                    </div>
                  </div>
                ) : (
                  <table className="table table-sm table-hover align-middle mb-0">
                    <thead className="table-light small text-secondary sticky-top">
                      <tr>
                        <th className="ps-3" style={{ width: '42%' }}>Tên Món</th>
                        <th className="text-center" style={{ width: '22%' }}>SL</th>
                        <th className="text-end" style={{ width: '15%' }}>Đơn Giá</th>
                        <th className="text-end" style={{ width: '15%' }}>Thành Tiền</th>
                        <th className="text-center pe-3" style={{ width: '6%' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayItems.map((item, idx) => {
                        const qty = item.quantity || item.total_quantity || 1;
                        const lineTotal = item.line_total || item.total_price || (item.price * qty);
                        const isDone = item.status === 'DONE';

                        return (
                          <tr key={item.id || idx}>
                            <td className="ps-3">
                              <div className="fw-semibold text-dark d-flex align-items-center gap-1.5">
                                <span>{item.product_name}</span>
                                {item.status && (
                                  <span
                                    className={`badge rounded-pill ${isDone ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'}`}
                                    style={{ fontSize: '10px' }}
                                  >
                                    {isDone ? '✓ Đã lên' : '⏳ Chờ bếp'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="text-center">
                              {item.id ? (
                                <div className="d-inline-flex align-items-center bg-light border rounded-pill shadow-xs p-0.5">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary border-0 rounded-circle p-0 d-flex align-items-center justify-content-center"
                                    style={{ width: '22px', height: '22px' }}
                                    title="Giảm 1"
                                    disabled={actionLoading || isProcessing}
                                    onClick={() => handleQuickQuantity(item, qty - 1)}
                                  >
                                    <i className="bi bi-dash fw-bold"></i>
                                  </button>
                                  <span className="fw-bold px-2 text-dark small" style={{ minWidth: '22px', textAlign: 'center' }}>
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary border-0 rounded-circle p-0 d-flex align-items-center justify-content-center"
                                    style={{ width: '22px', height: '22px' }}
                                    title="Tăng 1"
                                    disabled={actionLoading || isProcessing}
                                    onClick={() => handleQuickQuantity(item, qty + 1)}
                                  >
                                    <i className="bi bi-plus fw-bold"></i>
                                  </button>
                                </div>
                              ) : (
                                <span className="badge bg-primary rounded-pill">x{qty}</span>
                              )}
                            </td>
                            <td className="text-end small">{Number(item.price).toLocaleString('vi-VN')} đ</td>
                            <td className="text-end fw-bold text-danger">
                              {Number(lineTotal).toLocaleString('vi-VN')} đ
                            </td>
                            <td className="text-center pe-3">
                              {item.id ? (
                                <div className="d-flex align-items-center justify-content-center gap-1">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary border-0 p-1"
                                    title="Chỉnh sửa món"
                                    disabled={actionLoading || isProcessing}
                                    onClick={() => setEditingItem(item)}
                                  >
                                    <i className="bi bi-pencil-square"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger border-0 p-1"
                                    title="Xoá món khỏi bàn"
                                    disabled={actionLoading || isProcessing}
                                    onClick={() => handleDeleteItem(item)}
                                  >
                                    <i className="bi bi-trash3-fill"></i>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted small">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="alert alert-danger d-flex justify-content-between align-items-center mb-0 p-3">
              <div>
                <span className="fw-bold d-block">TỔNG TIỀN THANH TOÁN:</span>
                <small className="opacity-75">Bao gồm toàn bộ đơn trong phiên</small>
              </div>
              <span className="fs-4 fw-bold">
                {totalCalculated.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          <div className="modal-footer bg-light px-4 py-3 d-flex justify-content-between border-0">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isProcessing}>
              Đóng
            </button>
            <div className="d-flex gap-2">
              {table.displayStatus !== 'SERVED' && (
                <button
                  disabled={isProcessing}
                  onClick={() => onMarkServed(table.id)}
                  className="btn btn-outline-success fw-bold"
                >
                  <i className="bi bi-check2-all me-1"></i> Báo Đã Lên Đủ Món
                </button>
              )}
              <button
                disabled={isProcessing}
                onClick={() => onClearTable(table.id, false, currentTotal, 'CASH')}
                className="btn btn-danger fw-bold shadow-sm d-flex align-items-center gap-1.5"
                title="Xác nhận thanh toán và dọn bàn"
              >
                <i className="bi bi-cash-coin fs-6"></i>
                <span>Thanh Toán & Dọn Bàn</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddItemModal
          show={showAddModal}
          table={table}
          products={products}
          onClose={() => setShowAddModal(false)}
          onSuccess={reloadData}
        />
      )}

      {editingItem && (
        <EditItemModal
          editingItem={editingItem}
          products={products}
          onClose={() => setEditingItem(null)}
          onSuccess={reloadData}
        />
      )}
    </div>
  );
}
