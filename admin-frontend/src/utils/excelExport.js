export function exportReportsToExcel(data, filterInfo = {}) {
  if (!data) return;
  const {
    range_revenue, range_orders_count,
    today_revenue = 0, today_orders_count = 0,
    total_revenue = 0, total_orders_count = 0,
    daily_revenue = [], top_products = [], recent_sessions = []
  } = data;

  const currentRevenue = range_revenue !== undefined ? Number(range_revenue) : Number(today_revenue);
  const currentOrdersCount = range_orders_count !== undefined ? Number(range_orders_count) : Number(today_orders_count);
  const preTaxTotal = Number(total_revenue) || 0;
  const exportDate = new Date().toLocaleString('vi-VN');

  const { startDate, endDate, isToday } = filterInfo;
  let periodText = 'Hôm nay';
  if (isToday) {
    periodText = `Hôm nay (${startDate || new Date().toLocaleDateString('vi-VN')})`;
  } else if (startDate && endDate) {
    if (startDate === endDate) {
      periodText = `Ngày ${startDate}`;
    } else {
      periodText = `Từ ${startDate} đến ${endDate}`;
    }
  }

  const topRows = top_products.map((p, i) => {
    const rev = Number(p.total_revenue) || 0;
    const price = Number(p.price) || 0;
    return `<tr><td align="center">#${i + 1}</td><td><b>${p.name || ''}</b></td><td align="right">${price.toLocaleString('vi-VN')} đ</td><td align="center"><b>${p.total_sold || 0}</b></td><td align="right" style="color:#198754;font-weight:bold">${rev.toLocaleString('vi-VN')} đ</td></tr>`;
  }).join('') || '<tr><td colspan="5" align="center">Chưa có số liệu</td></tr>';

  const dailyRows = daily_revenue.map((d) => {
    const rev = Number(d.revenue) || 0;
    return `<tr><td align="center"><b>${d.full_date || d.date_label || ''}</b></td><td align="center">${d.order_count || 0}</td><td align="right" style="color:#0d6efd;font-weight:bold">${rev.toLocaleString('vi-VN')} đ</td></tr>`;
  }).join('') || '<tr><td colspan="3" align="center">Chưa có số liệu</td></tr>';

  const sessionRows = recent_sessions.map((s) => {
    const amt = Number(s.session_total) || 0;
    const pay = s.payment_method === 'BANK_QR' ? 'QR ngân hàng' : 'Tiền mặt';
    const start = s.start_time ? new Date(s.start_time).toLocaleTimeString('vi-VN') : '—';
    const end = s.end_time ? new Date(s.end_time).toLocaleTimeString('vi-VN') : '—';
    return `<tr><td align="center">#${s.id}</td><td align="center"><b>${s.table_name || ''}</b></td><td align="center">${pay}</td><td align="center">${start}</td><td align="center">${end}</td><td align="right" style="color:#dc3545;font-weight:bold">${amt.toLocaleString('vi-VN')} đ</td></tr>`;
  }).join('') || '<tr><td colspan="6" align="center">Chưa có số liệu</td></tr>';

  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><style>body{font-family:Arial,sans-serif;font-size:11pt;}table{border-collapse:collapse;margin-bottom:20px;width:100%;}th,td{border:0.5pt solid #c0c0c0;padding:6px 10px;}.sec-h{background-color:#0d6efd;color:#fff;font-weight:bold;text-align:center;}.sec-s{background-color:#495057;color:#fff;font-weight:bold;text-align:center;}.sec-t{font-size:12pt;font-weight:bold;background-color:#f1f3f5;}</style></head><body>
  <table><tr><td colspan="6" align="center" style="font-size:16pt;font-weight:bold;color:#0d6efd">BÁO CÁO DOANH THU BÁN HÀNG</td></tr><tr><td colspan="6" align="center" style="font-size:10pt;color:#6c757d">Kỳ báo cáo: ${periodText} | Xuất lúc: ${exportDate}</td></tr></table>
  <table><tr><td colspan="4" class="sec-t">1. TỔNG QUAN DOANH THU</td></tr><tr><th class="sec-h">Chỉ số</th><th class="sec-h">Kỳ báo cáo</th><th class="sec-h">Toàn thời gian</th><th class="sec-h">Ghi chú</th></tr><tr><td><b>Tổng doanh thu</b></td><td align="right" style="color:#198754"><b>${currentRevenue.toLocaleString('vi-VN')} đ</b></td><td align="right"><b>${preTaxTotal.toLocaleString('vi-VN')} đ</b></td><td>Tiền bán món ăn</td></tr><tr><td><b>Số đơn hoàn thành</b></td><td align="right">${currentOrdersCount} đơn</td><td align="right">${total_orders_count} đơn</td><td>Tổng số bàn đã thanh toán</td></tr><tr><td><b>Doanh thu trung bình / đơn</b></td><td align="right">${currentOrdersCount > 0 ? Math.round(currentRevenue / currentOrdersCount).toLocaleString('vi-VN') : 0} đ</td><td align="right">${total_orders_count > 0 ? Math.round(preTaxTotal / total_orders_count).toLocaleString('vi-VN') : 0} đ</td><td>Giá trị trung bình mỗi đơn</td></tr></table>
  <table><tr><td colspan="5" class="sec-t">2. TOP MÓN BÁN CHẠY</td></tr><tr><th class="sec-s">Hạng</th><th class="sec-s">Tên món</th><th class="sec-s">Đơn giá</th><th class="sec-s">Số lượng</th><th class="sec-s">Tổng doanh thu</th></tr>${topRows}</table>
  <table><tr><td colspan="3" class="sec-t">3. DOANH THU THEO NGÀY</td></tr><tr><th class="sec-s">Ngày</th><th class="sec-s">Số đơn</th><th class="sec-s">Doanh thu</th></tr>${dailyRows}</table>
  <table><tr><td colspan="6" class="sec-t">4. LỊCH SỬ BÀN ĐÃ THANH TOÁN</td></tr><tr><th class="sec-s">Mã</th><th class="sec-s">Bàn</th><th class="sec-s">Hình thức</th><th class="sec-s">Giờ vào</th><th class="sec-s">Giờ ra</th><th class="sec-s">Tổng tiền</th></tr>${sessionRows}</table>
  </body></html>`;

  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const fileDateStr = startDate && endDate ? `${startDate}_den_${endDate}` : new Date().toISOString().slice(0, 10);
  a.download = `Bao_Cao_Doanh_Thu_${fileDateStr}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
