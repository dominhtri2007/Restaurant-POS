import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import AddTableModal from './AddTableModal';
import EditTableModal from './EditTableModal';
import TableQRCard from './TableQRCard';
import { confirmDialog, toast } from '../../context/FeedbackContext';

export default function AdminTableQRs() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [editName, setEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await api.getTablesWithQR();
      if (res.success) setTables(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handlePrintAll = () => window.print();

  const handlePrintSingle = (table) => {
    const w = window.open('', '_blank', 'width=600,height=700');
    if (!w) return;
    const qrSrc = table.qr_data_url || table.qr_image_url;
    const customerBaseUrl = process.env.REACT_APP_CUSTOMER_URL || (
      typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? `${window.location.protocol}//${window.location.hostname}:${process.env.REACT_APP_CUSTOMER_PORT || 3000}`
        : (typeof window !== 'undefined' ? window.location.origin : '')
    );
    const url = table.qr_target_url || `${customerBaseUrl}/scan/${table.id}`;
    w.document.write(`<!DOCTYPE html><html><head><title>QR - ${table.name}</title><style>body{font-family:sans-serif;text-align:center;padding:40px}.box{border:2px dashed #0d6efd;border-radius:12px;padding:24px;display:inline-block}img{width:240px;height:240px}</style></head><body><div class="box"><h2>${table.name}</h2><p>Quét mã QR để gọi món</p><img src="${qrSrc}" /><p><small>${url}</small></p></div><script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}</script></body></html>`);
    w.document.close();
  };

  const handleCreateSuccess = async (payload) => {
    const res = await api.createTable(payload);
    if (!res.success) throw new Error(res.message || 'Lỗi khi tạo bàn');
    toast.success(res.message || 'Tạo bàn thành công!');
    await fetchTables();
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setIsUpdating(true);
    try {
      const res = await api.updateTable(editingTable.id, { name: editName.trim() });
      if (res.success) {
        toast.success('Đã cập nhật tên bàn thành công');
        setEditingTable(null);
        await fetchTables();
      } else {
        toast.error(res.message || 'Không thể đổi tên bàn.');
      }
    } catch (err) {
      toast.error('Lỗi cập nhật tên bàn.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTable = async (table) => {
    if (table.status !== 'EMPTY') {
      toast.warning(`Bàn "${table.name}" đang có khách hoặc phiên chưa kết thúc.`);
      return;
    }
    const ok = await confirmDialog({
      title: 'Xoá bàn',
      message: `Bạn có chắc chắn muốn xóa bàn "${table.name}"?`,
      type: 'danger',
      confirmText: 'Xoá bàn',
      cancelText: 'Huỷ'
    });
    if (!ok) return;

    try {
      const res = await api.deleteTable(table.id);
      if (res.success) {
        toast.success(`Đã xoá bàn "${table.name}"`);
        await fetchTables();
      } else {
        toast.error(res.message || 'Không thể xóa bàn.');
      }
    } catch (err) {
      toast.error('Lỗi khi xóa bàn.');
    }
  };

  const filtered = tables.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold mb-1 text-primary">
            <i className="bi bi-qr-code-scan me-2"></i> MÃ QR RIÊNG TỪNG BÀN
          </h5>
          <small className="text-muted">Quản lý bàn và in mã QR cho khách quét tự gọi món.</small>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => setShowAddModal(true)} className="btn btn-success fw-bold">
            <i className="bi bi-plus-circle me-1"></i> Thêm Bàn Mới
          </button>
          <button onClick={handlePrintAll} disabled={tables.length === 0} className="btn btn-primary fw-bold">
            <i className="bi bi-printer-fill me-1"></i> In Toàn Bộ ({tables.length})
          </button>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4 bg-white">
        <div className="card-body py-2 px-3 d-flex justify-content-between align-items-center w-100">
          <input
            type="text"
            className="form-control form-control-sm w-auto"
            style={{ minWidth: 260 }}
            placeholder="Tìm theo tên bàn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="text-muted small ms-auto">
            Hiển thị: <strong>{filtered.length}</strong> / {tables.length} bàn
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5 text-muted">Đang tải mã QR...</div>
      ) : tables.length === 0 ? (
        <div className="card border-0 shadow-sm p-5 text-center bg-white">
          <div className="text-muted mb-2 fs-1"><i className="bi bi-inbox"></i></div>
          <h5 className="fw-bold">Chưa có bàn ăn nào trong hệ thống!</h5>
          <p className="text-muted mb-3">Bấm nút bên dưới để tạo bàn và mã QR tự động.</p>
          <div>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary px-4 fw-bold">
              <i className="bi bi-plus-circle me-1"></i> Thêm Bàn Đầu Tiên
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {filtered.map((table) => (
            <TableQRCard
              key={table.id}
              table={table}
              onEdit={(tb) => { setEditingTable(tb); setEditName(tb.name); }}
              onDelete={handleDeleteTable}
              onPrintSingle={handlePrintSingle}
            />
          ))}
        </div>
      )}

      <AddTableModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={handleCreateSuccess} />
      <EditTableModal isOpen={!!editingTable} tableName={editName} onChangeName={setEditName} onClose={() => setEditingTable(null)} onSave={handleSaveEdit} isUpdating={isUpdating} />
    </div>
  );
}
