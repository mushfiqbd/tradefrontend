# BCRD Trading Platform

A React-based trading platform for **BTC Perpetual Futures (PERP) contracts** - protocol-counterparty, cash-settled in BCRD credits.

## Overview

This platform implements a unique BTC perpetual futures contract where:
- **Users trade against the protocol** (not other traders)
- **Settlement is in BCRD credit** (not BTC, BNB, or USDT)
- **No external liquidity pools** - protocol provides all liquidity
- **No trader-to-trader funding** - protocol captures all fees & losses

For detailed architecture documentation, see: [BTC PERP Architecture](./docs/BTCPERP_ARCHITECTURE.md)

## Features

- **AMM Bot**: Automated Market Maker simulation with configurable order book
- **API Manager**: View mock API endpoints (B1, B2, B3, B4)
- **Trade Terminal**: Execute trades, manage positions, and view order book
- **Settlement Bot**: View master wallet balances and trade history
- **Web3 Wallet Integration**: Connect MetaMask wallet for trading

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# Copy example file
cp .env.example .env

# Edit .env with your configuration
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run build:prod` - Build for production with production environment
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run analyze` - Analyze bundle size

## Project Structure

```
src/
├── components/          # React components
│   ├── AMMBot.js       # AMM Bot simulation
│   ├── APIManager.js   # API endpoint viewer
│   ├── TradeTerminal.js # Trading interface
│   ├── SettlementBot.js # Settlement dashboard
│   ├── ErrorBoundary.js # Error boundary component
│   └── modals/         # Modal components
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
│   ├── constants.js    # App constants
│   ├── tradingUtils.js # Trading calculations
│   ├── wallet.js       # Wallet utilities
│   ├── validation.js   # Input validation
│   ├── errorHandler.js # Error handling
│   ├── logger.js       # Logging utility
│   └── performance.js  # Performance utilities
└── App.js             # Main app component
```

## Production Deployment

See [Production Deployment Guide](./docs/PRODUCTION_DEPLOYMENT.md) for detailed deployment instructions.

Quick deployment steps:

1. Build for production:
```bash
npm run build:prod
```

2. Deploy the `build/` folder to your hosting service

3. Configure environment variables on your hosting platform

## Environment Variables

Key environment variables:

- `REACT_APP_ENV` - Environment (development/production)
- `REACT_APP_BNB_USD_PRICE` - BNB to USD price
- `REACT_APP_BCRD_USD_PEGGED_PRICE` - BCRD to USD pegged price
- `REACT_APP_TRADINGVIEW_SYMBOL` - TradingView chart symbol
- `REACT_APP_ENABLE_ANALYTICS` - Enable analytics tracking
- `REACT_APP_ENABLE_ERROR_REPORTING` - Enable error reporting

See `.env.example` for all available variables.

## Technologies

- **React 18.2.0** - UI framework
- **React Hooks** - State management
- **Context API** - Global state
- **Ethers.js 6.9.0** - Web3 wallet integration
- **TradingView Widget** - Chart integration

## Security

- Input validation and sanitization
- XSS protection
- Error boundaries
- Secure wallet connections
- Environment variable protection

## Performance

- Code splitting
- Memoization
- Lazy loading
- Optimized builds
- Error handling

## Documentation

- [BTC PERP Architecture](./docs/BTCPERP_ARCHITECTURE.md) - Contract architecture
- [Production Deployment](./docs/PRODUCTION_DEPLOYMENT.md) - Deployment guide
- [Production Checklist](./docs/PRODUCTION_CHECKLIST.md) - Pre-deployment checklist

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Private - All rights reserved

## Support

For issues or questions:
1. Check documentation in `/docs`
2. Review error logs
3. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: 2024
