import React from 'react';
import { PERMISSION_CONFIGS, ROLE_PRESETS } from './permissionsConfig';

export default function PermissionSelector({ permissions, onChange }) {
  const togglePermission = (id) => {
    const next = permissions.includes(id)
      ? permissions.filter((p) => p !== id)
      : [...permissions, id];
    onChange(next);
  };

  const applyPreset = (presetPerms) => {
    onChange([...presetPerms]);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <label className="form-label small fw-bold mb-0">
          <i className="bi bi-shield-lock-fill text-primary me-1"></i>Chọn Các Quyền Hạn:
        </label>
        <span className="badge bg-light text-secondary border">
          Đã chọn: {permissions.length} quyền
        </span>
      </div>

      <div className="mb-3 d-flex flex-wrap gap-1 align-items-center">
        <span className="small text-muted me-1">Mẫu nhanh:</span>
        {ROLE_PRESETS.map((pr) => (
          <button
            type="button"
            key={pr.name}
            onClick={() => applyPreset(pr.perms)}
            className="btn btn-outline-secondary btn-sm py-1 px-2 rounded-pill text-[12px] d-inline-flex align-items-center gap-1"
          >
            <i className={`bi ${pr.icon}`}></i> {pr.name}
          </button>
        ))}
      </div>

      <div className="row g-2">
        {PERMISSION_CONFIGS.map((perm) => {
          const isChecked = permissions.includes(perm.id);
          return (
            <div className="col-12 col-md-6" key={perm.id}>
              <div
                onClick={() => togglePermission(perm.id)}
                className={`p-2.5 rounded-3 border d-flex align-items-start gap-2.5 cursor-pointer ${
                  isChecked ? 'bg-primary bg-opacity-10 border-primary' : 'bg-white border-light-subtle'
                }`}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  className="form-check-input mt-1 flex-shrink-0"
                  checked={isChecked}
                  onChange={() => {}}
                />
                <div>
                  <div className="fw-semibold text-dark small">{perm.name}</div>
                  <div className="text-secondary text-[11px] leading-tight">{perm.desc}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 p-2 bg-light rounded text-[12px] text-secondary">
        <i className="bi bi-shield-exclamation text-warning me-1"></i>
        Nếu nhân viên chỉ có <em>"Phục vụ gọi món"</em> mà không có quyền quản trị, nhân viên sẽ <strong>không được vào Admin</strong>, chỉ dùng App Phục Vụ.
      </div>
    </div>
  );
}
