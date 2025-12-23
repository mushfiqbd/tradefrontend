import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTradingStateContext } from '../context/TradingStateContext';
import { TradingContext } from '../context/TradingContext';
import ConvertModal from './ConvertModal';
import WalletSettingsModal from './WalletSettingsModal';
import { useWallet } from '../hooks/useWallet';
import { calculatePNL, calculateFee } from '../utils/tradingUtils';
import { apiReady, getDepth, getTicker, getAccount, placeOrder as placeApiOrder } from '../utils/apiClient';
import { 
  validateTradeAmount, 
  validateCollateral, 
  validateBalance,
  validateWalletConnection,
  validateBotRunning,
  validateOrderBook,
  validatePrice
} from '../utils/validation';
import { logError } from '../utils/errorHandler';

/**
 * TradeTerminal Component
 * 
 * BTC PERP Trading Interface
 * 
 * This component handles trading of BTC Perpetual Futures (PERP) contracts.
 * 
 * Key Characteristics:
 * - Protocol-counterparty: Users trade against the protocol, not other traders
 * - Cash-settled: All PNL is settled in BCRD credit, not BTC or BNB
 * - No expiry: Perpetual contracts with no expiration date
 * - Long/Short: Users can go long (BUY) or short (SELL) on BTC price movements
 * 
 * Settlement Flow:
 * 1. User opens/closes position based on BTC price
 * 2. PNL calculated in BCRD based on entry vs exit price
 * 3. Winning trades → BCRD credited to user
 * 4. Losing trades → BCRD debited from user
 * 5. Fees collected in BNB by protocol
 * 
 * Note: Users never own BTC. This is a synthetic exposure to BTC price movements,
 * settled entirely in protocol credit (BCRD).
 */
const TradeTerminal = () => {
  const {
    isBotRunning,
    currentPrice,
    bids,
    asks,
    userBalances,
    openPositions,
    addPosition,
    removePosition,
    positionCounter,
    setPositionCounter,
    updateUserBalances,
    updateMasterWallet,
    addTransaction,
    setOverallSettledPNLBCRD,
    consumeFromOrderBook,
    addUserLimitOrder,
    userLimitOrders,
    removeUserLimitOrder,
    getMergedOrderBook,
    setTotalBaseVolume
  } = useTradingStateContext();

  const { showNotification } = React.useContext(TradingContext);
  const { address, formattedAddress, isConnected } = useWallet();

  const [tradeAmount, setTradeAmount] = useState(1000);
  const [currentWalletAddress, setCurrentWalletAddress] = useState('');
  const [terminalTabName, setTerminalTabName] = useState('BCRD BTC-PERP');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [priceClass, setPriceClass] = useState('');
  const tradingViewWidgetLoaded = useRef(false);
  const [orderType, setOrderType] = useState('MARKET'); // MARKET or LIMIT
  const [limitPrice, setLimitPrice] = useState('');
  const [apiPrice, setApiPrice] = useState(null);
  const [apiBids, setApiBids] = useState([]);
  const [apiAsks, setApiAsks] = useState([]);
  const [apiBalances, setApiBalances] = useState(null);
  const apiEnabled = apiReady;

  // Update wallet address when connected
  useEffect(() => {
    if (isConnected && address) {
      setCurrentWalletAddress(address);
    } else {
      setCurrentWalletAddress('');
    }
  }, [isConnected, address]);

  // Poll backend data when API mode enabled
  useEffect(() => {
    if (!apiEnabled) return;
    let interval;
    const poll = async () => {
      try {
        const [depthData, tickerData, accountData] = await Promise.all([
          getDepth('BTCBCRD'),
          getTicker('BTCBCRD'),
          getAccount()
        ]);
        setApiBids(depthData.bids || []);
        setApiAsks(depthData.asks || []);
        setApiPrice(parseFloat(tickerData.price));
        setApiBalances(accountData.balances);
      } catch (err) {
        console.error('API poll error', err);
        showNotification('API Error', err.message || 'Backend unavailable');
      }
    };
    poll();
    interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [apiEnabled, showNotification]);

  useEffect(() => {
    if (window.TradingView && !tradingViewWidgetLoaded.current) {
      try {
        const symbol = process.env.REACT_APP_TRADINGVIEW_SYMBOL || "BINANCE:BNBUSDT";
        new window.TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: "tradingview_widget"
        });
        tradingViewWidgetLoaded.current = true;
      } catch (error) {
        logError(error, { component: 'TradeTerminal', action: 'loadTradingView' });
      }
    }
  }, []);

  const prevPriceRef = useRef(currentPrice);
  const displayPrice = apiEnabled && apiPrice ? apiPrice : currentPrice;
  
  useEffect(() => {
    if (displayPrice > prevPriceRef.current) {
      setPriceClass('price-up');
    } else if (displayPrice < prevPriceRef.current) {
      setPriceClass('price-down');
    }
    prevPriceRef.current = displayPrice;
  }, [displayPrice]);

  const handleConvert = (amountBNB, amountBCRD) => {
    if (amountBNB > userBalances.bnb) {
      showNotification("Insufficient Funds", `You only have ${userBalances.bnb.toFixed(5)} BNB.`);
      return;
    }

    updateUserBalances(amountBCRD, -amountBNB);
    updateMasterWallet(amountBCRD, -amountBNB);

    showNotification("Conversion Successful", `${amountBNB.toFixed(5)} BNB converted to ${amountBCRD.toFixed(2)} BCRD.`);
  };

  const handleSaveWalletSettings = (address, tabName) => {
    setCurrentWalletAddress(address || '');
    setTerminalTabName(tabName || 'BCRD BTC-PERP');
    if (address) {
      showNotification("Wallet Connected", `Connected to ${formattedAddress || address}`);
    } else {
      showNotification("Wallet Disconnected", "Wallet has been disconnected.");
    }
  };

  const placeTrade = useCallback((side) => {
    try {
      // Validate inputs
      validateWalletConnection(isConnected);
      validateBotRunning(isBotRunning);
      
      const amount = validateTradeAmount(tradeAmount);
      const takerFeeRate = 0.00023; // Use Taker Fee

      // Validate order book
      if (side === 'BUY') {
        validateOrderBook([], apiEnabled ? apiAsks : asks);
      } else if (side === 'SELL') {
        validateOrderBook(apiEnabled ? apiBids : bids, []);
      }

      const bestAskPrice = apiEnabled
        ? (apiAsks.length > 0 ? parseFloat(apiAsks[0][0]) : null)
        : (asks.length > 0 ? parseFloat(asks[0][0]) : null);
      const bestBidPrice = apiEnabled
        ? (apiBids.length > 0 ? parseFloat(apiBids[0][0]) : null)
        : (bids.length > 0 ? parseFloat(bids[0][0]) : null);

      let executionPrice = 0;

      if (side === 'BUY') {
        if (!bestAskPrice) {
          throw new Error("Order book is empty. Cannot buy.");
        }
        executionPrice = bestAskPrice;
      } else if (side === 'SELL') {
        if (!bestBidPrice) {
          throw new Error("Order book is empty. Cannot sell.");
        }
        executionPrice = bestBidPrice;
      }

      const FEE_IN_BNB = calculateFee(amount, takerFeeRate);

      // Validate balances
      validateCollateral(amount, userBalances.bcrd);
      validateBalance(FEE_IN_BNB, userBalances.bnb, 'BNB');

      if (apiEnabled) {
        placeApiOrder({
          symbol: 'BTCBCRD',
          side,
          type: 'MARKET',
          quantity: amount
        }).then(() => {
          showNotification("Trade Executed (API)", `${amount.toFixed(2)} BCRD ${side} @ market.`);
        }).catch((err) => {
          showNotification("Trade Error", err.message || "API trade failed.");
        });
        return;
      }

      // Execute trade - consume from simulated order book
      consumeFromOrderBook(side, amount);
      
      // Update volume
      setTotalBaseVolume(prev => prev + amount);

      // Execute trade
      updateUserBalances(0, -FEE_IN_BNB);
      updateMasterWallet(0, FEE_IN_BNB);

      const newPosition = {
        id: positionCounter + 1,
        side: side,
        amount: amount,
        entryPrice: executionPrice,
        openTime: Date.now()
      };

      setPositionCounter(positionCounter + 1);
      addPosition(newPosition);

      showNotification("Trade Executed", `${amount.toFixed(2)} BCRD ${side} @ ${executionPrice.toFixed(7)} BNB. Fee: ${FEE_IN_BNB.toFixed(5)} BNB.`);
    } catch (error) {
      logError(error, { component: 'TradeTerminal', action: 'placeTrade', side });
      showNotification("Trade Error", error.message || "An error occurred while placing the trade.");
    }
  }, [isConnected, isBotRunning, tradeAmount, asks, bids, userBalances, positionCounter, setPositionCounter, addPosition, updateUserBalances, updateMasterWallet, showNotification, consumeFromOrderBook, setTotalBaseVolume, apiEnabled, apiAsks, apiBids]);

  // Place limit order
  const placeLimitOrder = useCallback(() => {
    try {
      validateWalletConnection(isConnected);
      validateBotRunning(isBotRunning);
      
      const amount = validateTradeAmount(tradeAmount);
      const price = validatePrice(limitPrice);
      
      if (!price || price <= 0) {
        throw new Error('Invalid limit price');
      }

      if (apiEnabled) {
        placeApiOrder({
          symbol: 'BTCBCRD',
          side: orderType === 'LIMIT_BUY' ? 'BUY' : 'SELL',
          type: 'LIMIT',
          quantity: amount,
          price: price
        }).then(() => {
          showNotification("Limit Order Placed (API)", `${amount.toFixed(2)} BCRD @ ${price.toFixed(7)} BNB.`);
          setLimitPrice('');
        }).catch((err) => {
          showNotification("Limit Order Error", err.message || "API error placing limit order.");
        });
        return;
      }

      const FEE_IN_BNB = calculateFee(amount, 0.00025); // Maker fee for limit orders
      validateBalance(FEE_IN_BNB, userBalances.bnb, 'BNB');

      // Create limit order
      const limitOrder = {
        id: `LIMIT_${Date.now()}`,
        side: orderType === 'LIMIT_BUY' ? 'BUY' : 'SELL',
        price: price.toFixed(7),
        size: amount.toFixed(2),
        amount: amount,
        status: 'OPEN',
        type: 'LIMIT',
        createdAt: Date.now(),
        userAddress: currentWalletAddress
      };

      // Add to user limit orders (will be merged into order book)
      addUserLimitOrder(limitOrder);

      // Deduct fee
      updateUserBalances(0, -FEE_IN_BNB);
      updateMasterWallet(0, FEE_IN_BNB);

      showNotification("Limit Order Placed", `${amount.toFixed(2)} BCRD ${limitOrder.side} @ ${price.toFixed(7)} BNB limit order placed.`);
      setLimitPrice('');
    } catch (error) {
      logError(error, { component: 'TradeTerminal', action: 'placeLimitOrder' });
      showNotification("Limit Order Error", error.message || "An error occurred while placing the limit order.");
    }
  }, [isConnected, isBotRunning, tradeAmount, limitPrice, orderType, userBalances, currentWalletAddress, addUserLimitOrder, updateUserBalances, updateMasterWallet, showNotification, apiEnabled]);

  /**
   * Close Position - Cash Settlement in BCRD
   * 
   * This function handles the cash settlement of a BTC PERP position.
   * 
   * Settlement Mechanism:
   * - PNL is calculated based on entry price vs current BTC price
   * - All settlements are in BCRD credit (cash-settled, not physically settled)
   * - Protocol takes opposite side: user profit = protocol loss, user loss = protocol profit
   * - No actual BTC or BNB is transferred to/from user
   * 
   * Master Wallet Updates:
   * - Master BCRD Wallet: Adjusts by opposite of user PNL (protocol's side)
   * - Master BNB Wallet: No change (fees already collected on trade open)
   */
  const closePosition = useCallback((positionId) => {
    try {
      const position = openPositions.find(p => p.id === positionId);
      if (!position) {
        throw new Error('Position not found');
      }

      const exitPrice = currentPrice;
      if (!exitPrice || exitPrice <= 0) {
        throw new Error('Invalid exit price');
      }

      // Calculate PNL in BCRD (cash-settled, not BTC/BNB)
      const profitLossBCRD = calculatePNL(position.entryPrice, exitPrice, position.amount, position.side);

      if (!isFinite(profitLossBCRD)) {
        throw new Error('Invalid PNL calculation');
      }

      // Protocol takes opposite side of trade
      const exchangeProfitLossBCRD = -profitLossBCRD;

      // Update master wallet (protocol's PNL)
      updateMasterWallet(exchangeProfitLossBCRD, 0);
      setOverallSettledPNLBCRD(prev => prev + exchangeProfitLossBCRD);
      // Update user balance (user's PNL in BCRD credit)
      updateUserBalances(profitLossBCRD, 0);

      addTransaction({
        id: position.id,
        side: position.side,
        amount: position.amount,
        entryPrice: position.entryPrice,
        exitPrice: exitPrice,
        profitLossBCRD: profitLossBCRD,
        closeTime: Date.now(),
        userWallet: currentWalletAddress
      });

      removePosition(positionId);

      showNotification("Position Closed", `Closed ${position.amount.toFixed(2)} BCRD position at ${exitPrice.toFixed(7)} BNB. P&L: ${profitLossBCRD.toFixed(2)} BCRD (~$${profitLossBCRD.toFixed(2)}).`);
    } catch (error) {
      logError(error, { component: 'TradeTerminal', action: 'closePosition', positionId });
      showNotification("Close Position Error", error.message || "An error occurred while closing the position.");
    }
  }, [openPositions, currentPrice, updateMasterWallet, setOverallSettledPNLBCRD, updateUserBalances, addTransaction, currentWalletAddress, removePosition, showNotification]);

  return (
    <div className="tab-content active" style={{ flexDirection: 'column' }}>
      <div className="trade-terminal-header">
        <h1 style={{ margin: 0, textAlign: 'left' }}>BCRD BTC-PERP</h1>
        <button 
          className="btn-terminal-settings" 
          onClick={() => setShowWalletModal(true)}
          style={{ 
            backgroundColor: isConnected ? '#2ea44f' : '#58a6ff',
            color: '#0d1117'
          }}
        >
          {isConnected ? `🔗 ${formattedAddress}` : '⚙️ Connect Wallet'}
        </button>
      </div>
      <div className="trade-terminal-grid">
        <WalletSettingsModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onSave={handleSaveWalletSettings}
          currentAddress={currentWalletAddress}
          currentTabName={terminalTabName}
        />
        <div className="chart-container-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '1.1em', color: '#8b949e' }}>Market Price (BCRD BTC-PERP)</div>
            <div className={`last-price-display ${priceClass}`} style={{ fontSize: '1.8em' }}>
              {displayPrice.toFixed(7)}
            </div>
          </div>
          <div className="tradingview-widget-container" style={{ flexGrow: 1, minHeight: '400px', width: '100%' }}>
            <div id="tradingview_widget" style={{ height: '100%', width: '100%' }}></div>
          </div>
        </div>
        <div className="trade-panel">
          <div className="trade-box">
            <h2>Your Account ({isConnected ? formattedAddress : 'Not Connected'})</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: '700' }}>
              <span style={{ color: '#7ee787' }}>BCRD Balance (Payout/Collateral):</span>
              <span>{(apiEnabled && apiBalances ? apiBalances.BCRD : userBalances.bcrd).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontWeight: '700' }}>
              <span style={{ color: '#ff7b72' }}>BNB Balance (Fees/Gas):</span>
              <span>{(apiEnabled && apiBalances ? apiBalances.BNB : userBalances.bnb).toFixed(5)}</span>
            </div>
            <button
              className="btn-save"
              style={{ width: '100%', marginBottom: '20px' }}
              onClick={() => setShowConvertModal(true)}
            >
              Convert BNB to BCRD
            </button>
            <h2>Place Order</h2>
            <div className="input-group">
              <label htmlFor="order-type">Order Type</label>
              <select
                id="order-type"
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                style={{ width: '100%', padding: '8px', backgroundColor: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '4px' }}
              >
                <option value="MARKET">Market Order</option>
                <option value="LIMIT_BUY">Limit Buy</option>
                <option value="LIMIT_SELL">Limit Sell</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="trade-amount-bcrd">Amount (BCRD)</label>
              <input
                type="number"
                id="trade-amount-bcrd"
                value={tradeAmount}
                min="1"
                step="100"
                onChange={(e) => setTradeAmount(parseFloat(e.target.value))}
              />
            </div>
            {orderType.startsWith('LIMIT') && (
              <div className="input-group">
                <label htmlFor="limit-price">Limit Price (BNB)</label>
                <input
                  type="number"
                  id="limit-price"
                  value={limitPrice}
                  step="0.0000001"
                  min="0.0000001"
                  placeholder={currentPrice.toFixed(7)}
                  onChange={(e) => setLimitPrice(e.target.value)}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '20px', marginTop: '25px' }}>
              {orderType === 'MARKET' ? (
                <>
                  <button className="btn-buy" style={{ flex: 1 }} onClick={() => placeTrade('BUY')}>
                    MARKET LONG
                  </button>
                  <button className="btn-sell" style={{ flex: 1 }} onClick={() => placeTrade('SELL')}>
                    MARKET SHORT
                  </button>
                </>
              ) : (
                <button 
                  className={orderType === 'LIMIT_BUY' ? 'btn-buy' : 'btn-sell'} 
                  style={{ flex: 1, width: '100%' }} 
                  onClick={placeLimitOrder}
                >
                  PLACE LIMIT {orderType === 'LIMIT_BUY' ? 'BUY' : 'SELL'}
                </button>
              )}
            </div>
            <p style={{ fontSize: '0.75em', color: '#8b949e', marginTop: '10px' }}>
              {orderType === 'MARKET' 
                ? 'Orders execute against Best Bid/Ask and consume from order book.'
                : 'Limit orders are added to the order book and execute when price is reached.'}
            </p>
          </div>
          <div className="trade-book trade-box" style={{ padding: 0, minHeight: '300px' }}>
            <h2 style={{ padding: '15px 15px 5px 15px', marginBottom: 0, borderBottom: '1px solid #30363d' }}>
              Order Book (BCRD BTC-PERP)
            </h2>
            <div className="trade-book-content">
              <div style={{ flex: 1, overflowY: 'hidden' }}>
                <div id="asks-trade-container" style={{ display: 'flex', flexDirection: 'column-reverse', height: '100%', justifyContent: 'flex-end' }}>
                  <div className="order-header">
                    <span>Price (BNB)</span>
                    <span>Quantity (BCRD)</span>
                    <span>Orders</span>
                  </div>
                  <div id="asks-trade" style={{ overflowY: 'hidden' }}>
                    {useMemo(() => {
                      const mergedAsks = apiEnabled
                        ? [...apiAsks]
                        : getMergedOrderBook(asks, userLimitOrders, 'SELL');
                      return [...mergedAsks].slice(0, 15).reverse().map((item, idx) => (
                        <div key={`ask-trade-${idx}`} className="order-row ask">
                          <span>{item[0]}</span>
                          <span>{item[1]}</span>
                          <span>{item[2] || ''}</span>
                        </div>
                      ));
                    }, [asks, userLimitOrders, getMergedOrderBook, apiEnabled, apiAsks])
                    }
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '5px 0', fontWeight: '700', color: '#c9d1d9' }}>
                {currentPrice.toFixed(7)}
              </div>
              <div style={{ flex: 1, overflowY: 'hidden' }}>
                <div id="bids-trade-container" style={{ height: '100%' }}>
                  <div id="bids-trade" style={{ overflowY: 'hidden' }}>
                    {useMemo(() => {
                      const mergedBids = apiEnabled
                        ? [...apiBids]
                        : getMergedOrderBook(bids, userLimitOrders, 'BUY');
                      return mergedBids.slice(0, 15).map((item, idx) => (
                        <div key={`bid-trade-${idx}`} className="order-row bid">
                          <span>{item[0]}</span>
                          <span>{item[1]}</span>
                          <span>{item[2] || ''}</span>
                        </div>
                      ));
                    }, [bids, userLimitOrders, getMergedOrderBook, apiEnabled, apiBids])
                    }
                  </div>
                  <div className="order-header">
                    <span>Price (BNB)</span>
                    <span>Quantity (BCRD)</span>
                    <span>Orders</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {userLimitOrders.length > 0 && (
        <div className="trade-box" style={{ marginTop: '20px' }}>
          <h2>Your Limit Orders</h2>
          <div className="positions-table-wrapper">
            <table className="positions-table">
              <thead>
                <tr>
                  <th>Side</th>
                  <th>Price (BNB)</th>
                  <th>Size (BCRD)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {userLimitOrders.map(order => (
                  <tr key={order.id}>
                    <td style={{ color: order.side === 'BUY' ? '#7ee787' : '#ff7b72', fontWeight: 'bold' }}>
                      {order.side}
                    </td>
                    <td>{order.price}</td>
                    <td>{order.size}</td>
                    <td style={{ color: order.status === 'OPEN' ? '#7ee787' : '#8b949e' }}>
                      {order.status}
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          removeUserLimitOrder(order.id);
                          showNotification("Order Cancelled", `Limit order ${order.id} cancelled.`);
                        }}
                        style={{
                          padding: '5px 10px',
                          border: 'none',
                          borderRadius: '4px',
                          backgroundColor: '#f85149',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.85em'
                        }}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="trade-box" style={{ marginTop: '20px' }}>
        <h2>Open Positions (BCRD BTC-PERP)</h2>
        <div className="positions-table-wrapper">
          <table className="positions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Side</th>
                <th>Amount (BCRD)</th>
                <th>Entry Price</th>
                <th>Current P&L (BCRD)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {openPositions.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#8b949e' }}>
                    No open positions.
                  </td>
                </tr>
              ) : (
                openPositions.map(position => {
                  const isLong = position.side === 'BUY';
                  const pnlBCRD = calculatePNL(position.entryPrice, currentPrice, position.amount, position.side);
                  const pnlClass = pnlBCRD >= 0 ? '#2ea043' : '#f85149';
                  const rowStyle = isLong
                    ? { backgroundColor: 'rgba(46, 160, 67, 0.1)' }
                    : { backgroundColor: 'rgba(248, 81, 73, 0.1)' };

                  return (
                    <tr key={position.id} style={rowStyle}>
                      <td>{position.id}</td>
                      <td style={{ color: isLong ? '#7ee787' : '#ff7b72', fontWeight: 'bold' }}>
                        {position.side}
                      </td>
                      <td>{position.amount.toFixed(2)}</td>
                      <td>{position.entryPrice.toFixed(7)}</td>
                      <td style={{ color: pnlClass, fontWeight: 'bold' }}>
                        {pnlBCRD.toFixed(2)} BCRD
                      </td>
                      <td>
                        <button
                          onClick={() => closePosition(position.id)}
                          style={{
                            padding: '5px 10px',
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: '#58a6ff',
                            color: '#0d1117',
                            cursor: 'pointer'
                          }}
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ConvertModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        onConvert={handleConvert}
        userBNBBalance={userBalances.bnb}
      />
    </div>
  );
};

export default TradeTerminal;

