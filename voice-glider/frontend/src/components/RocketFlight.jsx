import React, { useState, useEffect, useRef } from 'react';
import { useRecorder } from '../hooks/useRecorder';
import { analyzeAudio } from '../api';
import MicWaveform from './MicWaveform';

const RocketFlight = () => {
  const [gameState, setGameState] = useState('ready'); // ready, recording, analyzing, result
  const [prompt, setPrompt] = useState('Hold a smooth, steady sound');
  const [feedback, setFeedback] = useState('');
  const [rocketFuel, setRocketFuel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [features, setFeatures] = useState(null);

  const canvasRef = useRef(null);

  const handleSilenceDetected = async () => {
    const audioBlob = await stopRecording();
    if (audioBlob) {
      setGameState('analyzing');
      try {
        const result = await analyzeAudio(audioBlob, 'rocket');
        setTranscript(result.transcript);
        setFeatures(result.features);
        setFeedback(result.feedback);
        setRocketFuel(result.gameEvents.rocketFuel);
        setGameState('result');
      } catch (error) {
        console.error('Analysis error:', error);
        setFeedback('Connection error. Try again!');
        setGameState('ready');
      }
    }
  };

  const { isRecording, audioLevel, startRecording, stopRecording } = useRecorder(handleSilenceDetected);

  const handleStart = () => {
    setGameState('recording');
    setFeedback('');
    setTranscript('');
    startRecording();
  };

  const handleNextRound = () => {
    setGameState('ready');
    setFeedback('');
    setTranscript('');
  };

  // Draw rocket cockpit HUD
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear with dark background
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, width, height);

    // Draw starfield
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 137.5) % width;
      const y = (i * 217.3) % height;
      const size = Math.random() * 2;
      ctx.fillRect(x, y, size, size);
    }

    // Draw cockpit frame
    ctx.strokeStyle = '#00d9ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Draw fuel gauge background
    const gaugeX = width / 2 - 150;
    const gaugeY = height - 80;
    const gaugeWidth = 300;
    const gaugeHeight = 40;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);

    // Draw fuel level
    const fuelWidth = gaugeWidth * rocketFuel;
    const gradient = ctx.createLinearGradient(gaugeX, gaugeY, gaugeX + fuelWidth, gaugeY);
    gradient.addColorStop(0, '#00d9ff');
    gradient.addColorStop(0.5, '#a855f7');
    gradient.addColorStop(1, '#ec4899');

    ctx.fillStyle = gradient;
    ctx.fillRect(gaugeX, gaugeY, fuelWidth, gaugeHeight);

    // Draw fuel percentage text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`FUEL: ${Math.round(rocketFuel * 100)}%`, width / 2, gaugeY + 28);

    // Draw holographic circle effects
    if (isRecording) {
      const centerX = width / 2;
      const centerY = height / 2 - 50;

      // Pulsing rings
      for (let i = 0; i < 3; i++) {
        const radius = 50 + i * 30 + audioLevel * 40;
        const alpha = 0.3 - i * 0.1;

        ctx.strokeStyle = `rgba(0, 217, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Center glow
      const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60);
      glowGradient.addColorStop(0, `rgba(168, 85, 247, ${audioLevel})`);
      glowGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw status text
    ctx.fillStyle = '#00d9ff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';

    if (gameState === 'recording') {
      ctx.fillText('[ RECORDING ]', width / 2, 60);
    } else if (gameState === 'analyzing') {
      ctx.fillText('[ ANALYZING ]', width / 2, 60);
    } else if (gameState === 'result') {
      ctx.fillText('[ COMPLETE ]', width / 2, 60);
    } else {
      ctx.fillText('[ READY ]', width / 2, 60);
    }

  }, [rocketFuel, isRecording, audioLevel, gameState]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🚀 Rocket Flight</h1>
        <p style={styles.subtitle}>Smooth Airflow Mode</p>
      </div>

      <canvas ref={canvasRef} width={600} height={400} style={styles.canvas} />

      <div style={styles.promptBox}>
        <p style={styles.prompt}>{prompt}</p>
      </div>

      <MicWaveform audioLevel={audioLevel} isRecording={isRecording} />

      {gameState === 'ready' && (
        <button onClick={handleStart} style={styles.button}>
          Start Engine
        </button>
      )}

      {gameState === 'recording' && (
        <p style={styles.hint}>Speak smoothly... (will stop on silence)</p>
      )}

      {gameState === 'analyzing' && (
        <p style={styles.hint}>Analyzing your flight...</p>
      )}

      {gameState === 'result' && (
        <div style={styles.result}>
          <p style={styles.feedback}>{feedback}</p>
          {transcript && <p style={styles.transcript}>You said: "{transcript}"</p>}
          {features && (
            <div style={styles.features}>
              <p>Continuity: {(features.continuity * 100).toFixed(0)}%</p>
              <p>Smooth Onset: {(features.onset_smoothness * 100).toFixed(0)}%</p>
              <p>Stability: {(features.airflow_stability * 100).toFixed(0)}%</p>
            </div>
          )}
          <button onClick={handleNextRound} style={styles.button}>
            Next Flight
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2.5rem',
    background: 'linear-gradient(90deg, #00d9ff, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '1.1rem',
  },
  canvas: {
    borderRadius: '12px',
    border: '2px solid rgba(0, 217, 255, 0.3)',
    marginBottom: '1.5rem',
    boxShadow: '0 8px 32px rgba(0, 217, 255, 0.2)',
  },
  promptBox: {
    background: 'rgba(15, 23, 42, 0.6)',
    padding: '1rem 2rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    border: '1px solid rgba(100, 116, 139, 0.3)',
  },
  prompt: {
    fontSize: '1.3rem',
    color: '#e2e8f0',
    textAlign: 'center',
  },
  button: {
    padding: '1rem 3rem',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    background: 'linear-gradient(90deg, #00d9ff, #a855f7)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    marginTop: '1rem',
    transition: 'transform 0.2s',
  },
  hint: {
    color: '#94a3b8',
    fontSize: '1rem',
    marginTop: '1rem',
    textAlign: 'center',
  },
  result: {
    textAlign: 'center',
    marginTop: '1rem',
  },
  feedback: {
    fontSize: '1.5rem',
    color: '#00d9ff',
    marginBottom: '1rem',
    fontWeight: 'bold',
  },
  transcript: {
    color: '#cbd5e1',
    fontSize: '1.1rem',
    marginBottom: '1rem',
  },
  features: {
    background: 'rgba(15, 23, 42, 0.6)',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    color: '#e2e8f0',
  },
};

export default RocketFlight;
