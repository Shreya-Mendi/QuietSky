import React, { useState, useEffect, useRef } from 'react';
import { useRecorder } from '../hooks/useRecorder';
import { analyzeAudio } from '../api';
import MicWaveform from './MicWaveform';

const EchoBird = () => {
  const [gameState, setGameState] = useState('ready');
  const [prompt, setPrompt] = useState('Make rhythmic sounds to fly');
  const [feedback, setFeedback] = useState('');
  const [birdY, setBirdY] = useState(200);
  const [score, setScore] = useState(0);
  const [transcript, setTranscript] = useState('');

  const canvasRef = useRef(null);
  const obstaclesRef = useRef([]);

  const handleSilenceDetected = async () => {
    const audioBlob = await stopRecording();
    if (audioBlob) {
      setGameState('analyzing');
      try {
        const result = await analyzeAudio(audioBlob, 'bird');
        setTranscript(result.transcript);
        setFeedback(result.feedback);

        const lift = result.gameEvents.birdLift || 1;

        // Move bird up based on lift amount
        setBirdY(prev => Math.max(50, prev - lift * 30));

        // Increase score
        setScore(prev => prev + lift);

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
    // Bird falls slightly between rounds
    setBirdY(prev => Math.min(350, prev + 20));
    setGameState('ready');
    setFeedback('');
    setTranscript('');
  };

  const handleReset = () => {
    setBirdY(200);
    setScore(0);
    obstaclesRef.current = [];
    setGameState('ready');
    setFeedback('');
    setTranscript('');
  };

  // Draw bird flying scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Neon cyber sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, '#0f172a');
    skyGradient.addColorStop(0.5, '#1e293b');
    skyGradient.addColorStop(1, '#334155');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Neon grid lines (moving)
    ctx.strokeStyle = 'rgba(0, 217, 255, 0.2)';
    ctx.lineWidth = 1;
    const gridOffset = (Date.now() / 50) % 40;

    for (let i = 0; i < height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i + gridOffset);
      ctx.lineTo(width, i + gridOffset);
      ctx.stroke();
    }

    // Neon buildings/obstacles in background
    for (let i = 0; i < 5; i++) {
      const x = (i * 150 + (Date.now() / 20) % 150) % width;
      const buildingHeight = 100 + Math.sin(i) * 50;

      // Building silhouette
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(x, height - buildingHeight, 80, buildingHeight);

      // Neon windows
      ctx.fillStyle = '#00d9ff';
      for (let j = 0; j < 3; j++) {
        ctx.fillRect(x + 15 + j * 25, height - buildingHeight + 20, 8, 12);
        ctx.fillRect(x + 15 + j * 25, height - buildingHeight + 50, 8, 12);
      }
    }

    // Draw cyber bird
    const birdX = 150;
    const birdSize = 30;

    // Bird glow
    const birdGlow = ctx.createRadialGradient(birdX, birdY, 0, birdX, birdY, birdSize + 10);
    birdGlow.addColorStop(0, 'rgba(236, 72, 153, 0.6)');
    birdGlow.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = birdGlow;
    ctx.beginPath();
    ctx.arc(birdX, birdY, birdSize + 10, 0, Math.PI * 2);
    ctx.fill();

    // Bird body (triangle)
    const birdGradient = ctx.createLinearGradient(birdX - 20, birdY, birdX + 20, birdY);
    birdGradient.addColorStop(0, '#ec4899');
    birdGradient.addColorStop(1, '#a855f7');
    ctx.fillStyle = birdGradient;

    ctx.beginPath();
    ctx.moveTo(birdX + 20, birdY);
    ctx.lineTo(birdX - 15, birdY - 15);
    ctx.lineTo(birdX - 15, birdY + 15);
    ctx.closePath();
    ctx.fill();

    // Bird eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(birdX + 5, birdY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(birdX + 6, birdY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Wings (animated when recording)
    if (isRecording) {
      const wingFlap = Math.sin(Date.now() / 100) * 10;
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(birdX - 5, birdY);
      ctx.lineTo(birdX - 20, birdY - 20 + wingFlap);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(birdX - 5, birdY);
      ctx.lineTo(birdX - 20, birdY + 20 - wingFlap);
      ctx.stroke();
    }

    // Energy trail
    if (isRecording && audioLevel > 0.1) {
      for (let i = 0; i < 3; i++) {
        const trailX = birdX - i * 15;
        const trailAlpha = 0.5 - i * 0.15;

        ctx.fillStyle = `rgba(236, 72, 153, ${trailAlpha})`;
        ctx.beginPath();
        ctx.arc(trailX, birdY, 8 - i * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Score display
    ctx.fillStyle = '#00d9ff';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 20, 40);

    // Status indicator
    ctx.textAlign = 'right';
    if (gameState === 'recording') {
      ctx.fillStyle = '#22c55e';
      ctx.fillText('[ ACTIVE ]', width - 20, 40);
    } else if (gameState === 'analyzing') {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('[ ANALYZING ]', width - 20, 40);
    }

  }, [birdY, score, isRecording, audioLevel, gameState]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎵 Echo Bird</h1>
        <p style={styles.subtitle}>Rhythm & Pacing Mode</p>
      </div>

      <canvas ref={canvasRef} width={600} height={400} style={styles.canvas} />

      <div style={styles.promptBox}>
        <p style={styles.prompt}>{prompt}</p>
        <p style={styles.hint2}>Short sounds = small flaps | Long sounds = glides</p>
      </div>

      <MicWaveform audioLevel={audioLevel} isRecording={isRecording} />

      {gameState === 'ready' && (
        <div style={styles.buttonGroup}>
          <button onClick={handleStart} style={styles.button}>
            Flap Wings
          </button>
          <button onClick={handleReset} style={styles.secondaryButton}>
            Reset
          </button>
        </div>
      )}

      {gameState === 'recording' && (
        <p style={styles.hint}>Speak to fly... (will stop on silence)</p>
      )}

      {gameState === 'analyzing' && (
        <p style={styles.hint}>Processing flight...</p>
      )}

      {gameState === 'result' && (
        <div style={styles.result}>
          <p style={styles.feedback}>{feedback}</p>
          {transcript && <p style={styles.transcript}>You said: "{transcript}"</p>}
          <button onClick={handleNextRound} style={styles.button}>
            Keep Flying
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
    background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2.5rem',
    background: 'linear-gradient(90deg, #ec4899, #00d9ff)',
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
    border: '2px solid rgba(236, 72, 153, 0.4)',
    marginBottom: '1.5rem',
    boxShadow: '0 8px 32px rgba(236, 72, 153, 0.3)',
  },
  promptBox: {
    background: 'rgba(15, 23, 42, 0.7)',
    padding: '1rem 2rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    textAlign: 'center',
  },
  prompt: {
    fontSize: '1.3rem',
    color: '#e2e8f0',
    marginBottom: '0.5rem',
  },
  hint2: {
    fontSize: '0.9rem',
    color: '#94a3b8',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  button: {
    padding: '1rem 3rem',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    background: 'linear-gradient(90deg, #ec4899, #a855f7)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  secondaryButton: {
    padding: '1rem 2rem',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    background: 'rgba(71, 85, 105, 0.5)',
    border: '1px solid rgba(148, 163, 184, 0.5)',
    borderRadius: '8px',
    color: '#cbd5e1',
    cursor: 'pointer',
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
};

export default EchoBird;
