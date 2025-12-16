import React, { useState } from 'react';
import RocketFlight from './components/RocketFlight';
import MonsterEcho from './components/MonsterEcho';
import EchoBird from './components/EchoBird';
import TreasureTalk from './components/TreasureTalk';

function App() {
  const [selectedMode, setSelectedMode] = useState(null);

  if (!selectedMode) {
    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuContent}>
          <h1 style={styles.mainTitle}>QuietSky</h1>
          <p style={styles.tagline}>
            A calming speech adventure game
          </p>
          <p style={styles.description}>
            Choose your adventure. Practice fluent, confident speech through fun gameplay.
            <br />
            No penalties, no pressure—just encouragement and exploration.
          </p>

          <div style={styles.modeGrid}>
            <div style={styles.modeCard} onClick={() => setSelectedMode('rocket')}>
              <div style={styles.modeIcon}>🚀</div>
              <h2 style={styles.modeTitle}>Rocket Flight</h2>
              <p style={styles.modeDescription}>
                Power your rocket with smooth, steady vocal sounds.
                Practice gentle onsets and calm airflow.
              </p>
            </div>

            <div style={styles.modeCard} onClick={() => setSelectedMode('monster')}>
              <div style={styles.modeIcon}>👾</div>
              <h2 style={styles.modeTitle}>Monster Echo</h2>
              <p style={styles.modeDescription}>
                Challenge a friendly Rakshasa with controlled repetition.
                Build combos and unlock special strikes!
              </p>
            </div>

            <div style={styles.modeCard} onClick={() => setSelectedMode('bird')}>
              <div style={styles.modeIcon}>🎵</div>
              <h2 style={styles.modeTitle}>Echo Bird</h2>
              <p style={styles.modeDescription}>
                Guide a cyber-bird through neon skies with your rhythm.
                Short sounds flap, long sounds glide!
              </p>
            </div>

            <div style={styles.modeCard} onClick={() => setSelectedMode('treasure')}>
              <div style={styles.modeIcon}>🗺️</div>
              <h2 style={styles.modeTitle}>Treasure Talk</h2>
              <p style={styles.modeDescription}>
                Journey through serene landscapes while speaking freely.
                Share your thoughts and watch the world respond.
              </p>
            </div>
          </div>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Remember: This game never judges your speech. It only celebrates your effort. ✨
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render selected mode
  return (
    <div>
      <button
        onClick={() => setSelectedMode(null)}
        style={styles.backButton}
      >
        ← Back to Menu
      </button>

      {selectedMode === 'rocket' && <RocketFlight />}
      {selectedMode === 'monster' && <MonsterEcho />}
      {selectedMode === 'bird' && <EchoBird />}
      {selectedMode === 'treasure' && <TreasureTalk />}
    </div>
  );
}

const styles = {
  menuContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #2d1b4e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  menuContent: {
    maxWidth: '1200px',
    width: '100%',
  },
  mainTitle: {
    fontSize: '4rem',
    textAlign: 'center',
    background: 'linear-gradient(90deg, #00d9ff, #a855f7, #ec4899, #fbbf24)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '1rem',
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: '1.5rem',
    textAlign: 'center',
    color: '#cbd5e1',
    marginBottom: '1rem',
  },
  description: {
    fontSize: '1.1rem',
    textAlign: 'center',
    color: '#94a3b8',
    marginBottom: '3rem',
    lineHeight: '1.6',
  },
  modeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
    marginBottom: '3rem',
  },
  modeCard: {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '2px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '16px',
    padding: '2rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
  },
  modeIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  modeTitle: {
    fontSize: '1.5rem',
    color: '#e2e8f0',
    marginBottom: '1rem',
  },
  modeDescription: {
    fontSize: '1rem',
    color: '#94a3b8',
    lineHeight: '1.5',
  },
  footer: {
    textAlign: 'center',
    padding: '2rem',
    background: 'rgba(15, 23, 42, 0.4)',
    borderRadius: '12px',
    border: '1px solid rgba(100, 116, 139, 0.2)',
  },
  footerText: {
    color: '#cbd5e1',
    fontSize: '1.1rem',
    fontStyle: 'italic',
  },
  backButton: {
    position: 'fixed',
    top: '1rem',
    left: '1rem',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(100, 116, 139, 0.5)',
    borderRadius: '8px',
    color: '#cbd5e1',
    cursor: 'pointer',
    zIndex: 1000,
    transition: 'all 0.2s',
  },
};

export default App;
