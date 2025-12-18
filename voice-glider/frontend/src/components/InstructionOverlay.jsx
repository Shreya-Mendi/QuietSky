import React from 'react';

const InstructionOverlay = ({ title, instructions, example, show }) => {
  if (!show) return null;
  
  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <p style={styles.title}>{title}</p>
        <p style={styles.instructions}>{instructions}</p>
        <p style={styles.example}>💡 Example: {example}</p>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    padding: '1rem',
    pointerEvents: 'none',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
  },
  box: {
    background: 'rgba(0, 0, 0, 0.85)',
    padding: '1rem 2rem',
    borderRadius: '12px',
    border: '2px solid #fbbf24',
    boxShadow: '0 4px 20px rgba(251, 191, 36, 0.4)',
    maxWidth: '600px',
  },
  title: {
    color: '#fbbf24',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    textAlign: 'center',
  },
  instructions: {
    color: '#fff',
    fontSize: '1rem',
    marginBottom: '0.5rem',
    textAlign: 'center',
    lineHeight: '1.5',
  },
  example: {
    color: '#4ade80',
    fontSize: '0.95rem',
    fontStyle: 'italic',
    textAlign: 'center',
  },
};

export default InstructionOverlay;
