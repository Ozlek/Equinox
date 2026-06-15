import React from 'react';

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
  { label: '°', value: '°' }, 
  { label: '1/x', value: '1/' } 
];

export default function MathKeypad({ onSymbolSelect }) {
  return (
    <div style={padStyles.keypadWrapper}>
      <div style={padStyles.gridContainer}>
        {MATH_SYMBOLS.map((symbol, index) => (
          <button
            key={index}
            type="button" 
            style={padStyles.keyButton}
            onClick={() => onSymbolSelect(symbol.value)}
          >
            {symbol.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const padStyles = {
  keypadWrapper: {
    backgroundColor: '#2d3748',
    borderRadius: '12px',
    padding: '0.75rem',
    marginTop: '0.75rem',
    border: '1px solid #4a5568',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)', 
    gap: '8px',
  },
  keyButton: {
    backgroundColor: '#1a202c',
    color: '#f7fafc',
    border: '1px solid #4a5568',
    borderRadius: '8px',
    padding: '0.75rem 0',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    minHeight: '48px', 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  }
};