import { BNB_USD_PRICE, BCRD_USD_PEGGED_PRICE } from './constants';

/**
 * Calculate PNL for BTC PERP Position
 * 
 * This function calculates profit/loss for a BTC perpetual futures position.
 * 
 * Key Points:
 * - PNL is calculated based on BTC price movement (entryPrice vs exitPrice)
 * - Settlement is in BCRD credit, not BTC or BNB (cash-settled)
 * - Long positions profit when price goes up, short positions profit when price goes down
 * 
 * @param {number} entryPrice - Entry price in BNB (BTC/BNB rate)
 * @param {number} exitPrice - Exit price in BNB (BTC/BNB rate)
 * @param {number} amount - Position size in BCRD (notional value)
 * @param {string} side - 'BUY' for long, 'SELL' for short
 * @returns {number} PNL in BCRD credit (cash-settled)
 */
export const calculatePNL = (entryPrice, exitPrice, amount, side) => {
  const isLong = side === 'BUY';
  // Calculate PNL in BNB terms first
  const profitLossBNB = (exitPrice - entryPrice) * (isLong ? 1 : -1) * amount;
  // Convert to BCRD (cash settlement in protocol credit)
  const profitLossBCRD = profitLossBNB * (BNB_USD_PRICE / BCRD_USD_PEGGED_PRICE);
  return profitLossBCRD;
};

/**
 * Calculate Trading Fee
 * 
 * Fees are collected in BNB (not BCRD) and go to the Master BNB Wallet.
 * This is separate from PNL settlement which is in BCRD.
 * 
 * @param {number} amount - Trade amount in BCRD
 * @param {number} feeRate - Fee rate (e.g., 0.00023 for 0.023%)
 * @returns {number} Fee amount in BNB
 */
export const calculateFee = (amount, feeRate) => {
  const NOTIONAL_USD = amount * BCRD_USD_PEGGED_PRICE;
  const FEE_IN_BNB = (NOTIONAL_USD * feeRate) / BNB_USD_PRICE;
  return FEE_IN_BNB;
};

export const formatPrice = (price) => {
  return parseFloat(price).toFixed(7);
};

export const formatAmount = (amount) => {
  return parseFloat(amount).toFixed(2);
};

