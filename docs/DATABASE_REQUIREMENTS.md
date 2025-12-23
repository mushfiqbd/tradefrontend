# Database Requirements (বাংলায়)

## বর্তমান অবস্থা

**বর্তমানে কোনো Database নেই** - সব ডাটা React State-এ রাখা আছে, যা:
- ❌ Page refresh করলে সব ডাটা হারিয়ে যায়
- ❌ Browser close করলে সব ডাটা হারিয়ে যায়
- ❌ শুধু simulation/demo এর জন্য

## Production-এর জন্য Database প্রয়োজন

### 1. **User Data Storage**
```sql
-- Users Table
- user_id (Primary Key)
- wallet_address (Unique)
- bcrd_balance
- bnb_balance
- created_at
- updated_at
```

### 2. **Trades/Positions Storage**
```sql
-- Positions Table
- position_id (Primary Key)
- user_id (Foreign Key)
- side (BUY/SELL)
- amount (BCRD)
- entry_price
- exit_price
- profit_loss_bcrd
- status (OPEN/CLOSED)
- open_time
- close_time
```

### 3. **Transactions History**
```sql
-- Transactions Table
- transaction_id (Primary Key)
- user_id (Foreign Key)
- side
- amount
- entry_price
- exit_price
- profit_loss_bcrd
- fee_bnb
- timestamp
```

### 4. **Order Book Storage**
```sql
-- Order Book Table
- order_id (Primary Key)
- user_id (Foreign Key, nullable for bot orders)
- side (BUY/SELL)
- price
- size
- status (OPEN/FILLED/CANCELLED)
- order_type (MARKET/LIMIT)
- created_at
- filled_at
```

### 5. **Master Wallet**
```sql
-- Master Wallet Table
- id (Primary Key)
- bcrd_balance
- bnb_balance
- overall_settled_pnl_bcrd
- last_updated
```

### 6. **Limit Orders**
```sql
-- Limit Orders Table
- order_id (Primary Key)
- user_id (Foreign Key)
- side
- price
- size
- status
- created_at
```

## Database Options

### Option 1: PostgreSQL (Recommended)
**সবচেয়ে ভালো option**
- ✅ Relational database
- ✅ ACID compliance
- ✅ Complex queries support
- ✅ Good for financial data
- ✅ Free & Open Source

### Option 2: MongoDB
**NoSQL option**
- ✅ Flexible schema
- ✅ Easy to scale
- ✅ Good for real-time data
- ❌ Less structured than SQL

### Option 3: Firebase Firestore
**Cloud database**
- ✅ Real-time updates
- ✅ Easy setup
- ✅ Built-in authentication
- ❌ Cost can increase with usage

### Option 4: Smart Contract (Blockchain)
**On-chain storage**
- ✅ Decentralized
- ✅ Immutable
- ✅ Transparent
- ❌ Expensive (gas fees)
- ❌ Slower

## Recommended Architecture

### Hybrid Approach (Best)
```
Frontend (React) 
    ↓
Backend API (Node.js/Express)
    ↓
Database (PostgreSQL) ← Main storage
    ↓
Smart Contract (Ethereum/BNB Chain) ← Critical transactions only
```

## Database Schema Example (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    bcrd_balance DECIMAL(18, 2) DEFAULT 0,
    bnb_balance DECIMAL(18, 8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Positions
CREATE TABLE positions (
    position_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    side VARCHAR(4) NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    entry_price DECIMAL(18, 7) NOT NULL,
    exit_price DECIMAL(18, 7),
    profit_loss_bcrd DECIMAL(18, 2),
    status VARCHAR(10) DEFAULT 'OPEN',
    open_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    close_time TIMESTAMP
);

-- Transactions
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    position_id INTEGER REFERENCES positions(position_id),
    side VARCHAR(4) NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    entry_price DECIMAL(18, 7) NOT NULL,
    exit_price DECIMAL(18, 7) NOT NULL,
    profit_loss_bcrd DECIMAL(18, 2) NOT NULL,
    fee_bnb DECIMAL(18, 8) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    side VARCHAR(4) NOT NULL,
    price DECIMAL(18, 7) NOT NULL,
    size DECIMAL(18, 2) NOT NULL,
    status VARCHAR(10) DEFAULT 'OPEN',
    order_type VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    filled_at TIMESTAMP
);

-- Master Wallet
CREATE TABLE master_wallet (
    id SERIAL PRIMARY KEY,
    bcrd_balance DECIMAL(18, 2) NOT NULL,
    bnb_balance DECIMAL(18, 8) NOT NULL,
    overall_settled_pnl_bcrd DECIMAL(18, 2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Implementation Steps

### Step 1: Setup Database
```bash
# Install PostgreSQL
# Create database
createdb bcrd_trading

# Run migrations
psql bcrd_trading < schema.sql
```

### Step 2: Create Backend API
```javascript
// server.js
const express = require('express');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({
  user: 'your_user',
  host: 'localhost',
  database: 'bcrd_trading',
  password: 'your_password',
  port: 5432,
});

// API endpoints
app.get('/api/user/:address', async (req, res) => {
  // Get user data
});

app.post('/api/trade', async (req, res) => {
  // Save trade
});

app.get('/api/positions/:userId', async (req, res) => {
  // Get positions
});
```

### Step 3: Connect Frontend to Backend
```javascript
// In React components
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Fetch user data
const fetchUserData = async (walletAddress) => {
  const response = await fetch(`${API_BASE_URL}/api/user/${walletAddress}`);
  return response.json();
};
```

## Current vs Production

| Feature | Current (No DB) | Production (With DB) |
|----------|----------------|---------------------|
| Data Persistence | ❌ No | ✅ Yes |
| User Balances | ❌ Lost on refresh | ✅ Saved |
| Trade History | ❌ Lost on refresh | ✅ Permanent |
| Multi-user | ❌ Single user | ✅ Multiple users |
| Scalability | ❌ Limited | ✅ Scalable |

## Cost Estimation

### PostgreSQL (Self-hosted)
- **Free** (Open Source)
- Server cost: $5-20/month (VPS)

### PostgreSQL (Cloud - AWS RDS)
- **$15-50/month** (depending on size)

### MongoDB Atlas
- **Free tier available**
- Paid: $9-50/month

### Firebase Firestore
- **Free tier**: 1GB storage
- Paid: $0.18/GB

## Recommendation

**PostgreSQL + Node.js Backend** - সবচেয়ে ভালো option কারণ:
1. ✅ Financial data-এর জন্য reliable
2. ✅ Complex queries support
3. ✅ ACID compliance (data integrity)
4. ✅ Free & Open Source
5. ✅ Industry standard

## Next Steps

1. Setup PostgreSQL database
2. Create database schema
3. Build Node.js/Express backend API
4. Connect React frontend to backend
5. Migrate from state to database

---

**Note**: বর্তমানে simulation চলছে, কিন্তু production-এর জন্য database অবশ্যই প্রয়োজন।


