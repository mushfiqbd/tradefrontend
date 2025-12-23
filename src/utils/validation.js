/**
 * Validation Utilities
 * 
 * Input validation and sanitization for production safety
 */

import { BCRD_USD_PEGGED_PRICE } from './constants';

const MAX_TRADE_AMOUNT = parseFloat(process.env.REACT_APP_MAX_TRADE_AMOUNT || '1000000');
const MIN_TRADE_AMOUNT = parseFloat(process.env.REACT_APP_MIN_TRADE_AMOUNT || '1');

/**
 * Validate trade amount
 */
export const validateTradeAmount = (amount) => {
  const num = parseFloat(amount);
  
  if (isNaN(num) || !isFinite(num)) {
    throw new Error('Invalid amount. Please enter a valid number.');
  }
  
  if (num <= 0) {
    throw new Error('Amount must be greater than zero.');
  }
  
  if (num < MIN_TRADE_AMOUNT) {
    throw new Error(`Minimum trade amount is ${MIN_TRADE_AMOUNT} BCRD.`);
  }
  
  if (num > MAX_TRADE_AMOUNT) {
    throw new Error(`Maximum trade amount is ${MAX_TRADE_AMOUNT} BCRD.`);
  }
  
  return num;
};

/**
 * Validate price
 */
export const validatePrice = (price) => {
  const num = parseFloat(price);
  
  if (isNaN(num) || !isFinite(num)) {
    throw new Error('Invalid price');
  }
  
  if (num <= 0) {
    throw new Error('Price must be greater than zero');
  }
  
  return num;
};

/**
 * Validate balance sufficiency
 */
export const validateBalance = (required, available, currency = 'BCRD') => {
  if (required > available) {
    throw new Error(
      `Insufficient ${currency} balance. Required: ${required.toFixed(2)}, Available: ${available.toFixed(2)}`
    );
  }
};

/**
 * Validate collateral requirement
 */
export const validateCollateral = (amount, availableBCRD) => {
  const requiredCollateral = amount * BCRD_USD_PEGGED_PRICE;
  validateBalance(requiredCollateral, availableBCRD, 'BCRD');
};

/**
 * Validate wallet connection
 */
export const validateWalletConnection = (isConnected) => {
  if (!isConnected) {
    throw new Error('Wallet not connected. Please connect your wallet to continue.');
  }
};

/**
 * Validate bot running state
 */
export const validateBotRunning = (isBotRunning) => {
  if (!isBotRunning) {
    throw new Error('AMM Bot is not running. Please start the bot to enable trading.');
  }
};

/**
 * Validate order book availability
 */
export const validateOrderBook = (bids, asks) => {
  if (!bids || bids.length === 0) {
    throw new Error('Order book is empty. Cannot execute trade.');
  }
  if (!asks || asks.length === 0) {
    throw new Error('Order book is empty. Cannot execute trade.');
  }
};

