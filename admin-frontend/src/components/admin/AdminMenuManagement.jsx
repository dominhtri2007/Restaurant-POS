import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { confirmDialog, toast } from '../../context/FeedbackContext';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';

export default function AdminMenuManagement() {
  const [subTab, setSubTab] = useState('products');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterCategory, setFilterCategory] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: '',
    price: '',
    image_url: '',
    is_best_seller: false,
    is_available: true
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([api.getCategories(), api.getProducts()]);
      if (cRes.success) setCategories(cRes.data);
      if (pRes.success) setProducts(pRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category_id: categories[0]?.id || '',
      price: '',
      image_url: '',
      is_best_seller: false,
      is_available: true
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (p) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      category_id: p.category_id,
      price: p.price,
      image_url: p.image_url || '',
      is_best_seller: Boolean(p.is_best_seller),
      is_available: Boolean(p.is_available)
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.category_id) {
      return toast.warning('Vui lòng nhập tên và chọn danh mục!');
    }
    setSubmitting(true);
    try {
      const res = editingProduct
        ? await api.updateProduct(editingProduct.id, productForm)
        : await api.createProduct(productForm);
      if (res.success) {
        toast.success(editingProduct ? 'Cập nhật món thành công!' : 'Thêm món mới thành công!');
        setShowProductModal(false);
        fetchData();
      } else {
        toast.error(res.message || 'Lỗi lưu món.');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (p) => {
    const ok = await confirmDialog({
      title: 'Xoá món ăn',
      message: `Bạn có chắc chắn muốn XÓA món "${p.name}"?`,
      type: 'danger',
      confirmText: 'Xoá món',
      cancelText: 'Huỷ'
    });
    if (!ok) return;

    try {
      const res = await api.deleteProduct(p.id);
      if (res.success) {
        toast.success(`Đã xoá món "${p.name}"`);
        fetchData();
      } else {
        toast.error(res.message || 'Không thể xoá món này.');
      }
    } catch (err) {
      toast.error('Lỗi kết nối.');
    }
  };

  const handleToggleAvailability = async (p) => {
    try {
      const res = await api.toggleProductAvailability(p.id);
      if (res.success) {
        setProducts(prev => prev.map(item => item.id === p.id ? { ...item, is_available: res.data.is_available } : item));
        toast.info(`Đã chuyển trạng thái sang: ${res.data.is_available ? 'Còn hàng' : 'Hết hàng'}`);
      }
    } catch (e) {
      toast.error('Lỗi cập nhật trạng thái món.');
    }
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (c) => {
    setEditingCategory(c);
    setCategoryName(c.name);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return toast.warning('Vui lòng nhập tên danh mục!');
    setSubmitting(true);
    try {
      const res = editingCategory
        ? await api.updateCategory(editingCategory.id, { name: categoryName.trim() })
        : await api.createCategory({ name: categoryName.trim() });
      if (res.success) {
        toast.success(editingCategory ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục mới thành công!');
        setShowCategoryModal(false);
        fetchData();
      } else {
        toast.error(res.message || 'Lỗi lưu danh mục.');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (c) => {
    const ok = await confirmDialog({
      title: 'Xoá danh mục',
      message: `Bạn có chắc chắn muốn XÓA danh mục "${c.name}"? Các món trong danh mục này có thể bị ảnh hưởng.`,
      type: 'danger',
      confirmText: 'Xoá danh mục',
      cancelText: 'Huỷ'
    });
    if (!ok) return;

    try {
      const res = await api.deleteCategory(c.id);
      if (res.success) {
        toast.success(`Đã xoá danh mục "${c.name}"`);
        fetchData();
      } else {
        toast.error(res.message || 'Lỗi xóa danh mục.');
      }
    } catch (err) {
      toast.error('Lỗi kết nối.');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchCat = filterCategory ? String(p.category_id) === String(filterCategory) : true;
    const matchSearch = searchKeyword ? p.name.toLowerCase().includes(searchKeyword.toLowerCase().trim()) : true;
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4">

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4 d-flex justify-content-between align-items-center w-100">
          <div>
            <h4 className="fw-bold mb-1 text-dark">
              <i className="bi bi-journal-bookmark-fill text-primary me-2"></i>Quản Lý Thực Đơn & Món Ăn
            </h4>
            <p className="text-secondary small mb-0">Thêm mới món ăn, chỉnh sửa đơn giá và quản lý danh mục</p>
          </div>
          <div className="ms-auto">
            {subTab === 'products' ? (
              <button onClick={handleOpenAddProduct} className="btn btn-primary d-flex align-items-center gap-1.5 fw-semibold shadow-sm">
                <i className="bi bi-plus-circle"></i> Thêm Món Mới
              </button>
            ) : (
              <button onClick={handleOpenAddCategory} className="btn btn-success d-flex align-items-center gap-1.5 fw-semibold shadow-sm text-white">
                <i className="bi bi-folder-plus"></i> Thêm Danh Mục
              </button>
            )}
          </div>
        </div>

        <div className="card-footer bg-white border-top px-4 py-2">
          <ul className="nav nav-pills">
            <li className="nav-item">
              <button
                onClick={() => setSubTab('products')}
                className={`nav-link px-3 py-1.5 rounded-pill small fw-semibold ${subTab === 'products' ? 'active bg-primary' : 'text-secondary'}`}
              >
                Món Ăn ({products.length})
              </button>
            </li>
            <li className="nav-item ms-2">
              <button
                onClick={() => setSubTab('categories')}
                className={`nav-link px-3 py-1.5 rounded-pill small fw-semibold ${subTab === 'categories' ? 'active bg-primary' : 'text-secondary'}`}
              >
                Danh Mục ({categories.length})
              </button>
            </li>
          </ul>
        </div>
      </div>
      {subTab === 'products' && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center gap-3">
            <div className="input-group input-group-sm" style={{ maxWidth: '300px' }}>
              <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Tìm món ăn..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <div className="d-flex align-items-center gap-2">
              <select
                className="form-select form-select-sm"
                style={{ width: '180px' }}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">-- Tất cả danh mục --</option>
                {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <button onClick={fetchData} className="btn btn-outline-secondary btn-sm" title="Làm mới"><i className="bi bi-arrow-repeat"></i></button>
            </div>
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5 text-secondary">Đang tải...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-5 text-muted">Không tìm thấy món ăn nào.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light small text-secondary">
                    <tr>
                      <th className="ps-4">Ảnh</th>
                      <th>Tên Món</th>
                      <th>Danh Mục</th>
                      <th>Đơn Giá</th>
                      <th>Nổi Bật</th>
                      <th>Trạng Thái</th>
                      <th className="text-end pe-4">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id}>
                        <td className="ps-4">
                          <img
                            src={p.image_url || FALLBACK_IMAGE}
                            alt={p.name}
                            className="rounded-3 object-cover border"
                            style={{ width: 42, height: 42 }}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                          />
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{p.name}</div>
                          <small className="text-muted">#{p.id}</small>
                        </td>
                        <td><span className="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-1 rounded-pill">{p.category_name}</span></td>
                        <td className="fw-bold text-danger">{Number(p.price).toLocaleString('vi-VN')} đ</td>
                        <td>{p.is_best_seller ? <span className="badge bg-warning text-dark">🔥 Best</span> : '—'}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(p)}
                            className={`btn btn-sm rounded-pill px-2.5 py-0.5 fw-semibold ${p.is_available ? 'btn-success bg-opacity-10 text-success border border-success' : 'btn-secondary bg-opacity-10 text-secondary border'}`}
                          >
                            {p.is_available ? 'Còn Món' : 'Hết Món'}
                          </button>
                        </td>
                        <td className="text-end pe-4">
                          <div className="btn-group btn-group-sm">
                            <button onClick={() => handleOpenEditProduct(p)} className="btn btn-outline-primary" title="Sửa"><i className="bi bi-pencil-square"></i></button>
                            <button onClick={() => handleDeleteProduct(p)} className="btn btn-outline-danger" title="Xóa"><i className="bi bi-trash-fill"></i></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {subTab === 'categories' && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="fw-bold mb-0 text-secondary">Danh Sách Danh Mục ({categories.length})</h6>
            <button onClick={fetchData} className="btn btn-outline-secondary btn-sm"><i className="bi bi-arrow-repeat"></i></button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-secondary">
                  <tr>
                    <th className="ps-4">ID</th>
                    <th>Tên Danh Mục</th>
                    <th>Số Lượng Món</th>
                    <th className="text-end pe-4">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td className="ps-4 fw-bold text-secondary">#{c.id}</td>
                      <td className="fw-bold text-dark fs-6">{c.name}</td>
                      <td><span className="badge bg-primary rounded-pill px-2 py-1">{c.product_count || 0} món</span></td>
                      <td className="text-end pe-4">
                        <div className="btn-group btn-group-sm">
                          <button onClick={() => handleOpenEditCategory(c)} className="btn btn-outline-primary"><i className="bi bi-pencil-square me-1"></i>Sửa</button>
                          <button onClick={() => handleDeleteCategory(c)} className="btn btn-outline-danger"><i className="bi bi-trash-fill"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {showProductModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 shadow-lg border-0">
              <div className="modal-header bg-primary text-white rounded-top-4">
                <h5 className="modal-title fw-bold">{editingProduct ? '✏️ Sửa Món Ăn' : '➕ Thêm Món Mới'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowProductModal(false)}></button>
              </div>
              <form onSubmit={handleSaveProduct}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Tên Món Ăn *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold">Danh Mục *</label>
                      <select
                        className="form-select"
                        value={productForm.category_id}
                        onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                        required
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Đơn Giá (VND) *</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        className="form-control"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Link Ảnh (URL)</label>
                    <input
                      type="url"
                      className="form-control"
                      value={productForm.image_url}
                      onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    />
                  </div>
                  <div className="d-flex gap-4 p-3 bg-light rounded-3 border">
                    <div className="form-check form-switch mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="chkBest"
                        checked={productForm.is_best_seller}
                        onChange={(e) => setProductForm({ ...productForm, is_best_seller: e.target.checked })}
                      />
                      <label className="form-check-label small fw-bold" htmlFor="chkBest">Bán Chạy</label>
                    </div>
                    <div className="form-check form-switch mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="chkAvail"
                        checked={productForm.is_available}
                        onChange={(e) => setProductForm({ ...productForm, is_available: e.target.checked })}
                      />
                      <label className="form-check-label small fw-bold" htmlFor="chkAvail">Còn Món</label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light border-0">
                  <button type="button" className="btn btn-light border" onClick={() => setShowProductModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary fw-bold" disabled={submitting}>
                    {submitting ? 'Đang lưu...' : 'Lưu Món'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showCategoryModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 shadow-lg border-0">
              <div className="modal-header bg-success text-white rounded-top-4">
                <h5 className="modal-title fw-bold">{editingCategory ? '✏️ Sửa Danh Mục' : '➕ Thêm Danh Mục Mới'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCategoryModal(false)}></button>
              </div>
              <form onSubmit={handleSaveCategory}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Tên Danh Mục *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="VD: Món Tráng Miệng & Trà"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light border-0">
                  <button type="button" className="btn btn-light border" onClick={() => setShowCategoryModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-success text-white fw-bold" disabled={submitting}>
                    {submitting ? 'Đang lưu...' : 'Lưu Danh Mục'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
