from flask import Flask, request, jsonify
import yfinance as yf
import matplotlib.pyplot as plt
import os

app = Flask(__name__)

# Stock symbols for all companies
STOCKS = {
    "AAPL": "Apple Inc.",
    "TSLA": "Tesla Inc.",
    "AMZN": "Amazon.com",
    "TCS": "Tata Consultancy Services Limited",
    "RELIANCE": "Reliance Industries Limited",
    "INFY": "Infosys Limited",
    "HDFC": "HDFC Bank Limited"
}

@app.route('/stock-data', methods=['GET'])
def get_stock_data():
    # Fetch all stock data
    all_data = {}
    try:
        os.makedirs('static', exist_ok=True)  # Ensure 'static' directory exists

        for symbol, name in STOCKS.items():
            stock = yf.Ticker(symbol)
            hist = stock.history(period="6mo")  # Get 6 months of data

            if hist.empty:
                all_data[symbol] = {"error": f"No data found for {name}"}
                continue

            # Generate chart for each stock
            plt.figure(figsize=(10, 5))
            plt.plot(hist['Close'], label=f'{name} Close Prices')
            plt.title(f'{name} Price Trend (6 Months)')
            plt.xlabel('Date')
            plt.ylabel('Price (USD)')
            plt.legend()
            chart_path = f"static/{symbol}_chart.png"
            plt.savefig(chart_path)
            plt.close()

            # Store data for each stock
            all_data[symbol] = {
                "name": name,
                "current_price": stock.info.get('regularMarketPrice', 'N/A'),
                "chart_url": f"/{chart_path}"
            }

        return jsonify(all_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
