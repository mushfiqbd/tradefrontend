import React from 'react';
import { useTradingStateContext } from '../context/TradingStateContext';

const SettlementBot = () => {
  const {
    masterWalletBCRD,
    masterWalletBNB,
    overallSettledPNLBCRD,
    transactions,
    getTrades24h,
    getVolume24h
  } = useTradingStateContext();

  const trades24h = getTrades24h();
  const volume24h = getVolume24h();

  return (
    <div className="tab-content active">
      <h1>Exchange Settlement & Ledger</h1>
      <div className="settlement-grid">
        <div className="settlement-panel">
          <h2>Master Wallet Balance (BCRD/BNB)</h2>
          <div className="master-wallet-grid">
            <div className="stat-box">
              <h4>BCRD Holdings (Inventory)</h4>
              <div className="stat-value">{masterWalletBCRD.toFixed(2)}</div>
            </div>
            <div className="stat-box">
              <h4>EXCHANGE FEES / SWAPS (BNB)</h4>
              <div className="stat-value">{masterWalletBNB.toFixed(5)}</div>
            </div>
          </div>
          <h2>Settlement Statistics</h2>
          <div className="stat-box">
            <h4>Overall Settled P&L (BCRD/USD)</h4>
            <div className="stat-value">{overallSettledPNLBCRD.toFixed(2)}</div>
          </div>
          <div className="stat-box">
            <h4>24H Settled Trades</h4>
            <div className="stat-value">{trades24h.length}</div>
          </div>
          <div className="stat-box">
            <h4>24H Volume (BCRD)</h4>
            <div className="stat-value">{volume24h.toFixed(2)}</div>
          </div>
        </div>
        <div className="settlement-panel">
          <h2>Trade History (Settled Positions)</h2>
          <div id="settlement-history-wrapper">
            <table className="trade-history-table">
              <thead>
                <tr>
                  <th>Close Time</th>
                  <th>Side</th>
                  <th>Amount</th>
                  <th>Entry Price</th>
                  <th>Exit Price</th>
                  <th>P&L (BCRD)</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#8b949e' }}>
                      No trades settled yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map(t => {
                    const pnlClass = t.profitLossBCRD >= 0 ? '#2ea043' : '#f85149';
                    return (
                      <tr key={t.id}>
                        <td>{new Date(t.closeTime).toLocaleTimeString()}</td>
                        <td style={{ color: t.side === 'BUY' ? '#7ee787' : '#ff7b72', fontWeight: 'bold' }}>
                          {t.side}
                        </td>
                        <td>{t.amount.toFixed(2)}</td>
                        <td>{t.entryPrice.toFixed(7)}</td>
                        <td>{t.exitPrice.toFixed(7)}</td>
                        <td style={{ color: pnlClass, fontWeight: 'bold' }}>
                          {t.profitLossBCRD.toFixed(2)} BCRD
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlementBot;

