import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { exportReportsToExcel } from '../../utils/excelExport';
import { toast } from '../../context/FeedbackContext';

export default function AdminReports() {
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [dateMode, setDateMode] = useState('today');
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());

  const fetchReports = (sDate = startDate, eDate = endDate) => {
    setLoading(true);
    const params = { limit: 50 };
    if (sDate && eDate) {
      params.startDate = sDate;
      params.endDate = eDate;
    }
    api.getReportsSummary(params)
      .then((res) => {
        if (res?.success) {
          setData(res.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports(startDate, endDate);
  }, []);

  const handleSelectToday = () => {
    const today = getTodayStr();
    setDateMode('today');
    setStartDate(today);
    setEndDate(today);
    fetchReports(today, today);
  };

  const handleFilterRange = () => {
    if (!startDate || !endDate) {
      toast.warning('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.');
      return;
    }
    if (startDate > endDate) {
      toast.warning('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }
    setDateMode('custom');
    fetchReports(startDate, endDate);
  };

  const handleExportExcel = () => {
    if (!data) return;
    setIsExporting(true);
    try {
      exportReportsToExcel(data, {
        startDate,
        endDate,
        isToday: dateMode === 'today'
      });
      toast.success('Xuất file Excel báo cáo thành công!');
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      toast.error('Không thể xuất file Excel. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDisplayDate = (dStr) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dStr;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary me-2" role="status"></div>
        <span className="text-muted fw-semibold">Đang tải báo cáo doanh thu bán hàng...</span>
      </div>
    );
  }

  const {
    range_revenue,
    range_orders_count,
    today_revenue = 0,
    today_orders_count = 0,
    total_revenue = 0,
    total_orders_count = 0,
    daily_revenue = [],
    top_products = [],
    recent_sessions = []
  } = data || {};

  const periodRevenue = range_revenue !== undefined ? Number(range_revenue) : Number(today_revenue);
  const periodOrdersCount = range_orders_count !== undefined ? Number(range_orders_count) : Number(today_orders_count);
  const allTimeRevenue = Number(total_revenue) || 0;
  const allTimeOrders = Number(total_orders_count) || 0;

  const periodAov = periodOrdersCount > 0 ? Math.round(periodRevenue / periodOrdersCount) : 0;
  const allTimeAov = allTimeOrders > 0 ? Math.round(allTimeRevenue / allTimeOrders) : 0;

  return (
    <div>

      <div className="card shadow-sm border-0 mb-4 bg-white">
        <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3 w-100">
          <div>
            <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
              <i className="bi bi-graph-up-arrow text-primary"></i>
              Báo Cáo Doanh Thu
            </h4>
            <div className="text-muted small">
              Thống kê doanh thu và báo cáo bán hàng theo thời gian thực
            </div>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2 ms-auto">

            <button
              type="button"
              className={`btn btn-sm ${dateMode === 'today' ? 'btn-primary fw-bold shadow-xs' : 'btn-outline-secondary'}`}
              onClick={handleSelectToday}
            >
              <i className="bi bi-calendar-check me-1"></i> Hôm nay
            </button>

            <div className="d-flex align-items-center gap-1 bg-light border rounded px-2 py-1">
              <span className="small text-secondary fw-semibold">Từ:</span>
              <input
                type="date"
                className="form-control form-control-sm border-0 bg-transparent p-0"
                style={{ width: '125px', fontSize: '13px' }}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateMode('custom');
                }}
              />
              <span className="small text-secondary fw-semibold ms-1">Đến:</span>
              <input
                type="date"
                className="form-control form-control-sm border-0 bg-transparent p-0"
                style={{ width: '125px', fontSize: '13px' }}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateMode('custom');
                }}
              />
            </div>

            <button
              type="button"
              className="btn btn-sm btn-dark d-flex align-items-center gap-1 fw-semibold"
              onClick={handleFilterRange}
              title="Lọc báo cáo theo khoảng ngày"
            >
              <i className="bi bi-funnel-fill"></i>
              <span>Lọc</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              title="Tải lại dữ liệu"
              onClick={() => fetchReports(startDate, endDate)}
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-success d-flex align-items-center gap-1.5 fw-semibold shadow-xs"
              onClick={handleExportExcel}
              disabled={isExporting}
              title="Xuất file báo cáo Excel"
            >
              <i className="bi bi-file-earmark-excel-fill text-success"></i>
              <span>{isExporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <div className="card bg-success text-white p-3 rounded-3 shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-start">
              <small className="opacity-75 text-uppercase fw-semibold">
                {dateMode === 'today' ? 'Doanh Thu Hôm Nay' : 'Doanh Thu Kỳ Chọn'}
              </small>
              <span className="badge bg-white text-success fw-bold">
                {dateMode === 'today' ? 'Hôm nay' : 'Kỳ lọc'}
              </span>
            </div>
            <h3 className="fw-bold mt-2 mb-1">{periodRevenue.toLocaleString('vi-VN')} đ</h3>
            <div className="small opacity-75 mt-auto pt-2 border-top border-white border-opacity-25">
              <div>Thời gian: <strong>{dateMode === 'today' ? 'Hôm nay' : `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`}</strong></div>
              <div>Số đơn: <strong>{periodOrdersCount} đơn</strong></div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card bg-primary text-white p-3 rounded-3 shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-start">
              <small className="opacity-75 text-uppercase fw-semibold">Đơn Hoàn Thành Kỳ Chọn</small>
              <span className="badge bg-white text-primary fw-bold">100% Hoàn tất</span>
            </div>
            <h3 className="fw-bold mt-2 mb-1">{periodOrdersCount} đơn</h3>
            <div className="small opacity-75 mt-auto pt-2 border-top border-white border-opacity-25">
              <div>TB mỗi đơn: <strong>{periodAov.toLocaleString('vi-VN')} đ</strong></div>
              <div>Trạng thái: <strong>Đã thanh toán</strong></div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card bg-dark text-white p-3 rounded-3 shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-start">
              <small className="opacity-75 text-uppercase fw-semibold">Doanh Thu Toàn Thời Gian</small>
              <span className="badge bg-warning text-dark fw-bold">Tích lũy</span>
            </div>
            <h3 className="fw-bold mt-2 mb-1 text-warning">{allTimeRevenue.toLocaleString('vi-VN')} đ</h3>
            <div className="small opacity-75 mt-auto pt-2 border-top border-white border-opacity-25">
              <div>Tổng số đơn: <strong>{allTimeOrders} đơn</strong></div>
              <div className="text-warning">Toàn bộ lịch sử bán hàng</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card bg-info text-white p-3 rounded-3 shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-start">
              <small className="opacity-75 text-uppercase fw-semibold">Tổng Đơn Tích Lũy</small>
              <span className="badge bg-white text-info fw-bold">Toàn hệ thống</span>
            </div>
            <h3 className="fw-bold mt-2 mb-1">{allTimeOrders} đơn</h3>
            <div className="small opacity-75 mt-auto pt-2 border-top border-white border-opacity-25">
              <div>TB toàn bộ: <strong>{allTimeAov.toLocaleString('vi-VN')} đ</strong></div>
              <div>Đã phục vụ hoàn tất</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">

        <div className="col-lg-6">
          <div className="card shadow-sm h-100 border-0">
            <div className="card-header bg-white py-2 fw-bold text-dark d-flex justify-content-between align-items-center">
              <span><i className="bi bi-trophy-fill text-warning me-2"></i>TOP MÓN BÁN CHẠY</span>
              <span className="badge bg-light text-secondary border">Kỳ báo cáo</span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light small">
                    <tr>
                      <th>Hạng</th>
                      <th>Món</th>
                      <th className="text-end">Đơn giá</th>
                      <th className="text-center">Số lượng</th>
                      <th className="text-end text-success">Tổng doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top_products?.map((p, idx) => {
                      const itemRev = Number(p.total_revenue) || 0;
                      const itemPrice = Number(p.price) || 0;
                      return (
                        <tr key={p.id || idx}>
                          <td><span className="badge bg-secondary">#{idx + 1}</span></td>
                          <td className="fw-bold">{p.name}</td>
                          <td className="text-end text-muted small">{itemPrice.toLocaleString('vi-VN')} đ</td>
                          <td className="text-center"><span className="badge bg-danger">{p.total_sold}</span></td>
                          <td className="text-end fw-bold text-success">{itemRev.toLocaleString('vi-VN')} đ</td>
                        </tr>
                      );
                    })}
                    {(!top_products || top_products.length === 0) && (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-3">Chưa có dữ liệu món bán trong khoảng thời gian này</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm h-100 border-0">
            <div className="card-header bg-white py-2 fw-bold text-dark d-flex justify-content-between align-items-center">
              <span><i className="bi bi-graph-up text-primary me-2"></i>DOANH THU THEO NGÀY</span>
              <span className="badge bg-light text-secondary border">{daily_revenue?.length || 0} ngày</span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light small">
                    <tr>
                      <th>Ngày</th>
                      <th className="text-center">Số đơn</th>
                      <th className="text-end text-primary">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daily_revenue?.map((d, idx) => {
                      const dayRev = Number(d.revenue) || 0;
                      return (
                        <tr key={idx}>
                          <td className="fw-semibold">{d.full_date || d.date_label}</td>
                          <td className="text-center"><span className="badge bg-light text-dark border">{d.order_count}</span></td>
                          <td className="text-end fw-bold text-primary">{dayRev.toLocaleString('vi-VN')} đ</td>
                        </tr>
                      );
                    })}
                    {(!daily_revenue || daily_revenue.length === 0) && (
                      <tr>
                        <td colSpan="3" className="text-center text-muted py-3">Chưa có doanh thu trong khoảng thời gian này</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-2 fw-bold text-dark d-flex justify-content-between align-items-center">
          <span><i className="bi bi-clock-history text-info me-2"></i>LỊCH SỬ BÀN ĐÃ THANH TOÁN</span>
          <button
            type="button"
            className="btn btn-outline-success btn-sm d-flex align-items-center gap-1.5 fw-semibold shadow-xs ms-auto"
            onClick={handleExportExcel}
            disabled={isExporting}
            title="Xuất file báo cáo Excel"
          >
            <i className="bi bi-file-earmark-excel-fill text-success"></i>
            <span>Xuất Excel</span>
          </button>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped align-middle mb-0">
              <thead className="table-light small">
                <tr>
                  <th>Mã</th>
                  <th>Bàn</th>
                  <th>Hình thức</th>
                  <th>Giờ vào</th>
                  <th>Giờ ra</th>
                  <th className="text-end text-danger">Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {recent_sessions?.map((s) => {
                  const sAmount = Number(s.session_total) || 0;
                  return (
                    <tr key={s.id}>
                      <td className="text-muted">#{s.id}</td>
                      <td><span className="badge bg-primary">{s.table_name}</span></td>
                      <td>
                        {s.payment_method === 'BANK_QR' ? (
                          <span className="badge bg-info-subtle text-primary border border-info-subtle">
                            <i className="bi bi-qr-code me-1"></i>QR ngân hàng
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary border">
                            <i className="bi bi-cash me-1"></i>Tiền mặt
                          </span>
                        )}
                      </td>
                      <td className="small text-muted">{new Date(s.start_time).toLocaleTimeString('vi-VN')}</td>
                      <td className="small text-muted">{s.end_time ? new Date(s.end_time).toLocaleTimeString('vi-VN') : '—'}</td>
                      <td className="text-end fw-bold text-danger">{sAmount.toLocaleString('vi-VN')} đ</td>
                    </tr>
                  );
                })}
                {(!recent_sessions || recent_sessions.length === 0) && (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-3">Chưa có phiên bàn nào thanh toán trong kỳ này</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
