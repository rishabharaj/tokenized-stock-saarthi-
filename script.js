const stockSymbols = ['AAPL', 'TSLA', 'AMZN']; // Add your desired stock symbols
const stocksContainer = document.querySelector('.stocks-container');

// Fetch data from backend API
const fetchStockData = async (symbol) => {
  try {
    const response = await fetch('http://localhost:3000/api/stock/${symbol}');
    if (!response.ok) throw new Error('Failed to fetch stock data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching data for ${symbol}:', error);
    return null;
  }
};

// Populate stock data dynamically
const displayStockData = async () => {
  stocksContainer.innerHTML = ''; // Clear existing cards
  for (const symbol of stockSymbols) {
    const stock = await fetchStockData(symbol);
    if (stock) {
      const stockCard = document.createElement('div');
      stockCard.className = 'stock-card';

      const trend = stock.changePercent >= 0 ? 'positive' : 'negative';
      stockCard.innerHTML = `
        <h2>${stock.name}</h2>
        <p>Price: $${stock.price}</p>
        <p class="${trend}">${stock.changePercent}%</p>
        <button class="buy-button">Buy</button>
      `;
      stocksContainer.appendChild(stockCard);
    }
  }
};

// Load stock data on page load
displayStockData();