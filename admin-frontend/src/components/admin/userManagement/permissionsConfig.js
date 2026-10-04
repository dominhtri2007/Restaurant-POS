export const PERMISSION_CONFIGS = [
  {
    id: 'pos',
    name: 'Bán hàng & Thu ngân POS',
    desc: 'Sơ đồ bàn, gọi món và thanh toán dọn bàn',
    badgeColor: 'bg-success text-white'
  },
  {
    id: 'reports',
    name: 'Báo cáo doanh thu',
    desc: 'Xem biểu đồ doanh thu, ca bán hàng và thống kê món',
    badgeColor: 'bg-info text-dark'
  },
  {
    id: 'menu',
    name: 'Quản lý thực đơn',
    desc: 'Thêm, sửa món ăn, chỉnh giá bán và danh mục',
    badgeColor: 'bg-primary text-white'
  },
  {
    id: 'qrcodes',
    name: 'Quản lý bàn & QR',
    desc: 'Thêm bàn mới, sửa tên bàn và tải mã QR gọi món',
    badgeColor: 'bg-secondary text-white'
  },
  {
    id: 'users',
    name: 'Quản lý nhân viên',
    desc: 'Tạo tài khoản, đổi mật khẩu và phân quyền nhân sự',
    badgeColor: 'bg-danger text-white'
  }
];

export const ROLE_PRESETS = [
  {
    name: 'Thu ngân / Nhân viên',
    icon: 'bi-grid-3x3-gap-fill',
    perms: ['pos'],
    desc: 'Bán hàng & Thu ngân POS'
  },
  {
    name: 'Quản lý ca',
    icon: 'bi-shield-check',
    perms: ['pos', 'reports', 'menu', 'qrcodes'],
    desc: 'Vận hành toàn quán & Báo cáo'
  },
  {
    name: 'Quản trị viên',
    icon: 'bi-shield-fill',
    perms: ['pos', 'reports', 'menu', 'qrcodes', 'users'],
    desc: 'Toàn quyền hệ thống'
  }
];
