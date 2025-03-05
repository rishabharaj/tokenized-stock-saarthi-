from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_caching import Cache
import yfinance as yf
import matplotlib.pyplot as plt
import os
from datetime import datetime, timedelta
import pandas as pd
from threading import Lock
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure caching
cache = Cache(app, config={
    'CACHE_TYPE': 'simple',
    'CACHE_DEFAULT_TIMEOUT': 300
})

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Stock configuration
STOCKS = {
    "AAPL": "Apple Inc.",
    "TSLA": "Tesla Inc.",
    "AMZN": "Amazon.com",
    "TCS.NS": "Tata Consultancy Services Limited",
    "RELIANCE.NS": "Reliance Industries Limited",
    "INFY.NS": "Infosys Limited",
    "HDFCBANK.NS": "HDFC Bank Limited"
}

# Thread-safe plot saving
plot_lock = Lock()

def generate_stock_chart(symbol: str, hist: pd.DataFrame) -> str:
    """Generate and save stock chart."""
    try:
        with plot_lock:
            plt.figure(figsize=(10, 5))
            plt.plot(hist['Close'], label=f'{STOCKS[symbol]} Close Prices')
            plt.title(f'{STOCKS[symbol]} Price Trend (6 Months)')
            plt.xlabel('Date')
            plt.ylabel('Price (USD)')
            plt.legend()
            
            # Ensure directory exists
            os.makedirs('static/charts', exist_ok=True)
            
            # Use timestamp to avoid cache issues
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            chart_path = f"static/charts/{symbol}_{timestamp}.png"
            
            plt.savefig(chart_path)
            plt.close()
            
            return chart_path
    except Exception as e:
        logger.error(f"Error generating chart for {symbol}: {str(e)}")
        raise

@app.route('/stock-data', methods=['GET'])
@cache.cached(timeout=300, query_string=True)
def get_stock_data():
    """Get stock data for all configured symbols."""
    try:
        all_data = {}
        end_date = datetime.now()
        start_date = end_date - timedelta(days=180)

        for symbol, name in STOCKS.items():
            try:
                stock = yf.Ticker(symbol)
                hist = stock.history(start=start_date, end=end_date)

                if hist.empty:
                    all_data[symbol] = {"error": f"No data found for {name}"}
                    continue

                # Generate chart
                chart_path = generate_stock_chart(symbol, hist)

                # Get additional metrics
                info = stock.info
                all_data[symbol] = {
                    "name": name,
                    "current_price": info.get('regularMarketPrice'),
                    "change_percent": info.get('regularMarketChangePercent'),
                    "volume": info.get('regularMarketVolume'),
                    "market_cap": info.get('marketCap'),
                    "pe_ratio": info.get('forwardPE'),
                    "dividend_yield": info.get('dividendYield'),
                    "chart_url": f"/{chart_path}"
                }

            except Exception as e:
                logger.error(f"Error processing {symbol}: {str(e)}")
                all_data[symbol] = {"error": f"Error processing {name}"}

        return jsonify(all_data)

    except Exception as e:
        logger.error(f"General error in get_stock_data: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true')
