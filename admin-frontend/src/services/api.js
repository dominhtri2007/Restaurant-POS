import { API_BASE_URL } from './socket';

const getAuthHeaders = () => {
  const token = localStorage.getItem('pos_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {

  login: async (username, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },
  getMe: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  scanTable: async (tableId) => {
    const res = await fetch(`${API_BASE_URL}/scan/${tableId}`);
    return res.json();
  },
  getSessionByToken: async (token) => {
    const res = await fetch(`${API_BASE_URL}/table/session/${token}`);
    return res.json();
  },
  getMenu: async () => {
    const res = await fetch(`${API_BASE_URL}/menu`);
    return res.json();
  },
  createOrder: async (data) => {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getStoreStatus: async () => {
    const res = await fetch(`${API_BASE_URL}/store/status`);
    return res.json();
  },

  getTables: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/tables`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  createTable: async (data) => {
    const res = await fetch(`${API_BASE_URL}/admin/tables`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateTable: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/admin/tables/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteTable: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/tables/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },
  markTableServed: async (tableId) => {
    const res = await fetch(`${API_BASE_URL}/admin/tables/${tableId}/all-served`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return res.json();
  },
  clearTable: async (tableId, totalAmount = null, paymentMethod = null) => {
    const res = await fetch(`${API_BASE_URL}/admin/tables/${tableId}/clear`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ total_amount: totalAmount, payment_method: paymentMethod })
    });
    return res.json();
  },
  getTableOrders: async (tableId) => {
    const res = await fetch(`${API_BASE_URL}/admin/tables/${tableId}/orders`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  addTableItem: async (tableId, itemData) => {
    const res = await fetch(`${API_BASE_URL}/admin/tables/${tableId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(itemData)
    });
    return res.json();
  },
  updateOrderItem: async (itemId, itemData) => {
    const res = await fetch(`${API_BASE_URL}/admin/order-items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(itemData)
    });
    return res.json();
  },
  deleteOrderItem: async (itemId) => {
    const res = await fetch(`${API_BASE_URL}/admin/order-items/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getReportsSummary: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/admin/reports/summary${query ? `?${query}` : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  getTablesWithQR: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/tables/qrcodes`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getCategories: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/categories`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  createCategory: async (categoryData) => {
    const res = await fetch(`${API_BASE_URL}/admin/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData)
    });
    return res.json();
  },
  updateCategory: async (id, categoryData) => {
    const res = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData)
    });
    return res.json();
  },
  deleteCategory: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getProducts: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.category_id) query.append('category_id', params.category_id);
    if (params.search) query.append('search', params.search);
    const queryString = query.toString() ? `?${query.toString()}` : '';

    const res = await fetch(`${API_BASE_URL}/admin/products${queryString}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  createProduct: async (productData) => {
    const res = await fetch(`${API_BASE_URL}/admin/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    return res.json();
  },
  updateProduct: async (id, productData) => {
    const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    return res.json();
  },
  deleteProduct: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },
  toggleProductAvailability: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/products/${id}/toggle-availability`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getUsers: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  createUser: async (userData) => {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return res.json();
  },
  updateUser: async (id, userData) => {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return res.json();
  },
  deleteUser: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getKitchenOrders: async () => {
    const res = await fetch(`${API_BASE_URL}/kitchen/orders`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  toggleKitchenItem: async (itemId, status) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/order-items/${itemId}/toggle`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return res.json();
  },
  markOrderDone: async (orderId) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/orders/${orderId}/done`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return res.json();
  },
  markTableAllDone: async (tableId) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/tables/${tableId}/all-done`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getShiftStatus: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/pos/shift-status`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  closeShift: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/pos/close-shift`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },
  openShift: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/pos/open-shift`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  }
};
