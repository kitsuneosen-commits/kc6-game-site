import React, { useState } from 'react';
import { C } from '../styles.js';

export default function StarRating({ value = 0, onChange, readonly = false, size = 24 }) {
  const [hover, setHover] = useState(0);
  const stars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  if (readonly) {
    const filled = Math.round(value / 2);
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
        {[1,2,3,4,5].map(i => (
          <span key={i} style={{ fontSize: size * 0.8, color: i <= filled ? C.yellow : C.border }}>★</span>
        ))}
        <span style={{ marginLeft: 6, fontSize: size * 0.6, color: C.yellow, fontWeight: 700 }}>{value}</span>
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {stars.map(i => (
        <button key={i} onClick={() => onChange && onChange(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: size, color: i <= (hover || value) ? C.yellow : C.border, transition: 'color 0.1s, transform 0.1s', transform: i <= hover ? 'scale(1.2)' : 'scale(1)', padding: 1 }}>
          ★
        </button>
      ))}
      <span style={{ marginLeft: 8, fontSize: 16, color: C.yellow, fontWeight: 700 }}>{hover || value || '-'}</span>
    </div>
  );
}
