import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTradingStateContext } from '../context/TradingStateContext';
import { TradingContext } from '../context/TradingContext';
import { logError } from '../utils/errorHandler';

/**
 * AMM Bot Component
 * 
 * Automated Market Maker for BTC PERP Order Book
 * 
 * This bot maintains the order book for BTC perpetual futures trading.
 * Unlike traditional AMMs where liquidity comes from LPs, this bot:
 * 
 * - Acts as the protocol's market maker
 * - Provides liquidity for all trades (protocol is counterparty)
 * - Maintains bid/ask spreads for price discovery
 * - Updates order book based on BTC price movements
 * 
 * Key Role in BTC PERP System:
 * - Users trade against the protocol (not other traders)
 * - This bot creates the order book that users interact with
 * - All trades execute against protocol liquidity
 * - No external liquidity pools or trader-to-trader matching
 */
const AMMBot = () => {
  const {
    isBotRunning,
    setIsBotRunning,
    currentPrice,
    setCurrentPrice,
    bids,
    setBids,
    asks,
    setAsks,
    botIntervalRef,
    setTotalBaseVolume,
    setFilledOrders
  } = useTradingStateContext();

  const [settings, setSettings] = useState({
    startPrice: 0.0012352,
    orderLevels: 50,
    orderSpread: 0.2,
    minOffersPerLevel: 1,
    maxOffersPerLevel: 3,
    priceIncrement: 0.0000005,
    volatility: 0.0001,
    autoCounterPercent: 2,
    autoCounterLevels: 1,
    updateInterval: 1000,
    fundingRate: 0.0001,
    nextFundingRate: 0.00011,
    nextFundingRateTimestamp: 1672531200000,
    makerFee: 0.00025,
    takerFee: 0.00023,
    pauseTrades: false
  });

  const [botOutput, setBotOutput] = useState('Bot is idle. Press \'Run AMM Bot\' to start the simulation.');
  const [priceClass, setPriceClass] = useState('');
  const prevPriceRef = useRef(settings.startPrice);

  const logToBotOutput = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setBotOutput(prev => {
      const newOutput = `[${timestamp}] ${message}\n${prev}`;
      const lines = newOutput.split('\n');
      return lines.slice(0, 100).join('\n');
    });
  }, []);

  const placeOrders = useCallback(() => {
    try {
      const { orderLevels, orderSpread, priceIncrement, minOffersPerLevel, maxOffersPerLevel } = settings;
      
      if (orderLevels <= 0 || orderLevels > 1000) {
        throw new Error('Invalid order levels');
      }
      if (priceIncrement <= 0) {
        throw new Error('Invalid price increment');
      }
      
      const baseSize = 1000;
      const spread = orderSpread / 100;
      
      let newBids = [];
      let newAsks = [];
      
      const midPrice = currentPrice;
      if (!midPrice || midPrice <= 0) {
        throw new Error('Invalid current price');
      }
      
      let askPrice = midPrice * (1 + spread / 2);
      let bidPrice = midPrice * (1 - spread / 2);

      for (let i = 0; i < orderLevels; i++) {
        const askOrderCount = Math.floor(Math.random() * (maxOffersPerLevel - minOffersPerLevel + 1)) + minOffersPerLevel;
        const totalAskSize = baseSize * askOrderCount;
        newAsks.push([askPrice.toFixed(7), totalAskSize.toFixed(2), askOrderCount]);
        askPrice += priceIncrement * (1 + i * 0.1) * (0.9 + Math.random() * 0.2);

        const bidOrderCount = Math.floor(Math.random() * (maxOffersPerLevel - minOffersPerLevel + 1)) + minOffersPerLevel;
        const totalBidSize = baseSize * bidOrderCount;
        newBids.push([bidPrice.toFixed(7), totalBidSize.toFixed(2), bidOrderCount]);
        bidPrice -= priceIncrement * (1 + i * 0.1) * (0.9 + Math.random() * 0.2);
      }

      // Update only bot orders - user orders are merged separately in display
      setBids(newBids);
      setAsks(newAsks);
    } catch (error) {
      logError(error, { component: 'AMMBot', action: 'placeOrders' });
    }
  }, [settings, currentPrice, setBids, setAsks]);

  const simulationStep = useCallback(() => {
    if (!isBotRunning) return;

    try {
      const { volatility, autoCounterPercent, autoCounterLevels, pauseTrades } = settings;
      const oldPrice = currentPrice;
      
      if (volatility < 0 || volatility > 1) {
        throw new Error('Invalid volatility value');
      }
      
      const change = (Math.random() - 0.5) * 2 * volatility;
      const newPrice = Math.max(0.0000001, currentPrice * (1 + change)); // Prevent negative prices
      setCurrentPrice(newPrice);

      // Update price class
      if (newPrice > oldPrice) {
        setPriceClass('price-up');
      } else if (newPrice < oldPrice) {
        setPriceClass('price-down');
      }
      prevPriceRef.current = newPrice;

      if (!pauseTrades && asks.length > 0 && bids.length > 0) {
        const bestAsk = parseFloat(asks[0][0]);
        const bestBid = parseFloat(bids[0][0]);
        const counterAmount = 1000;

        if (newPrice >= bestAsk) {
          const filledSize = parseFloat(asks[0][1]);
          logToBotOutput(`📈 ASK FILLED at ${bestAsk.toFixed(7)} for ${filledSize.toFixed(2)} BCRD.`);
          setTotalBaseVolume(prev => prev + filledSize);

          setFilledOrders(prev => {
            const newOrder = {
              order_id: `ORD${Date.now()}`,
              ticker_id: "BCRD-PERPBNB",
              side: "SELL",
              price: bestAsk.toFixed(7),
              size: filledSize.toFixed(2),
              status: "FILLED",
              type: "LIMIT"
            };
            const updated = [newOrder, ...prev];
            return updated.slice(0, 20);
          });

          for (let i = 1; i <= autoCounterLevels; i++) {
            const counterPrice = bestAsk * (1 - (autoCounterPercent / 100 * i));
            logToBotOutput(`➡️ COUNTER: Placing a new BID for ${counterAmount.toFixed(2)} BCRD at ${counterPrice.toFixed(7)} BNB.`);
          }
        } else if (newPrice <= bestBid) {
          const filledSize = parseFloat(bids[0][1]);
          logToBotOutput(`📉 BID FILLED at ${bestBid.toFixed(7)} for ${filledSize.toFixed(2)} BCRD.`);
          setTotalBaseVolume(prev => prev + filledSize);

          setFilledOrders(prev => {
            const newOrder = {
              order_id: `ORD${Date.now()}`,
              ticker_id: "BCRD-PERPBNB",
              side: "BUY",
              price: bestBid.toFixed(7),
              size: filledSize.toFixed(2),
              status: "FILLED",
              type: "LIMIT"
            };
            const updated = [newOrder, ...prev];
            return updated.slice(0, 20);
          });

          for (let i = 1; i <= autoCounterLevels; i++) {
            const counterPrice = bestBid * (1 + (autoCounterPercent / 100 * i));
            logToBotOutput(`➡️ COUNTER: Placing a new ASK for ${counterAmount.toFixed(2)} BCRD at ${counterPrice.toFixed(7)} BNB.`);
          }
        }
      }
    } catch (error) {
      logError(error, { component: 'AMMBot', action: 'simulationStep' });
    }
    
    placeOrders();
  }, [isBotRunning, settings, currentPrice, setCurrentPrice, asks, bids, setTotalBaseVolume, setFilledOrders, logToBotOutput, placeOrders, setPriceClass, prevPriceRef]);

  const toggleBot = () => {
    if (isBotRunning) {
      stopBot();
    } else {
      startBot();
    }
  };

  const startBot = () => {
    setIsBotRunning(true);
    setBotOutput('Starting simulation...\n');
    setCurrentPrice(settings.startPrice);
    prevPriceRef.current = settings.startPrice;
    setPriceClass('');

    const updateInterval = settings.updateInterval;
    placeOrders();
    botIntervalRef.current = setInterval(simulationStep, updateInterval);
  };

  const stopBot = () => {
    setIsBotRunning(false);
    if (botIntervalRef.current) {
      clearInterval(botIntervalRef.current);
      botIntervalRef.current = null;
    }
    logToBotOutput('Simulation stopped.');
    setPriceClass('');
  };

  useEffect(() => {
    return () => {
      if (botIntervalRef.current) {
        clearInterval(botIntervalRef.current);
      }
    };
  }, [botIntervalRef]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="tab-content active">
      <aside className="sidebar-amm">
        <h2>BCRD AMM Bot Settings</h2>
        <div className="input-group">
          <label htmlFor="start-price">Start Price (BNB)</label>
          <input
            type="number"
            id="start-price"
            value={settings.startPrice}
            step="0.0000001"
            onChange={(e) => handleSettingChange('startPrice', parseFloat(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label htmlFor="order-levels">Order Levels (Bids/Asks)</label>
          <input
            type="number"
            id="order-levels"
            value={settings.orderLevels}
            step="1"
            onChange={(e) => handleSettingChange('orderLevels', parseInt(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label htmlFor="order-spread">Order Spread %</label>
          <input
            type="number"
            id="order-spread"
            value={settings.orderSpread}
            step="0.01"
            onChange={(e) => handleSettingChange('orderSpread', parseFloat(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label htmlFor="min-offers-per-level">Min Offers per Level</label>
          <input
            type="number"
            id="min-offers-per-level"
            value={settings.minOffersPerLevel}
            step="1"
            onChange={(e) => handleSettingChange('minOffersPerLevel', parseInt(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label htmlFor="max-offers-per-level">Max Offers per Level</label>
          <input
            type="number"
            id="max-offers-per-level"
            value={settings.maxOffersPerLevel}
            step="1"
            onChange={(e) => handleSettingChange('maxOffersPerLevel', parseInt(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label htmlFor="price-increment">Price Increment Multiplier</label>
          <input
            type="number"
            id="price-increment"
            value={settings.priceIncrement}
            step="0.0000001"
            onChange={(e) => handleSettingChange('priceIncrement', parseFloat(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label htmlFor="volatility">Price Volatility (Multiplier)</label>
          <input
            type="number"
            id="volatility"
            value={settings.volatility}
            step="0.00001"
            onChange={(e) => handleSettingChange('volatility', parseFloat(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label htmlFor="auto-counter-percent">Auto Counter %</label>
          <input
            type="number"
            id="auto-counter-percent"
            value={settings.autoCounterPercent}
            step="0.1"
            onChange={(e) => handleSettingChange('autoCounterPercent', parseFloat(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label htmlFor="auto-counter-levels">Auto Counter Levels</label>
          <input
            type="number"
            id="auto-counter-levels"
            value={settings.autoCounterLevels}
            step="1"
            onChange={(e) => handleSettingChange('autoCounterLevels', parseInt(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label htmlFor="update-interval">Update Interval (ms)</label>
          <input
            type="number"
            id="update-interval"
            value={settings.updateInterval}
            step="100"
            onChange={(e) => handleSettingChange('updateInterval', parseInt(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label htmlFor="funding-rate">Funding Rate (%)</label>
          <input
            type="number"
            id="funding-rate"
            value={settings.fundingRate}
            step="0.00001"
            onChange={(e) => handleSettingChange('fundingRate', parseFloat(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label htmlFor="next-funding-rate">Next Funding Rate (%)</label>
          <input
            type="number"
            id="next-funding-rate"
            value={settings.nextFundingRate}
            step="0.00001"
            onChange={(e) => handleSettingChange('nextFundingRate', parseFloat(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label htmlFor="next-funding-rate-timestamp">Next Funding Rate Timestamp (ms)</label>
          <input
            type="number"
            id="next-funding-rate-timestamp"
            value={settings.nextFundingRateTimestamp}
            step="1000"
            onChange={(e) => handleSettingChange('nextFundingRateTimestamp', parseInt(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label htmlFor="maker-fee">Maker Fee (%)</label>
          <input
            type="number"
            id="maker-fee"
            value={settings.makerFee}
            step="0.00001"
            onChange={(e) => handleSettingChange('makerFee', parseFloat(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label htmlFor="taker-fee">Taker Fee (%)</label>
          <input
            type="number"
            id="taker-fee"
            value={settings.takerFee}
            step="0.00001"
            onChange={(e) => handleSettingChange('takerFee', parseFloat(e.target.value))}
          />
        </div>
        <div className="input-group-checkbox">
          <label htmlFor="pause-trades">
            <input
              type="checkbox"
              id="pause-trades"
              checked={settings.pauseTrades}
              onChange={(e) => handleSettingChange('pauseTrades', e.target.checked)}
            />
            Pause Simulated Trades
          </label>
        </div>
        <button
          className={`btn-run ${isBotRunning ? 'running' : ''}`}
          onClick={toggleBot}
        >
          {isBotRunning ? 'Stop AMM Bot' : 'Run AMM Bot'}
        </button>
        <div className="output-box">{botOutput}</div>
      </aside>
      <main className="main-content-amm">
        <div className="order-book-main-display" style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          padding: '20px'
        }}>
          <h1 style={{ marginBottom: '20px', textAlign: 'center' }}>BCRD-PERPBNB Order Book</h1>
          <div className="price-container" style={{ marginBottom: '25px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9em', color: '#8b949e', marginBottom: '10px' }}>Current Price</div>
            <div className={`last-price-display ${priceClass}`} style={{ fontSize: '2em' }}>
              {currentPrice.toFixed(7)}
            </div>
          </div>
          <div className="order-book-container" style={{ 
            width: '100%', 
            maxWidth: '1000px', 
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            flex: 1,
            minHeight: '500px'
          }}>
            <div className="asks-panel" style={{ 
              position: 'relative',
              backgroundColor: '#0d1117',
              borderRadius: '8px',
              padding: '15px',
              border: '1px solid #30363d'
            }}>
              <h3 style={{ 
                position: 'sticky', 
                top: 0, 
                backgroundColor: '#0d1117', 
                zIndex: 10, 
                paddingBottom: '10px', 
                marginBottom: '10px',
                color: '#ff7b72'
              }}>Asks (Sell Orders)</h3>
              <div className="order-header" style={{ 
                position: 'sticky', 
                top: '40px', 
                backgroundColor: '#0d1117', 
                zIndex: 9, 
                paddingBottom: '8px',
                borderBottom: '1px solid #30363d',
                marginBottom: '8px'
              }}>
                <span>Price (BNB)</span>
                <span>Quantity (BCRD)</span>
                <span>Orders</span>
              </div>
              <div style={{ marginTop: '10px', maxHeight: '600px', overflowY: 'auto' }}>
                {[...asks].reverse().map((item, idx) => (
                  <div key={`ask-${idx}`} className="order-row ask flash-ask">
                    <span>{item[0]}</span>
                    <span>{item[1]}</span>
                    <span>{item[2]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bids-panel" style={{ 
              position: 'relative',
              backgroundColor: '#0d1117',
              borderRadius: '8px',
              padding: '15px',
              border: '1px solid #30363d'
            }}>
              <h3 style={{ 
                position: 'sticky', 
                top: 0, 
                backgroundColor: '#0d1117', 
                zIndex: 10, 
                paddingBottom: '10px', 
                marginBottom: '10px',
                color: '#7ee787'
              }}>Bids (Buy Orders)</h3>
              <div className="order-header" style={{ 
                position: 'sticky', 
                top: '40px', 
                backgroundColor: '#0d1117', 
                zIndex: 9, 
                paddingBottom: '8px',
                borderBottom: '1px solid #30363d',
                marginBottom: '8px'
              }}>
                <span>Price (BNB)</span>
                <span>Quantity (BCRD)</span>
                <span>Orders</span>
              </div>
              <div style={{ marginTop: '10px', maxHeight: '600px', overflowY: 'auto' }}>
                {bids.map((item, idx) => (
                  <div key={`bid-${idx}`} className="order-row bid flash-bid">
                    <span>{item[0]}</span>
                    <span>{item[1]}</span>
                    <span>{item[2]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AMMBot;

