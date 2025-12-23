// Global Simulation Constants
// Use environment variables in production, fallback to defaults
export const BNB_USD_PRICE = parseFloat(
  process.env.REACT_APP_BNB_USD_PRICE || '380.00'
);
export const BCRD_USD_PEGGED_PRICE = parseFloat(
  process.env.REACT_APP_BCRD_USD_PEGGED_PRICE || '1.0'
);
export const DAY_IN_MS = 24 * 60 * 60 * 1000;

// Production configuration
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const APP_ENV = process.env.REACT_APP_ENV || 'development';

// Mock API Data Store
export const mockData = {
  "BCRD-PERPBNB": {
    b1: {
      ticker_id: "BCRD-PERPBNB",
      base_currency: "BCRD",
      quote_currency: "BNB",
      last_price: "0.0012352",
      base_volume: "1250000.00",
      usd_volume: "463200.00",
      quote_volume: "1544.00",
      bid: "0.0012350",
      ask: "0.0012355",
      high: "0.0012500",
      low: "0.0012200",
      product_type: "Perpetual",
      funding_rate: "0.0001",
      next_funding_rate: "0.00011",
      next_funding_rate_timestamp: "1672531200000",
      maker_fee: "0.00025",
      taker_fee: "0.00023",
    },
    b2: {
      contract_type: "Linear",
      contract_price: 1,
      contract_price_currency: "BNB"
    },
    b4: {
      timestamp: Date.now(),
      orders: []
    }
  }
};

