import React, { createContext, useContext } from 'react';
import { useTradingState } from '../hooks/useTradingState';

const TradingStateContext = createContext(null);

export const TradingStateProvider = ({ children }) => {
  const tradingState = useTradingState();

  return (
    <TradingStateContext.Provider value={tradingState}>
      {children}
    </TradingStateContext.Provider>
  );
};

export const useTradingStateContext = () => {
  const context = useContext(TradingStateContext);
  if (!context) {
    throw new Error('useTradingStateContext must be used within TradingStateProvider');
  }
  return context;
};

