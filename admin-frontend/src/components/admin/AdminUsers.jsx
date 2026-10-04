import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { confirmDialog, toast } from '../../context/FeedbackContext';
import { PERMISSION_CONFIGS } from './userManagement/permissionsConfig';
import UserTable from './userManagement/UserTable';
import UserAddModal from './userManagement/UserAddModal';
import UserEditModal from './userManagement/UserEditModal';
import UserPasswordModal from './userManagement/UserPasswordModal';

export default function AdminUsers({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      if (res.success) setUsers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setErrorMsg('');
    setSuccessMsg('');
    setShowEditModal(true);
  };

  const handleOpenPasswordOnly = (user) => {
    setSelectedUser(user);
    setErrorMsg('');
    setSuccessMsg('');
    setShowPasswordModal(true);
  };

  const handleCreateUser = async (formData) => {
    if (!formData.username.trim() || !formData.password || !formData.full_name.trim()) {
      setErrorMsg('Vui lòng điền đủ: Tên đăng nhập, Mật khẩu và Họ tên.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        username: formData.username.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        role: formData.role,
        permissions: formData.role === 1 ? PERMISSION_CONFIGS.map((p) => p.id) : formData.permissions
      };
      const res = await api.createUser(payload);
      if (res.success) {
        setSuccessMsg('Tạo tài khoản và phân quyền thành công!');
        fetchUsers();
        setTimeout(() => setShowAddModal(false), 700);
      } else {
        setErrorMsg(res.message || 'Lỗi tạo tài khoản.');
      }
    } catch (err) {
      setErrorMsg('Không thể kết nối máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (editFormData) => {
    if (!editFormData.full_name.trim()) {
      setErrorMsg('Họ tên nhân viên không được để trống.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        full_name: editFormData.full_name.trim(),
        role: editFormData.role,
        permissions: editFormData.role === 1 ? PERMISSION_CONFIGS.map((p) => p.id) : editFormData.permissions,
        is_active: editFormData.is_active
      };
      if (editFormData.new_password && editFormData.new_password.trim().length >= 4) {
        payload.password = editFormData.new_password.trim();
      }
      const res = await api.updateUser(selectedUser.id, payload);
      if (res.success) {
        setSuccessMsg('Cập nhật tài khoản và phân quyền thành công!');
        fetchUsers();
        setTimeout(() => setShowEditModal(false), 700);
      } else {
        setErrorMsg(res.message || 'Lỗi cập nhật tài khoản.');
      }
    } catch (err) {
      setErrorMsg('Lỗi máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePasswordOnly = async (password) => {
    if (!password || password.length < 4) {
      setErrorMsg('Mật khẩu mới phải từ 4 ký tự trở lên.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.updateUser(selectedUser.id, { password });
      if (res.success) {
        setSuccessMsg('Đổi mật khẩu thành công!');
        setTimeout(() => setShowPasswordModal(false), 700);
      } else {
        setErrorMsg(res.message || 'Lỗi cập nhật mật khẩu.');
      }
    } catch (err) {
      setErrorMsg('Lỗi máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (user.id === 1) return toast.warning('Không thể khóa tài khoản Admin gốc.');
    const newStatus = !user.is_active;
    const ok = await confirmDialog({
      title: newStatus ? 'Mở khóa tài khoản' : 'Khóa tài khoản',
      message: `Bạn có chắc muốn ${newStatus ? 'Mở khóa' : 'Khóa'} tài khoản "${user.username}"?`,
      type: newStatus ? 'info' : 'warning',
      confirmText: newStatus ? 'Mở khóa' : 'Khóa tài khoản',
      cancelText: 'Huỷ'
    });
    if (!ok) return;

    try {
      const res = await api.updateUser(user.id, { is_active: newStatus });
      if (res.success) {
        toast.success(`Đã ${newStatus ? 'mở khóa' : 'khóa'} tài khoản "${user.username}"`);
        fetchUsers();
      } else {
        toast.error(res.message || 'Lỗi cập nhật trạng thái.');
      }
    } catch (err) {
      toast.error('Lỗi cập nhật trạng thái.');
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.id === 1) return toast.warning('Không thể xóa tài khoản Admin gốc.');
    const ok = await confirmDialog({
      title: 'Xoá tài khoản',
      message: `Bạn có chắc muốn XÓA tài khoản "${user.username}"? Thao tác này không thể hoàn tác.`,
      type: 'danger',
      confirmText: 'Xoá tài khoản',
      cancelText: 'Huỷ'
    });
    if (!ok) return;

    try {
      const res = await api.deleteUser(user.id);
      if (res.success) {
        toast.success(`Đã xoá tài khoản "${user.username}"`);
        fetchUsers();
      } else {
        toast.error(res.message || 'Lỗi xóa tài khoản.');
      }
    } catch (err) {
      toast.error('Lỗi máy chủ.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4 d-flex justify-content-between align-items-center w-100 flex-wrap gap-3">
          <div>
            <h4 className="fw-bold mb-1 text-dark">
              <i className="bi bi-people-fill text-primary me-2"></i>Quản Lý Tài Khoản & Phân Quyền Nhân Viên
            </h4>
            <p className="text-secondary small mb-0">
              Phân quyền chi tiết cho nhân viên phục vụ, thu ngân, bếp và quản trị viên
            </p>
          </div>
          <div>
            <button onClick={handleOpenAdd} className="btn btn-primary d-flex align-items-center gap-2 fw-semibold shadow-sm">
              <i className="bi bi-person-plus-fill"></i> Tạo Tài Khoản Mới
            </button>
          </div>
        </div>
      </div>

      <UserTable
        users={users}
        loading={loading}
        currentUser={currentUser}
        onRefresh={fetchUsers}
        onEdit={handleOpenEdit}
        onEditPassword={handleOpenPasswordOnly}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteUser}
      />

      {showAddModal && (
        <UserAddModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateUser}
          submitting={submitting}
          errorMsg={errorMsg}
          successMsg={successMsg}
        />
      )}

      {showEditModal && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdateUser}
          submitting={submitting}
          errorMsg={errorMsg}
          successMsg={successMsg}
        />
      )}

      {showPasswordModal && selectedUser && (
        <UserPasswordModal
          user={selectedUser}
          onClose={() => setShowPasswordModal(false)}
          onSubmit={handleUpdatePasswordOnly}
          submitting={submitting}
          errorMsg={errorMsg}
          successMsg={successMsg}
        />
      )}
    </div>
  );
}
