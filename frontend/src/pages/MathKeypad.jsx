import React from 'react';

// Developer Config: Add or remove symbols here instantly
const MATH_SYMBOLS = [
  { label: 'π', value: 'π' },
  { label: 'θ', value: 'θ' },
  { label: '√', value: '√' },
  { label: 'x²', value: '²' }, 
  { label: '±', value: '±' },
  { label: '∞', value: '∞' },
  { label: '≤', value: '≤' },
  { label: '≥', value: '≥' },
  { label: '÷', value: '÷' },
  { label: '×', value: '×' },
  { label: '°', value: '°' }, // Degrees
  { label: '1/x', value: '1/' } // Fractions
];

export default function MathKeypad({ onSymbolSelect }) {
  return (
    <div className="card shadow-sm border-secondary mt-2">
      <div className="card-body p-2">
        <div className="d-flex flex-wrap gap-2">
          {MATH_SYMBOLS.map((symbol, index) => (
            <button
              key={index}
              type="button" // Critical: 'button' prevents it from submitting your form!
              className="btn btn-outline-secondary fw-bold"
              style={{ minWidth: '45px' }}
              onClick={() => onSymbolSelect(symbol.value)}
            >
              {symbol.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}