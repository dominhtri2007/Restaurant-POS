import { API_BASE_URL } from './socket';

export const api = {

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

  staffLogin: async (username, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  getStaffTables: async (token) => {
    const res = await fetch(`${API_BASE_URL}/staff/tables`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    return res.json();
  },

  getStaffMenu: async (token) => {
    const res = await fetch(`${API_BASE_URL}/staff/menu`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    return res.json();
  },

  createStaffOrder: async (data, token) => {
    const res = await fetch(`${API_BASE_URL}/staff/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
