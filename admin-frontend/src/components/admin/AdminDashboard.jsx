import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import TableMap from './TableMap';
import TableDetailModal from './TableDetailModal';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import AdminStats from './AdminStats';
import AdminReports from './AdminReports';
import AdminTableQRs from './AdminTableQRs';
import AdminUsers from './AdminUsers';
import AdminMenuManagement from './AdminMenuManagement';
import AdminLogin from './AdminLogin';
import { confirmDialog, alertDialog, toast } from '../../context/FeedbackContext';

export default function AdminDashboard({ currentUser: propUser, onLogout: propLogout }) {
  const [currentUser, setCurrentUser] = useState(() => {
    if (propUser) return propUser;
    try {
      const saved = localStorage.getItem('pos_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (propUser !== undefined) {
      setCurrentUser(propUser);
    }
  }, [propUser]);

  const isAdmin = Number(currentUser?.role) === 1 || currentUser?.role === 'admin';
  const userPerms = Array.isArray(currentUser?.permissions) ? currentUser.permissions : [];
  const canAccess = (perm) => isAdmin || userPerms.includes(perm) || userPerms.includes('all');

  const getDefaultTab = () => {
    if (canAccess('pos')) return 'pos';
    if (canAccess('reports')) return 'reports';
    if (canAccess('menu')) return 'menu';
    if (canAccess('qrcodes')) return 'qrcodes';
    if (canAccess('users')) return 'users';
    return 'pos';
  };

  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState(getDefaultTab);

  const handleSelectTab = (tab) => {
    if (canAccess(tab)) {
      setActiveTab(tab);
    } else {
      toast.warning('Bạn không có quyền truy cập chức năng này.');
    }
  };

  const [shiftStatus, setShiftStatus] = useState(null);

  const handleLogout = () => {
    if (propLogout) {
      propLogout();
    } else {
      localStorage.removeItem('pos_admin_token');
      localStorage.removeItem('pos_admin_user');
      setCurrentUser(null);
    }
  };

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      const tablesRes = await api.getTables();
      if (tablesRes.success) setTables(tablesRes.data);
    } catch (err) {
      console.error('Lỗi Admin:', err);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchData();

    const handleTableChanged = () => {
      api.getTables().then((res) => res.success && setTables(res.data));
    };

    api.getShiftStatus().then((res) => {
      if (res.success) setShiftStatus(res.data);
    }).catch(console.error);

    const handlePosStatus = () => {
      api.getShiftStatus().then((res) => {
        if (res.success) setShiftStatus(res.data);
      }).catch(console.error);
    };

    socket.on('pos_status_changed', handlePosStatus);
    socket.on('new_order', handleTableChanged);
    socket.on('table_status_changed', handleTableChanged);
    socket.on('table_cleared', handleTableChanged);

    return () => {
      socket.off('new_order', handleTableChanged);
      socket.off('table_status_changed', handleTableChanged);
      socket.off('table_cleared', handleTableChanged);
      socket.off('pos_status_changed', handlePosStatus);
    };
  }, [currentUser]);

  if (!currentUser) {
    return <AdminLogin onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const handleMarkServed = async (tableId) => {
    setIsProcessing(true);
    try {
      const res = await api.markTableServed(tableId);
      if (res.success) {
        setSelectedTable(null);
        fetchData();
        toast.success('Đã đánh dấu phục vụ xong bàn');
      }
    } catch (err) {
      toast.error('Lỗi cập nhật bàn.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearTable = async (tableId, skipConfirm = false, totalAmount = null, paymentMethod = null) => {
    if (!skipConfirm) {
      const ok = await confirmDialog({
        title: 'Thanh toán & Dọn bàn',
        message: 'Xác nhận thanh toán và dọn bàn này?',
        type: 'warning',
        confirmText: 'Xác nhận',
        cancelText: 'Huỷ'
      });
      if (!ok) return;
    }
    setIsProcessing(true);
    try {
      const res = await api.clearTable(tableId, totalAmount, paymentMethod);
      if (res.success) {
        toast.success(res.message || 'Đã dọn bàn thành công');
        setSelectedTable(null);
        fetchData();
      }
    } catch (err) {
      toast.error('Lỗi khi clear bàn.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseShift = async () => {
    const occupiedTables = tables.filter((t) => t.status !== 'EMPTY' || t.current_session_id != null);
    if (occupiedTables.length > 0) {
      const activeTableNames = occupiedTables.map((t) => t.name).join(', ');
      await alertDialog({
        title: 'Chưa thể đóng máy ca làm việc',
        message: `Tất cả các bàn phải được thanh toán & dọn sạch trước khi đóng máy.\n\nCác bàn đang có khách: ${activeTableNames}`,
        type: 'warning',
        confirmText: 'Đã hiểu'
      });
      return;
    }

    const ok = await confirmDialog({
      title: 'Đóng máy (Kết thúc ngày)',
      message: 'XÁC NHẬN ĐÓNG MÁY?\n\nSau khi đóng máy, khách hàng sẽ không thể đặt món cho đến khi bạn Mở máy ca mới.',
      type: 'warning',
      confirmText: 'Xác nhận đóng máy',
      cancelText: 'Huỷ'
    });
    if (!ok) return;

    setIsProcessing(true);
    try {
      const res = await api.closeShift();
      if (res.success) {
        toast.success(res.message || 'Đã đóng máy thành công');
        const shiftRes = await api.getShiftStatus();
        if (shiftRes.success) setShiftStatus(shiftRes.data);
      } else {
        toast.error(res.message || 'Lỗi khi đóng máy');
      }
    } catch (e) {
      toast.error(e.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenShift = async () => {
    const ok = await confirmDialog({
      title: 'Mở máy',
      message: 'XÁC NHẬN MỞ MÁY ?\n\nSố thứ tự đơn hàng sẽ được đặt lại bắt đầu từ 1. Khách hàng có thể tiếp tục đặt món.',
      type: 'info',
      confirmText: 'Mở ca mới',
      cancelText: 'Huỷ'
    });
    if (!ok) return;

    setIsProcessing(true);
    try {
      const res = await api.openShift();
      if (res.success) {
        toast.success(res.message || 'Đã mở ca làm việc thành công');
        const shiftRes = await api.getShiftStatus();
        if (shiftRes.success) setShiftStatus(shiftRes.data);
        fetchData();
      } else {
        toast.error(res.message || 'Lỗi khi mở máy');
      }
    } catch (e) {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="d-flex min-vh-100 bg-light font-sans">
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0, overflowX: 'hidden' }}>
        <AdminNavbar
          onSync={fetchData}
          currentUser={currentUser}
          onLogout={handleLogout}
          shiftStatus={shiftStatus}
          onCloseShift={handleCloseShift}
          onOpenShift={handleOpenShift}
          isProcessing={isProcessing}
        />

        <main className="p-4 flex-grow-1">
          {activeTab === 'pos' && (
            <>
              <AdminStats tables={tables} />
              <div className="row g-4">
                <div className="col-12">
                  <TableMap
                    tables={tables}
                    onSelectTable={(table) => setSelectedTable(table)}
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'reports' && <AdminReports />}

          {activeTab === 'menu' && <AdminMenuManagement />}

          {activeTab === 'qrcodes' && <AdminTableQRs />}

          {activeTab === 'users' && <AdminUsers currentUser={currentUser} />}
        </main>

        <footer className="bg-white border-top px-4 py-2.5 text-muted small d-flex justify-content-between align-items-center">
          <div>AdminLTE POS &copy; 2026.</div>
          <div>Phiên bản 1.0</div>
        </footer>
      </div>

      {selectedTable && (
        <TableDetailModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
          onClearTable={handleClearTable}
          onMarkServed={handleMarkServed}
          isProcessing={isProcessing}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
