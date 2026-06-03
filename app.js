// ============================
// DATOS DEL MENÚ
// ============================
const MENU = [
  { id: 'picadillo',  name: 'Picadillo',  price: 40, img: 'picadillo.webp',  caja: 'aurora' },
  { id: 'chicharron', name: 'Chicharrón', price: 40, img: 'chicaron.jpg', caja: 'aurora' },
  { id: 'discada',    name: 'Discada',    price: 40, img: 'discada.jpg',    caja: 'aurora' },
  { id: 'asado',      name: 'Asado',      price: 40, img: 'azado.jpg',      caja: 'aurora' },
  { id: 'huevo',      name: 'Huevo',      price: 30, img: 'huevo.jpg',      caja: 'aurora' },
  { id: 'nopal',      name: 'Nopal',      price: 30, img: 'nopal.jpg',      caja: 'aurora' },
  { id: 'queso',      name: 'Queso',      price: 30, img: 'queso.jpg',      caja: 'aurora' },
  { id: 'gorditas',   name: 'Gorditas',   price: 10, img: 'gorditas.jpeg',   caja: 'aurora' },
  { id: 'frijol',     name: 'Frijol',     price: 30, img: 'frijol.jpg',     caja: 'xochil' },
  { id: 'salsa',      name: 'Salsa',      price: 20, img: 'salsa.jpg',      caja: 'xochil' },
  { id: 'tortillas',  name: 'Tortillas',  price: 2,  img: 'tortilla.jpeg',  caja: 'xochil' },
];

// ============================
// ESTADO DE LA APP
// ============================

// Estado de días: { dayNumber: { orders: N, aurora: $, xochil: $ } }
let daysData = loadDaysData();
let currentDay = loadCurrentDay();
let order = {}; // pedido activo: { id: cantidad }

// ============================
// PERSISTENCIA (localStorage)
// ============================

function loadDaysData() {
  try {
    const raw = localStorage.getItem('restaurante_days');
    return raw ? JSON.parse(raw) : { 1: { orders: 0, aurora: 0, xochil: 0 } };
  } catch {
    return { 1: { orders: 0, aurora: 0, xochil: 0 } };
  }
}

function loadCurrentDay() {
  try {
    return parseInt(localStorage.getItem('restaurante_currentDay')) || 1;
  } catch {
    return 1;
  }
}

function saveAll() {
  try {
    localStorage.setItem('restaurante_days', JSON.stringify(daysData));
    localStorage.setItem('restaurante_currentDay', String(currentDay));
  } catch {}
}

function ensureDay(n) {
  if (!daysData[n]) {
    daysData[n] = { orders: 0, aurora: 0, xochil: 0 };
  }
}

// ============================
// HELPERS
// ============================

function fmt(n) {
  return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0 });
}

function getOrderTotal() {
  return Object.entries(order).reduce((sum, [id, qty]) => {
    const item = MENU.find(m => m.id === id);
    return sum + item.price * qty;
  }, 0);
}

function getOrderCajas() {
  let aurora = 0, xochil = 0;
  Object.entries(order).forEach(([id, qty]) => {
    const item = MENU.find(m => m.id === id);
    if (item.caja === 'aurora') aurora += item.price * qty;
    else xochil += item.price * qty;
  });
  return { aurora, xochil };
}

// ============================
// RENDERIZADO MENÚ
// ============================

function renderMenu() {
  const auroraGrid = document.getElementById('menuAurora');
  const xochilGrid = document.getElementById('menuXochil');
  auroraGrid.innerHTML = '';
  xochilGrid.innerHTML = '';

  MENU.forEach(item => {
    const qty = order[item.id] || 0;
    const div = document.createElement('div');
    div.className = `menu-item ${item.caja}-item`;
    div.setAttribute('data-id', item.id);
    div.innerHTML = `
      <img class="item-img" src="${item.img}" alt="${item.name}" />
      <div class="item-name">${item.name}</div>
      <div class="item-price">${fmt(item.price)}</div>
      <span class="item-badge badge-${item.caja}">${item.caja === 'aurora' ? 'Aurora' : 'Xochil'}</span>
      ${qty > 0 ? `<div class="qty-badge">${qty}</div>` : ''}
    `;
    div.addEventListener('click', () => addItem(item.id));
    if (item.caja === 'aurora') auroraGrid.appendChild(div);
    else xochilGrid.appendChild(div);
  });
}

// ============================
// RENDERIZADO PEDIDO
// ============================

function renderOrder() {
  const container = document.getElementById('orderItems');
  const keys = Object.keys(order);

  if (keys.length === 0) {
    container.innerHTML = `
      <div class="empty-order">
        <span class="empty-icon">🧾</span>
        <p>Sin productos aún</p>
      </div>`;
    return;
  }

  container.innerHTML = '';
  keys.forEach(id => {
    const item = MENU.find(m => m.id === id);
    const qty = order[id];
    const div = document.createElement('div');
    div.className = 'order-row';
    div.innerHTML = `
      <span class="order-item-name">${item.name}</span>
      <div class="qty-controls">
        <button class="qty-btn" data-id="${id}" data-d="-1">−</button>
        <span class="qty-num">${qty}</span>
        <button class="qty-btn" data-id="${id}" data-d="1">+</button>
      </div>
      <span class="order-subtotal">${fmt(item.price * qty)}</span>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      changeQty(btn.dataset.id, parseInt(btn.dataset.d));
    });
  });
}

function renderOrderFooter() {
  const total = getOrderTotal();
  const cajas = getOrderCajas();

  document.getElementById('totalAmount').textContent = fmt(total);
  document.getElementById('btnConfirm').disabled = total === 0;

  const cajaMini = document.getElementById('cajaMini');
  if (total > 0) {
    cajaMini.style.display = 'block';
    document.getElementById('miniAurora').textContent = fmt(cajas.aurora);
    document.getElementById('miniXochil').textContent = fmt(cajas.xochil);
  } else {
    cajaMini.style.display = 'none';
  }
}

// ============================
// RENDERIZADO TOPBAR (día)
// ============================

function renderTopbar() {
  ensureDay(currentDay);
  const data = daysData[currentDay];

  document.getElementById('dayLabel').textContent = `Día ${currentDay}`;
  document.getElementById('statTotal').textContent = fmt(data.aurora + data.xochil);
  document.getElementById('statAurora').textContent = fmt(data.aurora);
  document.getElementById('statXochil').textContent = fmt(data.xochil);
  document.getElementById('statOrders').textContent = data.orders;
}

// ============================
// RENDERIZADO GLOBAL
// ============================

function renderAll() {
  renderMenu();
  renderOrder();
  renderOrderFooter();
  renderTopbar();
}

// ============================
// ACCIONES DE PEDIDO
// ============================

function addItem(id) {
  order[id] = (order[id] || 0) + 1;
  renderAll();
}

function changeQty(id, delta) {
  order[id] = (order[id] || 0) + delta;
  if (order[id] <= 0) delete order[id];
  renderAll();
}

function clearOrder() {
  order = {};
  renderAll();
}

// ============================
// MODAL DE COBRO
// ============================

function openPayModal() {
  const total = getOrderTotal();
  const cajas = getOrderCajas();

  // Resumen del pedido
  const summary = document.getElementById('paySummary');
  let rows = '';
  Object.entries(order).forEach(([id, qty]) => {
    const item = MENU.find(m => m.id === id);
    rows += `<div class="summary-row"><span>${item.name} ×${qty}</span><span>${fmt(item.price * qty)}</span></div>`;
  });
  rows += `<div class="summary-row total"><span>Total</span><span>${fmt(total)}</span></div>`;
  summary.innerHTML = rows;

  // Cajas
  document.getElementById('modalCajas').innerHTML = `
    <div class="caja-card aurora">
      <div class="caja-card-name">Aurora</div>
      <div class="caja-card-amount">${fmt(cajas.aurora)}</div>
    </div>
    <div class="caja-card xochil">
      <div class="caja-card-name">Xochil</div>
      <div class="caja-card-amount">${fmt(cajas.xochil)}</div>
    </div>
  `;

  // Reset input y cambio
  document.getElementById('pagoInput').value = '';
  const cambioBox = document.getElementById('cambioBox');
  cambioBox.className = 'cambio-box';
  document.getElementById('cambioAmount').textContent = '$0';

  document.getElementById('payOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('pagoInput').focus(), 100);
}

function closePayModal() {
  document.getElementById('payOverlay').classList.add('hidden');
}

function finalizarVenta() {
  const pago = parseFloat(document.getElementById('pagoInput').value) || 0;
  const total = getOrderTotal();
  const cajas = getOrderCajas();
  const cambio = pago - total;

  if (pago < total) {
    alert('El pago es menor al total. Por favor ingresa el monto correcto.');
    return;
  }

  // Actualizar datos del día
  ensureDay(currentDay);
  daysData[currentDay].aurora += cajas.aurora;
  daysData[currentDay].xochil += cajas.xochil;
  daysData[currentDay].orders += 1;
  saveAll();

  // Cerrar modal de cobro
  closePayModal();

  // Mostrar modal de éxito
  const successData = daysData[currentDay];
  document.getElementById('successMsg').textContent =
    `Pagó ${fmt(pago)} • Cambio: ${fmt(cambio)} • Venta #${successData.orders} del día`;

  document.getElementById('successCajas').innerHTML = `
    <div class="caja-card aurora">
      <div class="caja-card-name">Aurora hoy</div>
      <div class="caja-card-amount">${fmt(successData.aurora)}</div>
    </div>
    <div class="caja-card xochil">
      <div class="caja-card-name">Xochil hoy</div>
      <div class="caja-card-amount">${fmt(successData.xochil)}</div>
    </div>
  `;

  document.getElementById('successOverlay').classList.remove('hidden');
}

// ============================
// MANEJO DE DÍAS
// ============================

function goToDay(n) {
  if (n < 1) return;
  currentDay = n;
  ensureDay(currentDay);
  saveAll();
  order = {};
  renderAll();
}

function addNewDay() {
  const maxDay = Math.max(...Object.keys(daysData).map(Number));
  goToDay(maxDay + 1);
}

// ============================
// EVENT LISTENERS
// ============================

document.addEventListener('DOMContentLoaded', () => {

  // Navegación de días
  document.getElementById('btnPrevDay').addEventListener('click', () => {
    goToDay(currentDay - 1);
  });

  document.getElementById('btnNextDay').addEventListener('click', () => {
    goToDay(currentDay + 1);
  });

  document.getElementById('btnNewDay').addEventListener('click', () => {
    addNewDay();
  });

  // Limpiar pedido
  document.getElementById('btnClearOrder').addEventListener('click', () => {
    if (Object.keys(order).length > 0) clearOrder();
  });

  // Confirmar pedido → abrir modal cobro
  document.getElementById('btnConfirm').addEventListener('click', openPayModal);

  // Cancelar cobro
  document.getElementById('btnCancelarPago').addEventListener('click', closePayModal);
  document.getElementById('btnCancelarPago2').addEventListener('click', closePayModal);

  // Calcular cambio en tiempo real
  document.getElementById('pagoInput').addEventListener('input', () => {
    const pago = parseFloat(document.getElementById('pagoInput').value) || 0;
    const total = getOrderTotal();
    const cambio = pago - total;
    const cambioBox = document.getElementById('cambioBox');
    const cambioAmount = document.getElementById('cambioAmount');

    if (pago === 0) {
      cambioBox.className = 'cambio-box';
      cambioAmount.textContent = '$0';
    } else if (cambio >= 0) {
      cambioBox.className = 'cambio-box ok';
      cambioAmount.textContent = fmt(cambio);
    } else {
      cambioBox.className = 'cambio-box error';
      cambioAmount.textContent = `−${fmt(Math.abs(cambio))}`;
    }
  });

  // Finalizar venta
  document.getElementById('btnFinalizarPago').addEventListener('click', finalizarVenta);

  // Nuevo pedido tras éxito
  document.getElementById('btnNuevoPedido').addEventListener('click', () => {
    document.getElementById('successOverlay').classList.add('hidden');
    order = {};
    renderAll();
  });

  // Cerrar modales clickando el overlay (fuera del modal)
  document.getElementById('payOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('payOverlay')) closePayModal();
  });

  document.getElementById('successOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('successOverlay')) {
      document.getElementById('successOverlay').classList.add('hidden');
      order = {};
      renderAll();
    }
  });

  // Render inicial
  renderAll();
});
