const API_BASE = process.env.REACT_APP_API_BASE;

const hasApiBase = () => Boolean(API_BASE);

export const getDepth = async (symbol) => {
  if (!hasApiBase()) throw new Error('API base URL not configured');
  const res = await fetch(`${API_BASE}/frontend/depth?symbol=${symbol}`);
  if (!res.ok) throw new Error('DEPTH_ERROR');
  return res.json();
};

export const getTicker = async (symbol) => {
  if (!hasApiBase()) throw new Error('API base URL not configured');
  const res = await fetch(`${API_BASE}/frontend/ticker?symbol=${symbol}`);
  if (!res.ok) throw new Error('TICKER_ERROR');
  return res.json();
};

export const getAccount = async () => {
  if (!hasApiBase()) throw new Error('API base URL not configured');
  const res = await fetch(`${API_BASE}/frontend/account`);
  if (!res.ok) throw new Error('ACCOUNT_ERROR');
  return res.json();
};

export const placeOrder = async ({ symbol, side, type, quantity, price }) => {
  if (!hasApiBase()) throw new Error('API base URL not configured');
  const res = await fetch(`${API_BASE}/frontend/order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ symbol, side, type, quantity, price })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.msg || err.code || 'ORDER_ERROR');
  }
  return res.json();
};

export const apiReady = hasApiBase();

