import React, { useState, useEffect } from 'react';
import { BNB_USD_PRICE } from '../utils/constants';

const ConvertModal = ({ isOpen, onClose, onConvert, userBNBBalance }) => {
  const [amountBNB, setAmountBNB] = useState(1.0);
  const [amountBCRD, setAmountBCRD] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setAmountBNB(1.0);
      updateConversion(1.0);
    }
  }, [isOpen]);

  const updateConversion = (bnbAmount) => {
    const bcrd = bnbAmount * BNB_USD_PRICE;
    setAmountBCRD(bcrd);
  };

  const handleAmountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setAmountBNB(value);
    updateConversion(value);
  };

  const handleConvert = () => {
    if (isNaN(amountBNB) || amountBNB <= 0) {
      return;
    }
    if (amountBNB > userBNBBalance) {
      return;
    }
    onConvert(amountBNB, amountBCRD);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="convert-modal-overlay" onClick={onClose}>
      <div className="convert-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: '#58a6ff' }}>Convert BNB to BCRD</h3>
        <p style={{ fontSize: '0.85em', color: '#8b949e' }}>
          Current Price: 1 BNB = ${BNB_USD_PRICE.toFixed(2)} USD. (1 BCRD = $1 USD)
        </p>
        <div className="input-group" style={{ marginTop: '15px' }}>
          <label htmlFor="convert-amount-bnb">Amount to Convert (BNB):</label>
          <input
            type="number"
            id="convert-amount-bnb"
            step="0.00001"
            value={amountBNB}
            min="0.00001"
            onChange={handleAmountChange}
          />
        </div>
        <p style={{ marginTop: '15px', fontWeight: '700' }}>
          You will receive:{' '}
          <strong style={{ color: '#7ee787' }}>{amountBCRD.toFixed(2)}</strong> BCRD
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button className="btn-close" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-save" onClick={handleConvert}>
            Convert
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConvertModal;

