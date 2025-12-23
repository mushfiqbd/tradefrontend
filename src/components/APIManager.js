import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTradingStateContext } from '../context/TradingStateContext';
import { mockData } from '../utils/constants';
import { BNB_USD_PRICE } from '../utils/constants';
import { logError } from '../utils/errorHandler';

const APIManager = () => {
  const {
    isBotRunning,
    currentPrice,
    bids,
    asks,
    highPrice,
    lowPrice,
    totalBaseVolume,
    filledOrders,
    transactions,
    getTrades24h,
    getVolume24h,
    openPositions
  } = useTradingStateContext();

  const [apiData, setApiData] = useState('Select an endpoint to view its data.');
  const [tickerId] = useState('BCRD-PERPBNB');
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [copied, setCopied] = useState(false);
  const [endpointUrl, setEndpointUrl] = useState('');

  const generateEndpointUrl = useCallback((endpointId) => {
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://api.example.com';
    const endpoints = {
      b1: `${baseUrl}/v1/contracts/${tickerId}`,
      b2: `${baseUrl}/v1/contracts/${tickerId}/specs`,
      b3: `${baseUrl}/v1/orderbook/${tickerId}`,
      b4: `${baseUrl}/v1/orders/${tickerId}`
    };
    return endpoints[endpointId] || '';
  }, [tickerId]);

  const viewApi = useCallback((endpointId) => {
    try {
      setSelectedEndpoint(endpointId);
      setEndpointUrl(generateEndpointUrl(endpointId));

      if (!isBotRunning && (endpointId === 'b1' || endpointId === 'b3' || endpointId === 'b4')) {
        setApiData(JSON.stringify({
          error: "Bot must be running to view live API data for this endpoint.",
          message: "Please start the AMM Bot first to enable live data."
        }, null, 2));
        return;
      }

      let data;

      switch (endpointId) {
        case 'b1': {
          const b1_base = mockData[tickerId]?.b1 || {};
          const quoteVolume = totalBaseVolume * currentPrice;
          const fundingRate = 0.0001;
          const nextFundingRate = 0.00011;
          const nextFundingRateTimestamp = 1672531200000;
          const makerFee = 0.00025;
          const takerFee = 0.00023;
          const trades24h = getTrades24h();
          const volume24h = getVolume24h();

          data = {
            ...b1_base,
            ticker_id: tickerId,
            last_price: currentPrice.toFixed(7),
            bid: bids.length > 0 ? bids[0][0] : "0.0000000",
            ask: asks.length > 0 ? asks[0][0] : "0.0000000",
            high: highPrice > 0 ? highPrice.toFixed(7) : currentPrice.toFixed(7),
            low: lowPrice < Infinity ? lowPrice.toFixed(7) : currentPrice.toFixed(7),
            base_volume: totalBaseVolume.toFixed(2),
            quote_volume: quoteVolume.toFixed(2),
            usd_volume: (quoteVolume * BNB_USD_PRICE).toFixed(2),
            volume_24h: volume24h.toFixed(2),
            trades_24h: trades24h.length,
            funding_rate: (fundingRate * 100).toFixed(4) + "%",
            next_funding_rate: (nextFundingRate * 100).toFixed(4) + "%",
            next_funding_rate_timestamp: nextFundingRateTimestamp,
            maker_fee: (makerFee * 100).toFixed(4) + "%",
            taker_fee: (takerFee * 100).toFixed(4) + "%",
            timestamp: Date.now()
          };
          break;
        }

        case 'b2': {
          data = {
            ...mockData[tickerId]?.b2,
            ticker_id: tickerId,
            timestamp: Date.now()
          };
          break;
        }

        case 'b3': {
          data = {
            ticker_id: tickerId,
            timestamp: Date.now(),
            asks: asks.slice(0, 50).map(a => [a[0], a[1]]),
            bids: bids.slice(0, 50).map(b => [b[0], b[1]]),
            total_asks: asks.length,
            total_bids: bids.length
          };
          break;
        }

        case 'b4': {
          let openOrders = [];
          if (bids.length > 5 && asks.length > 5) {
            openOrders.push({
              order_id: `ORD_OPEN_${Date.now() + 1}`,
              ticker_id: tickerId,
              side: "BUY",
              price: bids[4][0],
              size: (parseFloat(bids[4][1]) * 0.5).toFixed(2),
              status: "OPEN",
              type: "LIMIT",
              created_at: Date.now()
            });
            openOrders.push({
              order_id: `ORD_OPEN_${Date.now() + 2}`,
              ticker_id: tickerId,
              side: "SELL",
              price: asks[6][0],
              size: (parseFloat(asks[6][1]) * 0.3).toFixed(2),
              status: "OPEN",
              type: "LIMIT",
              created_at: Date.now()
            });
          }
          
          // Include user open positions as orders
          const userPositions = openPositions.map(pos => ({
            order_id: `POS_${pos.id}`,
            ticker_id: tickerId,
            side: pos.side,
            price: pos.entryPrice.toFixed(7),
            size: pos.amount.toFixed(2),
            status: "OPEN",
            type: "MARKET",
            created_at: pos.openTime
          }));

          data = {
            ticker_id: tickerId,
            timestamp: Date.now(),
            orders: [...openOrders, ...userPositions, ...filledOrders.slice(0, 20)],
            total_orders: openOrders.length + userPositions.length + filledOrders.length
          };
          break;
        }

        default:
          data = { error: "Unknown endpoint.", available_endpoints: ['b1', 'b2', 'b3', 'b4'] };
      }

      setApiData(JSON.stringify(data, null, 2));
    } catch (error) {
      logError(error, { component: 'APIManager', action: 'viewApi', endpointId });
      setApiData(JSON.stringify({
        error: "Failed to fetch API data",
        message: error.message
      }, null, 2));
    }
  }, [isBotRunning, currentPrice, bids, asks, highPrice, lowPrice, totalBaseVolume, filledOrders, tickerId, generateEndpointUrl, getTrades24h, getVolume24h, openPositions]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && selectedEndpoint) {
      const interval = setInterval(() => {
        viewApi(selectedEndpoint);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedEndpoint, refreshInterval, viewApi]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(apiData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logError(error, { component: 'APIManager', action: 'copyToClipboard' });
    }
  }, [apiData]);

  const downloadJson = useCallback(() => {
    try {
      const blob = new Blob([apiData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-${selectedEndpoint || 'data'}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      logError(error, { component: 'APIManager', action: 'downloadJson' });
    }
  }, [apiData, selectedEndpoint]);

  const endpointInfo = useMemo(() => {
    const info = {
      b1: { name: 'Contracts', method: 'GET', description: 'Get contract information and market data' },
      b2: { name: 'Contract Specs', method: 'GET', description: 'Get contract specifications' },
      b3: { name: 'Order Book', method: 'GET', description: 'Get live order book data' },
      b4: { name: 'Orders', method: 'GET', description: 'Get order history and open orders' }
    };
    return info[selectedEndpoint] || { name: '', method: '', description: '' };
  }, [selectedEndpoint]);

  return (
    <div className="tab-content active">
      <aside className="sidebar-api">
        <h2>API Endpoint Manager</h2>
        
        <div className="endpoint-section">
          <h3>Endpoint B1 (Contracts)</h3>
          <p style={{ fontSize: '0.85em', color: '#8b949e', marginBottom: '10px' }}>
            Get contract information and market data
          </p>
          <label htmlFor="ticker-id-b1">Ticker ID:</label>
          <input
            type="text"
            id="ticker-id-b1"
            value={tickerId}
            disabled
            style={{ marginBottom: '10px' }}
          />
          <div className="btn-group">
            <button 
              className={`btn-view ${selectedEndpoint === 'b1' ? 'active' : ''}`}
              onClick={() => viewApi('b1')}
            >
              {selectedEndpoint === 'b1' ? '✓ Viewing' : 'View API'}
            </button>
          </div>
        </div>

        <div className="endpoint-section">
          <h3>Endpoint B2 (Contract Specs)</h3>
          <p style={{ fontSize: '0.85em', color: '#8b949e', marginBottom: '10px' }}>
            Get contract specifications
          </p>
          <label htmlFor="ticker-id-b2">Ticker ID:</label>
          <input
            type="text"
            id="ticker-id-b2"
            value={tickerId}
            disabled
            style={{ marginBottom: '10px' }}
          />
          <div className="btn-group">
            <button 
              className={`btn-view ${selectedEndpoint === 'b2' ? 'active' : ''}`}
              onClick={() => viewApi('b2')}
            >
              {selectedEndpoint === 'b2' ? '✓ Viewing' : 'View API'}
            </button>
          </div>
        </div>

        <div className="endpoint-section">
          <h3>Endpoint B3 (Order Book)</h3>
          <p style={{ fontSize: '0.85em', color: '#8b949e', marginBottom: '10px' }}>
            Get live order book data
          </p>
          <label htmlFor="ticker-id-b3">Ticker ID:</label>
          <input
            type="text"
            id="ticker-id-b3"
            value={tickerId}
            disabled
            style={{ marginBottom: '10px' }}
          />
          <div className="btn-group">
            <button 
              className={`btn-view ${selectedEndpoint === 'b3' ? 'active' : ''}`}
              onClick={() => viewApi('b3')}
            >
              {selectedEndpoint === 'b3' ? '✓ Viewing' : 'View Live Order Book'}
            </button>
          </div>
        </div>

        <div className="endpoint-section">
          <h3>Endpoint B4 (Orders)</h3>
          <p style={{ fontSize: '0.85em', color: '#8b949e', marginBottom: '10px' }}>
            Get order history and open orders
          </p>
          <label htmlFor="ticker-id-b4">Ticker ID:</label>
          <input
            type="text"
            id="ticker-id-b4"
            value={tickerId}
            disabled
            style={{ marginBottom: '10px' }}
          />
          <div className="btn-group">
            <button 
              className={`btn-view ${selectedEndpoint === 'b4' ? 'active' : ''}`}
              onClick={() => viewApi('b4')}
            >
              {selectedEndpoint === 'b4' ? '✓ Viewing' : 'View API'}
            </button>
          </div>
        </div>

        {selectedEndpoint && (
          <div className="endpoint-section" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #30363d' }}>
            <h3>Auto Refresh</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <span>Enable auto-refresh</span>
            </label>
            {autoRefresh && (
              <div>
                <label htmlFor="refresh-interval">Interval (ms):</label>
                <input
                  type="number"
                  id="refresh-interval"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Math.max(1000, parseInt(e.target.value) || 5000))}
                  min="1000"
                  step="1000"
                  style={{ width: '100%', marginTop: '5px' }}
                />
              </div>
            )}
          </div>
        )}
      </aside>

      <main className="main-content-api">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1>API Data Viewer</h1>
            {selectedEndpoint && (
              <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#8b949e' }}>
                <span style={{ 
                  display: 'inline-block', 
                  padding: '2px 8px', 
                  backgroundColor: '#238636', 
                  color: '#fff', 
                  borderRadius: '4px',
                  marginRight: '10px',
                  fontSize: '0.85em'
                }}>
                  {endpointInfo.method}
                </span>
                <span>{endpointInfo.description}</span>
              </div>
            )}
          </div>
          {selectedEndpoint && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn-save"
                onClick={copyToClipboard}
                style={{ fontSize: '0.9em' }}
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <button
                className="btn-view"
                onClick={downloadJson}
                style={{ fontSize: '0.9em' }}
              >
                💾 Download JSON
              </button>
            </div>
          )}
        </div>

        {endpointUrl && (
          <div style={{ 
            marginBottom: '15px', 
            padding: '10px', 
            backgroundColor: '#161b22', 
            borderRadius: '6px',
            border: '1px solid #30363d'
          }}>
            <div style={{ fontSize: '0.85em', color: '#8b949e', marginBottom: '5px' }}>API Endpoint URL:</div>
            <code style={{ color: '#58a6ff', wordBreak: 'break-all' }}>{endpointUrl}</code>
          </div>
        )}

        <div className="api-data-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2>API Response</h2>
            {selectedEndpoint && (
              <div style={{ fontSize: '0.85em', color: '#8b949e' }}>
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            )}
          </div>
          <pre style={{ 
            backgroundColor: '#0d1117', 
            padding: '15px', 
            borderRadius: '6px',
            overflow: 'auto',
            maxHeight: '70vh',
            border: '1px solid #30363d'
          }}>
            {apiData}
          </pre>
        </div>

        {!isBotRunning && selectedEndpoint && (selectedEndpoint === 'b1' || selectedEndpoint === 'b3' || selectedEndpoint === 'b4') && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#1c2128',
            border: '1px solid #f85149',
            borderRadius: '6px',
            color: '#f85149'
          }}>
            ⚠️ <strong>Warning:</strong> AMM Bot must be running to view live data for this endpoint.
          </div>
        )}
      </main>
    </div>
  );
};

export default APIManager;

