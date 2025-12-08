// DOM Elements
const pages = {
  login: document.getElementById('loginPage'),
  register: document.getElementById('registerPage'),
  dashboard: document.getElementById('dashboardPage'),
  listDetail: document.getElementById('listDetailPage'),
  subscription: document.getElementById('subscriptionPage'),
  profile: document.getElementById('profilePage')
};

const navbar = document.getElementById('navbar');
const loadingSpinner = document.getElementById('loadingSpinner');
const toast = document.getElementById('toast');

// Utility Functions
function showLoading() {
  loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
  loadingSpinner.classList.add('hidden');
}

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR');
}

function showPage(pageName) {
  Object.values(pages).forEach(page => page.classList.remove('active'));
  pages[pageName].classList.add('active');
  
  // Update nav active state
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
}

// Auth Functions
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    showLoading();
    await api.auth.login(email, password);
    showToast('Login realizado com sucesso!');
    initDashboard();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;

  try {
    showLoading();
    await api.auth.register(name, email, password);
    showToast('Conta criada com sucesso!');
    initDashboard();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function handleLogout() {
  api.auth.logout();
  navbar.classList.add('hidden');
  showPage('login');
  showToast('Logout realizado com sucesso!');
}

// Dashboard Functions
async function initDashboard() {
  try {
    showLoading();
    navbar.classList.remove('hidden');
    await api.auth.getProfile();
    await loadLists();
    showPage('dashboard');
    document.getElementById('dashboardBtn').classList.add('active');
  } catch (error) {
    showToast(error.message, 'error');
    handleLogout();
  } finally {
    hideLoading();
  }
}

async function loadLists() {
  try {
    showLoading();
    const data = await api.lists.getAll('active');
    renderLists(data.lists);
  } catch (error) {
    showToast('Erro ao carregar listas', 'error');
  } finally {
    hideLoading();
  }
}

function renderLists(lists) {
  const listsGrid = document.getElementById('listsGrid');
  
  if (lists.length === 0) {
    listsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
        <p style="font-size: 1.2rem; color: #666;">
          Você ainda não tem listas. Crie sua primeira lista de compras!
        </p>
      </div>
    `;
    return;
  }

  listsGrid.innerHTML = lists.map(list => `
    <div class="list-card" onclick="openList('${list._id}')">
      <h3>${list.name}</h3>
      <div class="list-card-meta">
        <span>📝 ${list.items.length} itens</span>
        <span>💰 ${formatCurrency(list.totalEstimated)}</span>
      </div>
      <div class="list-card-meta">
        <span>📅 ${formatDate(list.updatedAt)}</span>
      </div>
    </div>
  `).join('');
}

async function createNewList() {
  const name = prompt('Nome da lista:');
  if (!name) return;

  try {
    showLoading();
    await api.lists.create(name);
    showToast('Lista criada com sucesso!');
    await loadLists();
  } catch (error) {
    if (error.message.includes('maximum')) {
      showToast('Limite de listas atingido. Faça upgrade do seu plano!', 'warning');
      showPage('subscription');
    } else {
      showToast(error.message, 'error');
    }
  } finally {
    hideLoading();
  }
}

// List Detail Functions
async function openList(listId) {
  try {
    showLoading();
    await api.lists.getById(listId);
    renderListDetail();
    showPage('listDetail');
  } catch (error) {
    showToast('Erro ao carregar lista', 'error');
  } finally {
    hideLoading();
  }
}

function renderListDetail() {
  const list = api.state.currentList;
  document.getElementById('listTitle').textContent = list.name;
  document.getElementById('totalItems').textContent = list.items.length;
  document.getElementById('totalPrice').textContent = formatCurrency(list.totalEstimated);
  
  const itemsList = document.getElementById('itemsList');
  
  if (list.items.length === 0) {
    itemsList.innerHTML = `
      <p style="text-align: center; color: #666; padding: 2rem;">
        Nenhum item adicionado ainda.
      </p>
    `;
    return;
  }

  itemsList.innerHTML = list.items.map(item => `
    <div class="item ${item.checked ? 'checked' : ''}">
      <input 
        type="checkbox" 
        class="item-checkbox" 
        ${item.checked ? 'checked' : ''}
        onchange="toggleItemChecked('${item._id}')"
      >
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-details">
          ${item.quantity} ${item.unit} • ${item.category}
          ${item.notes ? `• ${item.notes}` : ''}
        </div>
      </div>
      <div class="item-price">${formatCurrency(item.price * item.quantity)}</div>
      <div class="item-actions">
        <button onclick="deleteItem('${item._id}')" title="Excluir">🗑️</button>
      </div>
    </div>
  `).join('');
}

async function handleAddItem(e) {
  e.preventDefault();
  
  const item = {
    name: document.getElementById('itemName').value,
    quantity: parseInt(document.getElementById('itemQuantity').value),
    unit: document.getElementById('itemUnit').value,
    price: parseFloat(document.getElementById('itemPrice').value) || 0,
    category: document.getElementById('itemCategory').value
  };

  try {
    showLoading();
    await api.lists.addItem(api.state.currentList._id, item);
    renderListDetail();
    e.target.reset();
    document.getElementById('itemQuantity').value = 1;
    document.getElementById('itemUnit').value = 'un';
    showToast('Item adicionado!');
  } catch (error) {
    if (error.message.includes('maximum')) {
      showToast('Limite de itens atingido. Faça upgrade do seu plano!', 'warning');
      showPage('subscription');
    } else {
      showToast(error.message, 'error');
    }
  } finally {
    hideLoading();
  }
}

async function toggleItemChecked(itemId) {
  const list = api.state.currentList;
  const item = list.items.find(i => i._id === itemId);
  
  try {
    await api.lists.updateItem(list._id, itemId, { checked: !item.checked });
    renderListDetail();
  } catch (error) {
    showToast('Erro ao atualizar item', 'error');
  }
}

async function deleteItem(itemId) {
  if (!confirm('Deseja excluir este item?')) return;

  try {
    showLoading();
    await api.lists.deleteItem(api.state.currentList._id, itemId);
    renderListDetail();
    showToast('Item excluído!');
  } catch (error) {
    showToast('Erro ao excluir item', 'error');
  } finally {
    hideLoading();
  }
}

async function deleteCurrentList() {
  if (!confirm('Deseja excluir esta lista?')) return;

  try {
    showLoading();
    await api.lists.delete(api.state.currentList._id);
    showToast('Lista excluída!');
    await loadLists();
    showPage('dashboard');
  } catch (error) {
    showToast('Erro ao excluir lista', 'error');
  } finally {
    hideLoading();
  }
}

// Subscription Functions
async function loadSubscriptionPage() {
  const user = api.state.user;
  document.getElementById('currentPlan').textContent = user.subscription.plan.toUpperCase();
  
  let statusText = '';
  if (user.subscription.plan !== 'free') {
    statusText = `Status: ${user.subscription.status === 'active' ? '✅ Ativa' : '❌ Inativa'}`;
    if (user.subscription.endDate) {
      statusText += ` • Válido até: ${formatDate(user.subscription.endDate)}`;
    }
  }
  document.getElementById('planStatus').textContent = statusText;

  showPage('subscription');
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.getElementById('subscriptionBtn').classList.add('active');
}

let currentSelectedPlan = null;

function openPaymentModal(plan) {
  currentSelectedPlan = plan;
  const modal = document.getElementById('paymentModal');
  modal.classList.add('active');
}

function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  modal.classList.remove('active');
  document.getElementById('pixPayment').classList.add('hidden');
  document.getElementById('creditCardPayment').classList.add('hidden');
  document.getElementById('pixQrCode').classList.add('hidden');
}

function selectPaymentMethod(method) {
  document.getElementById('pixPayment').classList.add('hidden');
  document.getElementById('creditCardPayment').classList.add('hidden');
  
  if (method === 'pix') {
    document.getElementById('pixPayment').classList.remove('hidden');
  } else if (method === 'credit_card') {
    document.getElementById('creditCardPayment').classList.remove('hidden');
    initMercadoPagoCardForm();
  }
}

async function handlePixPayment(e) {
  e.preventDefault();
  const cpf = document.getElementById('pixCpf').value;

  try {
    showLoading();
    const response = await api.payments.createPixPayment(currentSelectedPlan, cpf);
    
    // Show QR Code
    document.getElementById('qrCodeImage').src = `data:image/png;base64,${response.payment.qrCodeBase64}`;
    document.getElementById('pixCodeText').value = response.payment.qrCode;
    document.getElementById('pixQrCode').classList.remove('hidden');
    
    // Poll payment status
    pollPaymentStatus(response.payment.id);
    
    showToast('QR Code gerado! Escaneie para pagar.', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function copyPixCode() {
  const pixCode = document.getElementById('pixCodeText');
  pixCode.select();
  document.execCommand('copy');
  showToast('Código PIX copiado!');
}

async function pollPaymentStatus(paymentId) {
  const interval = setInterval(async () => {
    try {
      const response = await api.payments.getPaymentStatus(paymentId);
      
      if (response.payment.status === 'approved') {
        clearInterval(interval);
        document.getElementById('pixStatus').textContent = '✅ Pagamento aprovado!';
        document.getElementById('pixStatus').style.color = 'var(--success-color)';
        
        setTimeout(async () => {
          closePaymentModal();
          await api.auth.getProfile();
          loadSubscriptionPage();
          showToast('Assinatura ativada com sucesso!', 'success');
        }, 2000);
      } else if (response.payment.status === 'rejected') {
        clearInterval(interval);
        document.getElementById('pixStatus').textContent = '❌ Pagamento rejeitado';
        document.getElementById('pixStatus').style.color = 'var(--danger-color)';
      }
    } catch (error) {
      console.error('Error polling payment:', error);
    }
  }, 3000); // Poll every 3 seconds

  // Stop polling after 10 minutes
  setTimeout(() => clearInterval(interval), 600000);
}

function initMercadoPagoCardForm() {
  // This would initialize Mercado Pago card form
  // Requires actual Mercado Pago public key
  const container = document.getElementById('mercadoPagoCardForm');
  container.innerHTML = `
    <p style="text-align: center; padding: 2rem; color: #666;">
      Para implementar o pagamento com cartão de crédito, 
      você precisa configurar sua chave pública do Mercado Pago em <strong>public/js/api.js</strong>
      e implementar o formulário de cartão usando o SDK do Mercado Pago.
    </p>
    <p style="text-align: center; padding: 1rem; color: #666;">
      Documentação: <a href="https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/card/integrate-via-cardform" target="_blank">
        Mercado Pago CardForm
      </a>
    </p>
  `;
}

// Profile Functions
function loadProfilePage() {
  const user = api.state.user;
  document.getElementById('profileName').value = user.name;
  document.getElementById('profileEmail').value = user.email;
  
  showPage('profile');
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.getElementById('profileBtn').classList.add('active');
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const name = document.getElementById('profileName').value;
  const email = document.getElementById('profileEmail').value;

  try {
    showLoading();
    await api.auth.updateProfile(name, email);
    showToast('Perfil atualizado com sucesso!');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Auth events
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('register');
  });
  document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('login');
  });
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // Navigation events
  document.getElementById('dashboardBtn').addEventListener('click', () => {
    loadLists();
    showPage('dashboard');
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.getElementById('dashboardBtn').classList.add('active');
  });
  document.getElementById('subscriptionBtn').addEventListener('click', loadSubscriptionPage);
  document.getElementById('profileBtn').addEventListener('click', loadProfilePage);

  // Dashboard events
  document.getElementById('createListBtn').addEventListener('click', createNewList);

  // List detail events
  document.getElementById('backToListsBtn').addEventListener('click', () => {
    loadLists();
    showPage('dashboard');
  });
  document.getElementById('addItemForm').addEventListener('submit', handleAddItem);
  document.getElementById('deleteListBtn').addEventListener('click', deleteCurrentList);

  // Payment modal events
  document.querySelector('.close').addEventListener('click', closePaymentModal);
  document.querySelectorAll('.payment-method-btn').forEach(btn => {
    btn.addEventListener('click', () => selectPaymentMethod(btn.dataset.method));
  });
  document.getElementById('pixForm').addEventListener('submit', handlePixPayment);
  document.getElementById('copyPixBtn').addEventListener('click', copyPixCode);
  document.querySelectorAll('.upgrade-btn').forEach(btn => {
    btn.addEventListener('click', () => openPaymentModal(btn.dataset.plan));
  });

  // Profile events
  document.getElementById('profileForm').addEventListener('submit', handleUpdateProfile);

  // Check if user is already logged in
  if (api.state.token) {
    initDashboard();
  } else {
    showPage('login');
  }
});

// Make functions globally available
window.openList = openList;
window.toggleItemChecked = toggleItemChecked;
window.deleteItem = deleteItem;
