import React from 'react';

const NotificationModal = ({ title, message, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <button className="modal-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default NotificationModal;

