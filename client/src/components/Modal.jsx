import React from 'react';
import { S } from '../styles.js';

export default function Modal({ show, onClose, title, children, width }) {
  if (!show) return null;
  return (
    <div style={S.modal} onClick={onClose}>
      <div style={{ ...S.modalContent, maxWidth: width || 500 }} onClick={e => e.stopPropagation()}>
        {title && <h3 style={{ margin: '0 0 20px', fontSize: 18 }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}
