/**
 * Performance Utilities
 * 
 * Utilities for performance monitoring and optimization
 */

/**
 * Debounce function to limit function calls
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit function calls
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Measure performance of a function
 */
export const measurePerformance = (func, label) => {
  return (...args) => {
    if (process.env.NODE_ENV === 'development') {
      const start = performance.now();
      const result = func(...args);
      const end = performance.now();
      console.log(`${label}: ${(end - start).toFixed(2)}ms`);
      return result;
    }
    return func(...args);
  };
};

/**
 * Lazy load component (requires React import in usage)
 */
// Example usage:
// const LazyComponent = React.lazy(() => import('./Component'));

