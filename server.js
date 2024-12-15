const express = require('express');
const yahooFinance = require('yahoo-finance2').default;
const cors = require('cors');

const app = express();
app.use(cors()); // Enable frontend-backend communication

const PORT = 3000;

// Route to fetch real-time stock data
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol; // Symbol passed from frontend
    const stockData = await yahooFinance.quote(symbol); // Fetch real-time data
    res.json({
      name: stockData.longName,
      price: stockData.regularMarketPrice,
      changePercent: stockData.regularMarketChangePercent.toFixed(2),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

app.listen(PORT, () => {
  console.log("Server is running at http://localhost:${PORT});
});