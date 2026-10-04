import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-3">
          <div className="card shadow-lg border-0 rounded-4" style={{ maxWidth: 560, width: '100%' }}>
            <div className="card-body p-4 text-center">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 text-danger mb-3"
                style={{ width: 72, height: 72, fontSize: 32 }}
              >
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>
              <h4 className="fw-bold text-dark mb-2">Đã xảy ra lỗi giao diện</h4>
              <p className="text-muted small mb-4">
                Hệ thống gặp sự cố hiển thị. Bạn có thể thử tải lại trang hoặc xóa bộ nhớ tạm để đăng nhập lại.
              </p>

              {this.state.error && (
                <div className="alert alert-danger text-start small font-monospace mb-4 p-2 text-break" style={{ maxHeight: 150, overflowY: 'auto' }}>
                  <strong>Lỗi:</strong> {this.state.error.toString()}
                </div>
              )}

              <div className="d-flex gap-2 justify-content-center">
                <button
                  type="button"
                  className="btn btn-primary fw-semibold px-4 d-flex align-items-center gap-2"
                  onClick={this.handleReload}
                >
                  <i className="bi bi-arrow-clockwise"></i>
                  Tải lại trang
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger fw-semibold px-3 d-flex align-items-center gap-2"
                  onClick={this.handleReset}
                >
                  <i className="bi bi-trash3"></i>
                  Xóa bộ nhớ đệm &amp; Đăng nhập lại
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
