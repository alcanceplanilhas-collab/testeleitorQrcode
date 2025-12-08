// API Configuration
const API_URL = window.location.origin + '/api';
const MERCADO_PAGO_PUBLIC_KEY = 'YOUR_MERCADO_PAGO_PUBLIC_KEY'; // Will be loaded from config

// State management
const state = {
  token: localStorage.getItem('token'),
  user: null,
  currentList: null,
  lists: []
};

// API Helper
async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

// Auth API
const authAPI = {
  async register(name, email, password) {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('token', data.token);
    return data;
  },

  async login(email, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('token', data.token);
    return data;
  },

  async getProfile() {
    const data = await apiRequest('/auth/me');
    state.user = data.user;
    return data;
  },

  async updateProfile(name, email) {
    const data = await apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({ name, email })
    });
    state.user = data.user;
    return data;
  },

  logout() {
    state.token = null;
    state.user = null;
    state.lists = [];
    state.currentList = null;
    localStorage.removeItem('token');
  }
};

// Shopping Lists API
const listsAPI = {
  async getAll(status) {
    const query = status ? `?status=${status}` : '';
    const data = await apiRequest(`/lists${query}`);
    state.lists = data.lists;
    return data;
  },

  async getById(id) {
    const data = await apiRequest(`/lists/${id}`);
    state.currentList = data.list;
    return data;
  },

  async create(name, items = []) {
    const data = await apiRequest('/lists', {
      method: 'POST',
      body: JSON.stringify({ name, items })
    });
    return data;
  },

  async update(id, updates) {
    const data = await apiRequest(`/lists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    state.currentList = data.list;
    return data;
  },

  async delete(id) {
    await apiRequest(`/lists/${id}`, {
      method: 'DELETE'
    });
    state.lists = state.lists.filter(list => list._id !== id);
  },

  async addItem(listId, item) {
    const data = await apiRequest(`/lists/${listId}/items`, {
      method: 'POST',
      body: JSON.stringify(item)
    });
    state.currentList = data.list;
    return data;
  },

  async updateItem(listId, itemId, updates) {
    const data = await apiRequest(`/lists/${listId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    state.currentList = data.list;
    return data;
  },

  async deleteItem(listId, itemId) {
    const data = await apiRequest(`/lists/${listId}/items/${itemId}`, {
      method: 'DELETE'
    });
    state.currentList = data.list;
    return data;
  }
};

// Payments API
const paymentsAPI = {
  async getPlans() {
    return await apiRequest('/payments/plans');
  },

  async createPixPayment(plan, cpf) {
    return await apiRequest('/payments/pix', {
      method: 'POST',
      body: JSON.stringify({
        plan,
        identificationNumber: cpf.replace(/\D/g, '')
      })
    });
  },

  async createCreditCardPayment(plan, paymentData) {
    return await apiRequest('/payments/credit-card', {
      method: 'POST',
      body: JSON.stringify({
        plan,
        ...paymentData
      })
    });
  },

  async createPreference(plan) {
    return await apiRequest('/payments/preference', {
      method: 'POST',
      body: JSON.stringify({ plan })
    });
  },

  async getPaymentStatus(paymentId) {
    return await apiRequest(`/payments/${paymentId}/status`);
  },

  async getHistory() {
    return await apiRequest('/payments/history');
  }
};

// Export API modules
window.api = {
  auth: authAPI,
  lists: listsAPI,
  payments: paymentsAPI,
  state
};
