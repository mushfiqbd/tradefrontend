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
      
      {/* Master Wallet Trade Flow Explanation */}
      <div className="settlement-panel" style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px' }}>
        <h2 style={{ marginTop: 0 }}>Master Wallet Trade Flow</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
          <div style={{ padding: '10px', backgroundColor: '#0d1117', borderRadius: '4px', border: '1px solid #30363d' }}>
            <div style={{ fontSize: '0.85em', color: '#8b949e', marginBottom: '5px' }}>Step 1</div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>User Closes Trade</div>
            <div style={{ fontSize: '0.9em', color: '#c9d1d9' }}>PNL calculated in BCRD</div>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#0d1117', borderRadius: '4px', border: '1px solid #30363d' }}>
            <div style={{ fontSize: '0.85em', color: '#8b949e', marginBottom: '5px' }}>Step 2</div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Master BCRD Lends PNL</div>
            <div style={{ fontSize: '0.9em', color: '#c9d1d9' }}>Temporary credit to user</div>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#0d1117', borderRadius: '4px', border: '1px solid #30363d' }}>
            <div style={{ fontSize: '0.85em', color: '#8b949e', marginBottom: '5px' }}>Step 3</div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Fee Collection</div>
            <div style={{ fontSize: '0.9em', color: '#c9d1d9' }}>BNB fees → Master BNB</div>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#0d1117', borderRadius: '4px', border: '1px solid #30363d' }}>
            <div style={{ fontSize: '0.85em', color: '#8b949e', marginBottom: '5px' }}>Step 4</div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>PNL Credited</div>
            <div style={{ fontSize: '0.9em', color: '#c9d1d9' }}>User receives BCRD</div>
          </div>
        </div>
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#0d1117', borderRadius: '4px', fontSize: '0.85em', color: '#8b949e' }}>
          <strong style={{ color: '#c9d1d9' }}>Note:</strong> All settlements are cash-settled in BCRD. Fees collected in BNB on trade open. Protocol acts as counterparty.
        </div>
      </div>

      <div className="settlement-grid">
        <div className="settlement-panel">
          <h2>Master Wallet Balance (BCRD/BNB)</h2>
          <div className="master-wallet-grid">
            <div className="stat-box">
              <h4>Master BCRD Wallet</h4>
              <div style={{ fontSize: '0.85em', color: '#8b949e', marginBottom: '5px' }}>Holds all BCRD ledger for payouts</div>
              <div className="stat-value">{masterWalletBCRD.toFixed(2)} BCRD</div>
            </div>
            <div className="stat-box">
              <h4>Master BNB Wallet</h4>
              <div style={{ fontSize: '0.85em', color: '#8b949e', marginBottom: '5px' }}>Holds BNB liquidity & collects fees</div>
              <div className="stat-value">{masterWalletBNB.toFixed(5)} BNB</div>
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

