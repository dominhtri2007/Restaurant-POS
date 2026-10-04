import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { confirmDialog, toast } from '../../context/FeedbackContext';

const DEFAULT_ANNOUNCEMENT = 'Chào mừng quý khách đến với nhà hàng! Quý khách vui lòng chọn món trên thực đơn và xác nhận đặt món • Món ăn sẽ được bếp chuẩn bị chu đáo và phục vụ tận bàn • Chúc quý khách ngon miệng!';
const DEFAULT_CLOSED_ANNOUNCEMENT = 'Nhà hàng đã hết giờ làm việc, vui lòng quay lại vào ngày mai. Kính chúc quý khách một ngày tốt lành!';

const PRESET_TEMPLATES = [
  {
    title: '🌟 Lời chào & Chúc ngon miệng',
    desc: 'Mẫu thông điệp chào đón và hướng dẫn gọi món tiêu chuẩn',
    text: 'Chào mừng quý khách đến với nhà hàng! Quý khách vui lòng chọn món trên thực đơn và xác nhận đặt món • Món ăn sẽ được bếp chuẩn bị chu đáo và phục vụ tận bàn • Chúc quý khách ngon miệng!'
  },
  {
    title: '🎁 Ưu đãi & Khuyến mãi hôm nay',
    desc: 'Thông báo chương trình giảm giá, khuyến mãi tặng món',
    text: 'Chương trình ưu đãi hôm nay: Tặng ngay 01 món tráng miệng cho bàn từ 4 người • Giảm 10% tổng hóa đơn cho khách hàng thành viên thân thiết • Chúc quý khách ngon miệng!'
  },
  {
    title: '🔥 Gợi ý món đặc sản hôm nay',
    desc: 'Quảng bá món bán chạy / Signature dishes của quán',
    text: 'Món ngon nổi bật hôm nay: Bò Lúc Lắc Sốt Tiêu Đen, Lẩu Thái Hải Sản Tươi Sống, Cơm Chiên Hoàng Bào • Nguyên liệu tươi ngon chế biến trong ngày, kính mời quý khách thưởng thức!'
  },
  {
    title: '⏳ Giờ cao điểm - Bếp đang tải',
    desc: 'Khuyến cáo khách hàng thông cảm khi quán đông đơn',
    text: 'Nhà hàng đang trong khung giờ cao điểm, các món ăn có thể cần thêm ít phút chuẩn bị chu đáo nhất. Nhà hàng chân thành cảm ơn sự kiên nhẫn của quý khách!'
  }
];

export default function AdminAnnouncement() {
  const [announcement, setAnnouncement] = useState('');
  const [closedAnnouncement, setClosedAnnouncement] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewMode, setPreviewMode] = useState('open');

  const fetchAnnouncement = async () => {
    setLoading(true);
    try {
      const res = await api.getAnnouncementSettings();
      if (res.success && res.data) {
        setAnnouncement(res.data.announcement || DEFAULT_ANNOUNCEMENT);
        setClosedAnnouncement(res.data.closed_announcement || DEFAULT_CLOSED_ANNOUNCEMENT);
      }
    } catch (err) {
      console.error('Lỗi khi tải thông báo:', err);
      setErrorMsg('Không thể tải dữ liệu thông báo từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!announcement.trim()) {
      setErrorMsg('Vui lòng không để trống thông báo khi mở cửa.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.updateAnnouncementSettings({
        announcement: announcement.trim(),
        closed_announcement: closedAnnouncement.trim() || DEFAULT_CLOSED_ANNOUNCEMENT
      });

      if (res.success) {
        setSuccessMsg('Đã lưu và cập nhật thông báo chạy trực tiếp lên màn hình khách hàng!');
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg(res.message || 'Lỗi khi lưu thông báo.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Lỗi kết nối máy chủ khi lưu.');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyPreset = (presetText) => {
    setAnnouncement(presetText);
    setErrorMsg('');
  };

  const handleResetDefault = async () => {
    const ok = await confirmDialog({
      title: 'Khôi phục thông báo mặc định',
      message: 'Bạn có chắc chắn muốn khôi phục về nội dung thông báo mặc định ban đầu?',
      type: 'warning',
      confirmText: 'Khôi phục',
      cancelText: 'Huỷ'
    });
    if (!ok) return;

    setAnnouncement(DEFAULT_ANNOUNCEMENT);
    setClosedAnnouncement(DEFAULT_CLOSED_ANNOUNCEMENT);
    setErrorMsg('');
    toast.info('Đã tải lại nội dung thông báo mẫu mặc định');
  };
  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-megaphone-fill text-warning"></i>
            Quản Lý Dòng Thông Báo Chạy (Marquee Ticker)
          </h4>
          <p className="text-muted small mb-0">
            Tùy chỉnh thông điệp chạy ngang hiển thị trên thanh tiêu đề điện thoại của thực khách khi gọi món tại bàn.
          </p>
        </div>
        <div className="d-flex gap-2 mt-2 mt-md-0">
          <button
            type="button"
            onClick={handleResetDefault}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5"
            disabled={loading || saving}
          >
            <i className="bi bi-arrow-counterclockwise"></i>
            Khôi phục mặc định
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary btn-sm fw-bold px-3 d-flex align-items-center gap-1.5 shadow-sm"
            disabled={loading || saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status"></span>
                Đang lưu...
              </>
            ) : (
              <>
                <i className="bi bi-broadcast"></i>
                Lưu & Phát Ngay
              </>
            )}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center gap-2 py-2" role="alert">
          <i className="bi bi-check-circle-fill fs-5"></i>
          <div>{successMsg}</div>
          <button type="button" className="btn-close" onClick={() => setSuccessMsg('')}></button>
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center gap-2 py-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <div>{errorMsg}</div>
          <button type="button" className="btn-close" onClick={() => setErrorMsg('')}></button>
        </div>
      )}

      <div className="card shadow-sm mb-4 border-0">
        <div className="card-header bg-white py-2.5 px-3 border-bottom d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-phone text-primary"></i>
            <span className="fw-bold small text-dark">Xem Trước Trên Màn Hình Khách Hàng (Live Preview)</span>
          </div>
          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              onClick={() => setPreviewMode('open')}
              className={`btn ${previewMode === 'open' ? 'btn-success' : 'btn-outline-secondary'}`}
            >
              🟢 Khi Mở Cửa
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('closed')}
              className={`btn ${previewMode === 'closed' ? 'btn-danger' : 'btn-outline-secondary'}`}
            >
              🔴 Khi Đóng Máy / Hết Giờ
            </button>
          </div>
        </div>
        <div className="card-body bg-light p-3">
          <div className="mx-auto bg-white rounded-3 shadow-sm border overflow-hidden" style={{ maxWidth: '420px' }}>
            <div className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center bg-white">
              <div>
                <span className="badge bg-warning text-dark px-1.5 py-0.5" style={{ fontSize: '10px' }}>QR ORDER</span>
                <div className="fw-bold small text-dark">Bàn 05 (Demo)</div>
              </div>
              {previewMode === 'open' ? (
                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small">
                  ● Đang phục vụ
                </span>
              ) : (
                <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1 small">
                  ● Tạm ngưng phục vụ
                </span>
              )}
            </div>

            <div
              className="py-1.5 px-3 d-flex align-items-center border-top border-bottom overflow-hidden"
              style={{
                backgroundColor: previewMode === 'open' ? '#fff7ed' : '#f8fafc',
                borderColor: previewMode === 'open' ? '#fed7aa' : '#e2e8f0'
              }}
            >
              <div
                className="d-flex align-items-center gap-1.5 fw-bold shrink-0 pe-2 me-2 border-end select-none"
                style={{
                  color: previewMode === 'open' ? '#9a3412' : '#64748b',
                  borderColor: previewMode === 'open' ? '#fed7aa' : '#cbd5e1'
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: previewMode === 'open' ? '#f97316' : '#94a3b8'
                  }}
                ></span>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Thông báo:
                </span>
              </div>
              <div className="overflow-hidden flex-grow-1" style={{ whiteSpace: 'nowrap' }}>
                <marquee
                  behavior="scroll"
                  direction="left"
                  scrollamount="5"
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: previewMode === 'open' ? '#7c2d12' : '#334155'
                  }}
                >
                  {previewMode === 'open'
                    ? (announcement || '(Chưa nhập nội dung thông báo...)')
                    : (closedAnnouncement || '(Chưa nhập nội dung khi đóng máy...)')}
                </marquee>
              </div>
            </div>
            <div className="p-3 text-center text-muted" style={{ fontSize: '12px' }}>
              <i className="bi bi-cart3 me-1"></i> (Khu vực danh mục & thực đơn món ăn)
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">

        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-3 px-3 border-bottom">
              <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                <i className="bi bi-pencil-square text-primary"></i>
                Nội Dung Thông Báo
              </h6>
            </div>
            <div className="card-body p-3 p-md-4">
              <form onSubmit={handleSave}>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-bold text-dark small mb-0">
                      1. Thông báo khi nhà hàng đang mở cửa (Phục vụ khách):
                    </label>
                    <span className="badge bg-light text-muted border">
                      {announcement.length} ký tự
                    </span>
                  </div>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Nhập lời chào mừng, hướng dẫn gọi món hoặc chương trình khuyến mãi..."
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    disabled={loading || saving}
                  ></textarea>
                  <small className="text-muted d-block mt-1">
                    * Thông báo này sẽ chạy liên tục trên thanh thông báo khi ca làm việc đang mở.
                  </small>
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-bold text-dark small mb-0">
                      2. Thông báo khi nhà hàng đã đóng máy (Hết giờ làm việc):
                    </label>
                    <span className="badge bg-light text-muted border">
                      {closedAnnouncement.length} ký tự
                    </span>
                  </div>
                  <textarea
                    rows="2"
                    className="form-control"
                    placeholder="Nhập thông báo khi kết thúc ngày hoặc ngoài giờ phục vụ..."
                    value={closedAnnouncement}
                    onChange={(e) => setClosedAnnouncement(e.target.value)}
                    disabled={loading || saving}
                  ></textarea>
                  <small className="text-muted d-block mt-1">
                    * Tự động hiển thị khi thu ngân bấm <strong>Đóng máy (Hết ngày)</strong>.
                  </small>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary fw-bold px-4 py-2 d-flex align-items-center gap-2 shadow-sm"
                    disabled={loading || saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Đang lưu & phát...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill"></i>
                        Lưu Thay Đổi & Phát Ngay
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={fetchAnnouncement}
                    className="btn btn-outline-secondary"
                    disabled={loading || saving}
                  >
                    Hủy bỏ
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-3 px-3 border-bottom d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                <i className="bi bi-lightbulb-fill text-warning"></i>
                Mẫu Thông Báo Soạn Sẵn
              </h6>
              <span className="badge bg-secondary-subtle text-secondary small">Click để điền nhanh</span>
            </div>
            <div className="card-body p-3">
              <div className="d-flex flex-column gap-2.5">
                {PRESET_TEMPLATES.map((tmpl, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleApplyPreset(tmpl.text)}
                    className="p-3 border rounded-3 bg-light hover-shadow cursor-pointer transition mb-2"
                    style={{ cursor: 'pointer' }}
                    title="Bấm để áp dụng mẫu này vào khung soạn thảo"
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold small text-dark">{tmpl.title}</span>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
                        style={{ fontSize: '11px' }}
                      >
                        Áp dụng &rarr;
                      </button>
                    </div>
                    <div className="text-muted" style={{ fontSize: '12px' }}>
                      {tmpl.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
