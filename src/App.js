import React, { useState } from 'react';
import './App.css';
import AMMBot from './components/AMMBot';
import APIManager from './components/APIManager';
import TradeTerminal from './components/TradeTerminal';
import SettlementBot from './components/SettlementBot';
import NotificationModal from './components/NotificationModal';
import { TradingContext } from './context/TradingContext';
import { TradingStateProvider } from './context/TradingStateContext';

function App() {
  const [activeTab, setActiveTab] = useState('amm');
  const [notification, setNotification] = useState(null);

  const showNotification = (title, message) => {
    setNotification({ title, message });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  return (
    <TradingStateProvider>
      <TradingContext.Provider value={{ showNotification }}>
        <div className="App">
          <div className="tab-nav">
            <button
              className={activeTab === 'amm' ? 'active' : ''}
              onClick={() => setActiveTab('amm')}
            >
              AMM Bot
            </button>
            <button
              className={activeTab === 'api' ? 'active' : ''}
              onClick={() => setActiveTab('api')}
            >
              API Manager
            </button>
            <button
              className={activeTab === 'chart' ? 'active' : ''}
              onClick={() => setActiveTab('chart')}
            >
              BCRD BTC-PERP
            </button>
            <button
              className={activeTab === 'settlement' ? 'active' : ''}
              onClick={() => setActiveTab('settlement')}
            >
              Settlement Bot
            </button>
          </div>

          <div className="container">
            {activeTab === 'amm' && <AMMBot />}
            {activeTab === 'api' && <APIManager />}
            {activeTab === 'chart' && <TradeTerminal />}
            {activeTab === 'settlement' && <SettlementBot />}
          </div>

          {notification && (
            <NotificationModal
              title={notification.title}
              message={notification.message}
              onClose={closeNotification}
            />
          )}
        </div>
      </TradingContext.Provider>
    </TradingStateProvider>
  );
}

export default App;

