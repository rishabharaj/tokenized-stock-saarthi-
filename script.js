// === Configuration & State ==================================================
const CONFIG = {
  API_BASE_URL: 'http://localhost:3000/api',
  REFRESH_INTERVAL: 300000, // 30 seconds
  stockSymbols: ['AAPL', 'TSLA', 'AMZN', 'GOOGL', 'MSFT']
};

// State management
let stocksData = new Map();
let activeModalCleanup = null;

// Utility functions
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

const createStockCard = (stock) => {
  const trend = stock.changePercent >= 0 ? 'positive' : 'negative';
  const changeFormatted = `${stock.changePercent > 0 ? '+' : ''}${stock.changePercent}%`;
  return `
    <div class="stock-card card" data-symbol="${stock.symbol}" data-name="${stock.name.toLowerCase()}">
      <div class="card-header">
        <h2>${stock.name}</h2>
        <span class="pill">${stock.symbol}</span>
      </div>
      <div class="divider"></div>
      <div class="stock-metrics">
        <span>Price<br><strong>${formatCurrency(stock.price)}</strong></span>
        <span>Change<br><strong class="${trend}">${changeFormatted}</strong></span>
        <span>Low<br><strong>${formatCurrency(stock.dayLow)}</strong></span>
        <span>High<br><strong>${formatCurrency(stock.dayHigh)}</strong></span>
        <span>Volume<br><strong>${stock.volume.toLocaleString()}</strong></span>
        <span>Market Cap<br><strong>${formatCurrency(stock.marketCap)}</strong></span>
      </div>
      <button class="buy-button btn btn-secondary" aria-label="Buy ${stock.name}" data-action="buy" data-symbol="${stock.symbol}">
        <i class="fas fa-cart-plus" aria-hidden="true"></i> Buy
      </button>
    </div>`;
};

// API calls
const fetchStockData = async (symbol) => {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/stock/${symbol}`);
    if (!response.ok) throw new Error('Failed to fetch stock data');
    const data = await response.json();
    return { ...data, symbol };
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return null;
  }
};

// UI updates
const updateStockCards = () => {
  const stocksContainer = document.querySelector('.stocks-container');
  if (!stocksContainer) return;
  const filterValue = (document.getElementById('stock-filter')?.value || '').toLowerCase();
  const cardsHTML = Array.from(stocksData.values())
    .filter(Boolean)
    .filter(s => !filterValue || s.name.toLowerCase().includes(filterValue) || s.symbol.toLowerCase().includes(filterValue))
    .map(createStockCard)
    .join('');
  stocksContainer.innerHTML = cardsHTML;
  const countEl = document.getElementById('stock-count');
  if (countEl) {
    const total = Array.from(stocksData.values()).filter(Boolean).length;
    const visible = stocksContainer.querySelectorAll('.stock-card').length;
    countEl.textContent = visible !== total ? `${visible}/${total} shown` : `${total} stocks`;
  }
};

// Event handlers
const handleBuy = (symbol) => {
  const stock = stocksData.get(symbol);
  if (!stock) return;
  openModal({
    title: `Buy ${stock.name}`,
    body: `
      <p style="margin:0 0 .5rem;">Current Price: <strong>${formatCurrency(stock.price)}</strong></p>
      <label class="form-group" style="margin:0;">
        <span style="font-size:.75rem; font-weight:600; text-transform:uppercase; letter-spacing:.5px;">Quantity</span>
        <input type="number" min="1" value="1" id="order-qty" style="margin-top:.35rem;" />
      </label>
      <div style="font-size:.8rem; opacity:.75;">Estimated Total: <span id="order-total">${formatCurrency(stock.price)}</span></div>
    `,
    actions: [
      { label: 'Cancel', variant: 'btn-muted', close: true },
      { label: 'Confirm Purchase', variant: 'btn', onClick: () => confirmPurchase(symbol) }
    ],
    onOpen: () => {
      const qty = document.getElementById('order-qty');
      const total = document.getElementById('order-total');
      if (qty && total) {
        qty.addEventListener('input', () => {
          const val = Math.max(1, parseInt(qty.value || '1', 10));
          qty.value = val;
          total.textContent = formatCurrency(val * stock.price);
        });
        qty.focus();
      }
    }
  });
};

// Handle mutual fund invest buttons (delegated) similar to buy
const handleInvestFund = (card) => {
  const name = card.querySelector('h2')?.textContent?.trim() || 'Fund';
  const returns = card.querySelector('.returns')?.textContent?.trim() || '';
  openModal({
    title: `Invest: ${name}`,
    body: `<p style="margin:0 0 .75rem;">${returns}</p>
           <label class="form-group" style="margin:0;">
             <span style="font-size:.75rem; font-weight:600; text-transform:uppercase; letter-spacing:.5px;">Amount (₹)</span>
             <input type="number" min="100" step="100" value="1000" id="invest-amount" style="margin-top:.35rem;" />
           </label>
           <div style="font-size:.75rem; opacity:.7; margin-top:.35rem;">Minimum may apply. This is a demo interaction.</div>`,
    actions: [
      { label: 'Close', variant: 'btn-muted', close: true },
      { label: 'Proceed', variant: 'btn-secondary', onClick: () => confirmInvest(name) }
    ],
    onOpen: () => document.getElementById('invest-amount')?.focus()
  });
};

// Modal system
const openModal = ({ title, body, actions = [], onOpen }) => {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-header">
        <h3 class="modal-title" id="modal-title">${title}</h3>
        <button class="modal-close" aria-label="Close dialog">&times;</button>
      </div>
      <div class="modal-body">${body}</div>
      <div class="modal-footer">
        ${actions.map((a,i)=>`<button data-idx="${i}" class="btn ${a.variant||'btn-muted'}">${a.label}</button>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const modalEl = overlay.querySelector('.modal');
  const cleanupFocus = trapFocus(modalEl);
  activeModalCleanup = () => { cleanupFocus && cleanupFocus(); };
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  overlay.querySelector('.modal-close').addEventListener('click', closeModal);
  overlay.querySelectorAll('.modal-footer button').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.getAttribute('data-idx');
      const def = actions[idx];
      if (def?.close) { closeModal(); return; }
      if (def?.onClick) def.onClick();
    });
  });
  document.addEventListener('keydown', escCloseOnce, { once:false });
  if (onOpen) onOpen();
};

const escCloseOnce = (e) => { if (e.key === 'Escape') closeModal(); };
const closeModal = () => {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.remove();
  document.removeEventListener('keydown', escCloseOnce);
  if (activeModalCleanup) { activeModalCleanup(); activeModalCleanup=null; }
};

// Demo confirm functions
const confirmPurchase = (symbol) => {
  const stock = stocksData.get(symbol);
  const qty = parseInt(document.getElementById('order-qty')?.value || '1',10);
  closeModal();
  openModal({
    title:'Order Placed',
    body:`<p style="margin:0;">Purchased <strong>${qty}</strong> shares of <strong>${stock?.name||symbol}</strong> for approximately <strong>${formatCurrency((stock?.price||0)*qty)}</strong>.</p>`,
    actions:[{label:'Done', variant:'btn', close:true}]
  });
};
const confirmInvest = (fundName) => {
  const amt = parseInt(document.getElementById('invest-amount')?.value||'0',10);
  closeModal();
  openModal({
    title:'Investment Initiated',
    body:`<p style="margin:0;">Initiated a demo investment of <strong>₹${amt}</strong> into <strong>${fundName}</strong>. (Demo only)</p>`,
    actions:[{label:'Great!', variant:'btn-secondary', close:true}]
  });
};

// Theme toggle removed — no runtime theme management.

// Accessibility helper for focus trap (future modal use)
const trapFocus = (container) => {
  const focusable = container.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length -1];
  const handler = (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  container.addEventListener('keydown', handler);
  return () => container.removeEventListener('keydown', handler);
};

// Initialize
const initialize = async () => {
  initializeMobileMenu();
  attachGlobalHandlers();
  enableActiveNav();
  enableSmoothScroll();
  await primeStockData();
  scheduleRefresh();
};

const primeStockData = async () => {
  const container = document.querySelector('.stocks-container');
  if (container) container.setAttribute('aria-busy','true');
  const results = await Promise.all(CONFIG.stockSymbols.map(fetchStockData));
  results.forEach(r => { if (r) stocksData.set(r.symbol, r); });
  // Fallback demo data if all null
  if (![...stocksData.values()].length) {
    const demo = [
      { symbol:'AAPL', name:'Apple Inc.', price:172.38, changePercent:1.24, volume:89000000, marketCap: 2700000000000, dayLow:170.2, dayHigh:173.1 },
      { symbol:'TSLA', name:'Tesla Inc.', price:674.23, changePercent:-2.16, volume:54000000, marketCap: 750000000000, dayLow:660.5, dayHigh:690.0 },
      { symbol:'AMZN', name:'Amazon.com', price:123.45, changePercent:0.82, volume:32000000, marketCap: 1600000000000, dayLow:121.8, dayHigh:125.2 }
    ];
    demo.forEach(d => stocksData.set(d.symbol, d));
  }
  updateStockCards();
  if (container) container.setAttribute('aria-busy','false');
};

const scheduleRefresh = () => {
  setInterval(async () => {
    const refreshed = await Promise.all(CONFIG.stockSymbols.map(fetchStockData));
    refreshed.forEach(r => { if (r) stocksData.set(r.symbol, r); });
    updateStockCards();
  }, CONFIG.REFRESH_INTERVAL);
};

const attachGlobalHandlers = () => {
  const filterInput = document.getElementById('stock-filter');
  if (filterInput) filterInput.addEventListener('input', updateStockCards);

  document.body.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action="buy"]');
    if (target) handleBuy(target.getAttribute('data-symbol'));
    const investBtn = e.target.closest('.invest-button');
    if (investBtn) {
      const fundCard = investBtn.closest('.fund-card');
      if (fundCard) handleInvestFund(fundCard);
    }
  });
};

// Start the application
// single DOMContentLoaded listener present earlier; duplicate removed

// Mobile Menu
const initializeMobileMenu = () => {
  const toggle = document.querySelector('.mobile-toggle');
  const menu = document.querySelector('.navbar-menu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    menu.classList.toggle('active');
    const expanded = menu.classList.contains('active');
    toggle.setAttribute('aria-expanded', expanded);
    const icon = toggle.querySelector('i');
    if (icon) icon.className = expanded ? 'fas fa-times' : 'fas fa-bars';
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar') && menu.classList.contains('active')) {
      menu.classList.remove('active');
      toggle.setAttribute('aria-expanded', false);
      const icon = toggle.querySelector('i');
      if (icon) icon.className = 'fas fa-bars';
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && menu.classList.contains('active')) {
      menu.classList.remove('active');
      toggle.setAttribute('aria-expanded', false);
      const icon = toggle.querySelector('i');
      if (icon) icon.className = 'fas fa-bars';
    }
  });
};

document.addEventListener('DOMContentLoaded', initialize);

// Active nav highlighting
const enableActiveNav = () => {
  const links = Array.from(document.querySelectorAll('.navbar-menu a[href*="#"]'));
  if (!links.length) return;
  const sections = links
    .map(l => document.querySelector(l.getAttribute('href').split('#')[1] ? '#' + l.getAttribute('href').split('#')[1] : null))
    .filter(Boolean);
  const setActive = () => {
    const scrollPos = window.scrollY + 120; // offset for sticky nav
    let current = null;
    sections.forEach(sec => { if (sec.offsetTop <= scrollPos) current = sec; });
    links.forEach(l => l.classList.remove('active'));
    if (current) {
      const id = current.getAttribute('id');
      const activeLink = links.find(l => l.getAttribute('href').includes('#'+id));
      if (activeLink) activeLink.classList.add('active');
    }
  };
  window.addEventListener('scroll', setActive, { passive:true });
  setActive();
};

// Smooth scrolling for internal anchors
const enableSmoothScroll = () => {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"], a[href*="index.html#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    const hash = href.includes('#') ? '#' + href.split('#')[1] : null;
    if (hash && document.querySelector(hash)) {
      e.preventDefault();
      document.querySelector(hash).scrollIntoView({ behavior:'smooth', block:'start' });
      history.replaceState(null, '', hash);
    }
  });
};
