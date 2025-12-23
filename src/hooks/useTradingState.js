import { useState, useRef, useCallback } from 'react';
import { DAY_IN_MS } from '../utils/constants';

export const useTradingState = () => {
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(0.0012352);
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const [userBalances, setUserBalances] = useState({
    bcrd: 5000.00,
    bnb: 100.00
  });
  const [openPositions, setOpenPositions] = useState([]);
  const [positionCounter, setPositionCounter] = useState(0);
  const [masterWalletBCRD, setMasterWalletBCRD] = useState(100000.00);
  const [masterWalletBNB, setMasterWalletBNB] = useState(5000.00);
  const [transactions, setTransactions] = useState([]);
  const [overallSettledPNLBCRD, setOverallSettledPNLBCRD] = useState(0);
  const [highPrice, setHighPrice] = useState(0.0012352);
  const [lowPrice, setLowPrice] = useState(0.0012352);
  const [totalBaseVolume, setTotalBaseVolume] = useState(1250000);
  const [filledOrders, setFilledOrders] = useState([]);
  const [userLimitOrders, setUserLimitOrders] = useState([]); // User limit orders

  const botIntervalRef = useRef(null);

  // Automatically fill qualifying limit orders when price crosses
  const processLimitOrders = useCallback((price) => {
    setUserLimitOrders(prevOrders => {
      const remaining = [];
      const fills = [];

      prevOrders.forEach(order => {
        const trigger = order.side === 'BUY'
          ? price <= parseFloat(order.price)
          : price >= parseFloat(order.price);

        if (trigger) {
          fills.push(order);
        } else {
          remaining.push(order);
        }
      });

      if (fills.length > 0) {
        setPositionCounter(prevCounter => {
          const newPositions = fills.map((order, idx) => ({
            id: prevCounter + idx + 1,
            side: order.side,
            amount: order.amount,
            entryPrice: parseFloat(order.price),
            openTime: Date.now()
          }));

          setOpenPositions(prev => [...prev, ...newPositions]);
          return prevCounter + fills.length;
        });
      }

      return remaining;
    });
  }, []);

  const updatePrice = useCallback((newPrice) => {
    setCurrentPrice(newPrice);
    setHighPrice(prev => newPrice > prev ? newPrice : prev);
    setLowPrice(prev => newPrice < prev ? newPrice : prev);
    processLimitOrders(newPrice);
  }, [processLimitOrders]);

  const addTransaction = useCallback((transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  }, []);

  const updateMasterWallet = useCallback((bcrdDelta, bnbDelta) => {
    setMasterWalletBCRD(prev => prev + bcrdDelta);
    setMasterWalletBNB(prev => prev + bnbDelta);
  }, []);

  const updateUserBalances = useCallback((bcrdDelta, bnbDelta) => {
    setUserBalances(prev => ({
      bcrd: prev.bcrd + bcrdDelta,
      bnb: prev.bnb + bnbDelta
    }));
  }, []);

  const addPosition = useCallback((position) => {
    // Caller is responsible for incrementing positionCounter
    setOpenPositions(prev => [...prev, position]);
  }, []);

  const removePosition = useCallback((positionId) => {
    setOpenPositions(prev => prev.filter(p => p.id !== positionId));
  }, []);

  const getTrades24h = useCallback(() => {
    const now = Date.now();
    return transactions.filter(t => (now - t.closeTime) < DAY_IN_MS);
  }, [transactions]);

  const getVolume24h = useCallback(() => {
    const trades24h = getTrades24h();
    return trades24h.reduce((sum, t) => sum + t.amount, 0);
  }, [getTrades24h]);

  // Add user limit order to order book
  const addUserLimitOrder = useCallback((order) => {
    setUserLimitOrders(prev => [...prev, order]);
  }, []);

  // Remove user limit order
  const removeUserLimitOrder = useCallback((orderId) => {
    setUserLimitOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);

  // Update order book by consuming from it (when user trades)
  const consumeFromOrderBook = useCallback((side, amount) => {
    if (side === 'BUY') {
      setAsks(prev => {
        const newAsks = [...prev];
        let remaining = amount;
        for (let i = 0; i < newAsks.length && remaining > 0; i++) {
          const currentSize = parseFloat(newAsks[i][1]);
          if (currentSize <= remaining) {
            remaining -= currentSize;
            newAsks[i][1] = '0.00';
          } else {
            newAsks[i][1] = (currentSize - remaining).toFixed(2);
            remaining = 0;
          }
        }
        // Remove zero-size orders
        return newAsks.filter(ask => parseFloat(ask[1]) > 0);
      });
    } else if (side === 'SELL') {
      setBids(prev => {
        const newBids = [...prev];
        let remaining = amount;
        for (let i = 0; i < newBids.length && remaining > 0; i++) {
          const currentSize = parseFloat(newBids[i][1]);
          if (currentSize <= remaining) {
            remaining -= currentSize;
            newBids[i][1] = '0.00';
          } else {
            newBids[i][1] = (currentSize - remaining).toFixed(2);
            remaining = 0;
          }
        }
        // Remove zero-size orders
        return newBids.filter(bid => parseFloat(bid[1]) > 0);
      });
    }
  }, []);

  // Merge bot orders with user limit orders
  const getMergedOrderBook = useCallback((botOrders, userOrders, side) => {
    // Combine bot orders and user orders
    const combined = [];
    
    // Add bot orders
    botOrders.forEach(order => {
      combined.push({
        price: parseFloat(order[0]),
        size: parseFloat(order[1]),
        orders: parseInt(order[2]),
        source: 'bot'
      });
    });
    
    // Add user limit orders for this side
    userOrders
      .filter(order => order.side === side)
      .forEach(order => {
        combined.push({
          price: parseFloat(order.price),
          size: parseFloat(order.size),
          orders: 1,
          source: 'user',
          orderId: order.id
        });
      });
    
    // Group by price and merge
    const priceMap = new Map();
    combined.forEach(order => {
      const key = order.price.toFixed(7);
      if (priceMap.has(key)) {
        const existing = priceMap.get(key);
        existing.size += order.size;
        existing.orders += order.orders;
        if (order.source === 'user') {
          existing.hasUserOrder = true;
        }
      } else {
        priceMap.set(key, {
          price: order.price,
          size: order.size,
          orders: order.orders,
          hasUserOrder: order.source === 'user',
          orderId: order.orderId
        });
      }
    });
    
    // Convert back to array format [price, size, orders] and sort
    const merged = Array.from(priceMap.values())
      .map(item => [item.price.toFixed(7), item.size.toFixed(2), item.orders])
      .sort((a, b) => {
        if (side === 'BUY') {
          return parseFloat(b[0]) - parseFloat(a[0]); // Descending for bids
        } else {
          return parseFloat(a[0]) - parseFloat(b[0]); // Ascending for asks
        }
      });
    
    return merged;
  }, []);

  return {
    isBotRunning,
    setIsBotRunning,
    currentPrice,
    setCurrentPrice: updatePrice,
    bids,
    setBids,
    asks,
    setAsks,
    userBalances,
    updateUserBalances,
    openPositions,
    addPosition,
    removePosition,
    positionCounter,
    setPositionCounter,
    masterWalletBCRD,
    masterWalletBNB,
    updateMasterWallet,
    transactions,
    addTransaction,
    overallSettledPNLBCRD,
    setOverallSettledPNLBCRD,
    highPrice,
    lowPrice,
    setHighPrice,
    setLowPrice,
    totalBaseVolume,
    setTotalBaseVolume,
    filledOrders,
    setFilledOrders,
    botIntervalRef,
    getTrades24h,
    getVolume24h,
    userLimitOrders,
    addUserLimitOrder,
    removeUserLimitOrder,
    consumeFromOrderBook,
    getMergedOrderBook
  };
};

