/**
 * Error Handler Utility
 * 
 * Centralized error handling and logging for production use
 */

/**
 * Log error with context
 */
export const logError = (error, context = {}) => {
  const errorInfo = {
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  console.error('Error logged:', errorInfo);

  // In production, send to error tracking service
  if (process.env.REACT_APP_ENABLE_ERROR_REPORTING === 'true') {
    // TODO: Integrate with error reporting service
    // sendToErrorService(errorInfo);
  }

  return errorInfo;
};

/**
 * Handle async errors
 */
export const handleAsyncError = (error, context) => {
  return logError(error, { ...context, type: 'async' });
};

/**
 * Validate number input
 */
export const validateNumber = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new Error('Invalid number');
  }
  if (num < min) {
    throw new Error(`Value must be at least ${min}`);
  }
  if (num > max) {
    throw new Error(`Value must be at most ${max}`);
  }
  return num;
};

/**
 * Validate wallet address
 */
export const validateWalletAddress = (address) => {
  if (!address) {
    throw new Error('Wallet address is required');
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error('Invalid wallet address format');
  }
  return address.toLowerCase();
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
};

/**
 * Safe parse JSON
 */
export const safeParseJSON = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logError(error, { type: 'json_parse', input: jsonString });
    return defaultValue;
  }
};

