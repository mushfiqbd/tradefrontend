# BTC PERP Contract Architecture

## Overview

This system implements a **BTC Perpetual Futures (PERP) contract** that is fundamentally different from traditional perpetual contracts found on centralized exchanges (Binance, dYdX, GMX) or decentralized protocols.

## Contract Classification

**BTC PERP (Perpetual Futures) — protocol-counterparty, cash-settled in BCRD credits, with centralized liquidity control.**

### Technical Classification

- **Type**: Perpetual Futures Contract (PERP)
- **Settlement**: Cash-settled in internal credit (BCRD)
- **Counterparty**: Protocol (not other traders)
- **Underlying**: BTC price exposure (no actual BTC ownership)
- **Expiry**: None (perpetual)

## Key Characteristics

### ✔ Perpetual Futures Features

- ✅ No expiry date
- ✅ Users can go **long or short BTC**
- ✅ PNL calculated from BTC price movement
- ✅ Trades can be opened and closed at any time
- ✅ Uses mark price / index price
- ✅ Leverage can be applied (if enabled)

### What Makes It Different

#### Standard BTC PERP (Binance / dYdX / GMX)
- Traders vs traders (or vs LP vault)
- Settlement in **USDT, USDC, or BTC**
- Liquidity pools or order books
- Funding payments between traders

#### BCRD Protocol BTC PERP
- **Trader vs protocol** (protocol is the counterparty)
- Settlement in **BCRD credit** (internal protocol credit)
- No external liquidity pools
- No trader-to-trader funding payments
- Protocol captures all fees & losses
- Real asset (BNB) never leaves treasury

## Settlement Mechanism

### How PNL Works

1. BTC price moves up/down
2. User's position PNL is calculated based on entry price vs current price
3. On position close:
   - **Winning trades** → BCRD credited to user
   - **Losing trades** → BCRD debited from user
4. No BTC or BNB is delivered to users

This is **cash-settled**, not physically settled.

### Settlement Flow

```
User closes position with PNL
    ↓
PNL calculated in BCRD
    ↓
If profit: BCRD credited from Master BCRD Wallet
If loss: BCRD debited to Master BCRD Wallet
    ↓
Fees (in BNB) collected by Master BNB Wallet
    ↓
No actual BTC or BNB transferred to user
```

## What It Is NOT

- ❌ **Not spot trading** - Users never own BTC
- ❌ **Not options** - No strike price, no expiry
- ❌ **Not traditional CFD** - CFDs are broker-issued and usually fiat-based

## Regulatory & Documentation Language

For technical documentation and regulatory compliance, this contract can be described as:

- **Perpetual futures contract**
- **Synthetic BTC perpetual**
- **Cash-settled crypto derivative**
- **Protocol-issued perpetual trading credit**

### Recommended Technical Phrasing

> "A cash-settled BTC perpetual contract settled in protocol credit units (BCRD), where the protocol acts as the counterparty to all trades."

## Implementation Details

### Trading Mechanism

- Users trade against the **protocol** (not other traders)
- Protocol maintains order book via AMM Bot
- All trades execute against protocol liquidity
- Fees collected in BNB, PNL settled in BCRD

### Master Wallet System

- **Master BCRD Wallet**: Holds all BCRD ledger for payouts
- **Master BNB Wallet**: Holds BNB liquidity and collects fees
- **User Wallet**: Executes trades and receives PNL in BCRD

### Key Contracts

- `BCRDMaster`: Smart contract managing trades, fees, and settlements
- AMM Bot: Maintains order book and price discovery
- Settlement Bot: Handles PNL calculations and settlements

## Risk Model

- Protocol takes the opposite side of all trades
- Protocol profits when users lose, loses when users profit
- BNB treasury provides backing for the system
- All settlements are in BCRD credit, not real assets

---

**One-line Summary**: BTC PERP (perpetual futures) — protocol-counterparty, cash-settled in BCRD credits, with centralized liquidity control.

