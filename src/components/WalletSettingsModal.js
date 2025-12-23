import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';

const WalletSettingsModal = ({ isOpen, onClose, onSave, currentAddress, currentTabName }) => {
  const { address, formattedAddress, isConnected, isConnecting, connect, disconnect, isMetaMaskInstalled, error } = useWallet();
  const [tabName, setTabName] = useState(currentTabName);

  useEffect(() => {
    if (isOpen) {
      setTabName(currentTabName);
    }
  }, [isOpen, currentTabName]);

  // Auto-save when wallet connects
  useEffect(() => {
    if (isConnected && address && onSave && isOpen) {
      onSave(address, tabName.trim() || 'BCRD BTC-PERP');
    }
  }, [isConnected, address, isOpen, onSave, tabName]);

  const handleConnect = async () => {
    try {
      const walletData = await connect();
      if (walletData && walletData.address && onSave) {
        onSave(walletData.address, tabName.trim() || 'BCRD BTC-PERP');
      }
    } catch (err) {
      console.error('Connection error:', err);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    if (onSave) {
      onSave('', tabName.trim() || 'BCRD BTC-PERP');
    }
  };

  const handleSave = () => {
    if (isConnected && address) {
      onSave(address, tabName.trim() || 'BCRD BTC-PERP');
      onClose();
    } else if (tabName.trim()) {
      onSave('', tabName.trim() || 'BCRD BTC-PERP');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div id="wallet-settings-popout" className="show">
      <h3>Web3 Wallet Connection</h3>
      
      {!isMetaMaskInstalled ? (
        <div style={{ padding: '15px', backgroundColor: '#0d1117', borderRadius: '6px', marginBottom: '15px' }}>
          <p style={{ color: '#f85149', marginBottom: '10px' }}>
            MetaMask is not installed.
          </p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#58a6ff', textDecoration: 'underline' }}
          >
            Install MetaMask
          </a>
        </div>
      ) : (
        <>
          {isConnected ? (
            <div style={{ padding: '15px', backgroundColor: '#0d1117', borderRadius: '6px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ color: '#8b949e', fontSize: '0.9em' }}>Connected:</span>
                <span style={{ color: '#7ee787', fontWeight: 'bold' }}>{formattedAddress}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#8b949e', fontSize: '0.9em' }}>Address:</span>
                <span style={{ color: '#c9d1d9', fontSize: '0.85em', fontFamily: 'monospace' }}>{address}</span>
              </div>
              <button
                className="btn-sell"
                onClick={handleDisconnect}
                style={{ width: '100%', marginTop: '10px' }}
              >
                Disconnect Wallet
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: '15px' }}>
              <button
                className="btn-save"
                onClick={handleConnect}
                disabled={isConnecting}
                style={{ width: '100%' }}
              >
                {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
              </button>
              {error && (
                <p style={{ color: '#f85149', fontSize: '0.85em', marginTop: '10px' }}>{error}</p>
              )}
            </div>
          )}
        </>
      )}

      <div className="input-group">
        <label htmlFor="terminal-tab-name-input">Terminal Tab Name</label>
        <input
          type="text"
          id="terminal-tab-name-input"
          placeholder="BCRD BTC-PERP"
          value={tabName}
          onChange={(e) => setTabName(e.target.value)}
        />
      </div>
      
      <div className="modal-wallet-footer">
        {isConnected && (
          <button className="btn-save" onClick={handleSave}>
            Save Settings
          </button>
        )}
        <button className="btn-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default WalletSettingsModal;
