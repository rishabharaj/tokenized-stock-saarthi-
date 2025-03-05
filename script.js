// Constants and configuration
const CONFIG = {
  API_BASE_URL: 'http://localhost:3000/api',
  REFRESH_INTERVAL: 30000, // 30 seconds
  stockSymbols: ['AAPL', 'TSLA', 'AMZN', 'GOOGL', 'MSFT']
};

// State management
let stocksData = new Map();

// Utility functions
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

const createStockCard = (stock) => {
  const trend = stock.changePercent >= 0 ? 'positive' : 'negative';
  
  return `
    <div class="stock-card" data-symbol="${stock.symbol}">
      <h2>${stock.name}</h2>
      <p>Price: ${formatCurrency(stock.price)}</p>
      <p class="${trend}">${stock.changePercent}%</p>
      <p>Volume: ${stock.volume.toLocaleString()}</p>
      <p>Market Cap: ${formatCurrency(stock.marketCap)}</p>
      <div class="price-range">
        <span>L: ${formatCurrency(stock.dayLow)}</span>
        <span>H: ${formatCurrency(stock.dayHigh)}</span>
      </div>
      <button class="buy-button" onclick="handleBuy('${stock.symbol}')">Buy</button>
    </div>
  `;
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

  const cardsHTML = Array.from(stocksData.values())
    .filter(Boolean)
    .map(createStockCard)
    .join('');
  
  stocksContainer.innerHTML = cardsHTML;
};

// Event handlers
const handleBuy = (symbol) => {
  const stock = stocksData.get(symbol);
  if (!stock) return;

  // Show buy modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Buy ${stock.name}</h2>
      <p>Current Price: ${formatCurrency(stock.price)}</p>
      <input type="number" min="1" value="1" id="quantity"/>
      <button onclick="confirmPurchase('${symbol}')">Confirm</button>
      <button onclick="closeModal()">Cancel</button>
    </div>
  `;
  document.body.appendChild(modal);
};

// Theme management
const initializeTheme = () => {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const savedTheme = localStorage.getItem('theme') || 'light-mode';
  document.body.className = savedTheme;
  updateThemeButton(themeToggle, savedTheme);

  themeToggle.addEventListener('click', () => {
    const newTheme = document.body.classList.contains('light-mode') 
      ? 'dark-mode' 
      : 'light-mode';
    
    document.body.className = newTheme;
    localStorage.setItem('theme', newTheme);
    updateThemeButton(themeToggle, newTheme);
  });
};

// Initialize
const initialize = async () => {
  initializeTheme();
  initializeMobileMenu();
  
  // Initial data fetch
  for (const symbol of CONFIG.stockSymbols) {
    const data = await fetchStockData(symbol);
    if (data) stocksData.set(symbol, data);
  }
  updateStockCards();

  // Set up periodic updates
  setInterval(async () => {
    for (const symbol of CONFIG.stockSymbols) {
      const data = await fetchStockData(symbol);
      if (data) stocksData.set(symbol, data);
    }
    updateStockCards();
  }, CONFIG.REFRESH_INTERVAL);
};

// Start the application
document.addEventListener('DOMContentLoaded', initialize);

// Replace the existing mobile menu functionality with this enhanced version
const initializeMobileMenu = () => {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    
    if (!mobileToggle || !navbarMenu) {
        console.error('Mobile menu elements not found');
        return;
    }

    // Move initialization to the top of the function
    document.addEventListener('DOMContentLoaded', () => {
        mobileToggle.addEventListener('click', () => {
            navbarMenu.classList.toggle('active');
            const isExpanded = navbarMenu.classList.contains('active');
            mobileToggle.setAttribute('aria-expanded', isExpanded);
            
            // Toggle icon
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
    });
};

// Make sure initializeMobileMenu is called before other initializations
document.addEventListener('DOMContentLoaded', () => {
    initializeMobileMenu();
    initialize();
});

// Mobile Navigation Script
const mobileToggle = document.querySelector('.mobile-toggle');
const navbarMenu = document.querySelector('.navbar-menu');

mobileToggle.addEventListener('click', () => {
    navbarMenu.classList.toggle('active');
    const isExpanded = navbarMenu.classList.contains('active');
    mobileToggle.setAttribute('aria-expanded', isExpanded);
    
    const icon = mobileToggle.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar') && navbarMenu.classList.contains('active')) {
        navbarMenu.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', false);
        mobileToggle.querySelector('i').classList.replace('fa-times', 'fa-bars');
    }
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navbarMenu.classList.contains('active')) {
        navbarMenu.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', false);
        mobileToggle.querySelector('i').classList.replace('fa-times', 'fa-bars');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Functionality
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');

    // Check saved theme
    const savedTheme = localStorage.getItem('theme') || 'light-mode';
    document.body.className = savedTheme;
    updateThemeIcon();

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', document.body.className);
        updateThemeIcon();
    });

    function updateThemeIcon() {
        if (document.body.classList.contains('dark-mode')) {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }

    // Mobile Navigation
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');

    mobileToggle.addEventListener('click', () => {
        navbarMenu.classList.toggle('active');
        const isExpanded = navbarMenu.classList.contains('active');
        mobileToggle.setAttribute('aria-expanded', isExpanded);
        
        const menuIcon = mobileToggle.querySelector('i');
        menuIcon.classList.toggle('fa-bars');
        menuIcon.classList.toggle('fa-times');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar') && navbarMenu.classList.contains('active')) {
            navbarMenu.classList.remove('active');
            mobileToggle.setAttribute('aria-expanded', false);
            mobileToggle.querySelector('i').classList.replace('fa-times', 'fa-bars');
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navbarMenu.classList.contains('active')) {
            navbarMenu.classList.remove('active');
            mobileToggle.setAttribute('aria-expanded', false);
            mobileToggle.querySelector('i').classList.replace('fa-times', 'fa-bars');
        }
    });
});
