import React, { useState, useEffect, useRef } from 'react';
import { useRecorder } from '../hooks/useRecorder';
import { analyzeAudio } from '../api';
import MicWaveform from './MicWaveform';

const PROMPTS = [
  'hello',
  'go',
  'star',
  'flow',
  'calm',
  'light',
  'shine',
  'peace'
];

const MonsterEcho = () => {
  const [gameState, setGameState] = useState('ready');
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const [feedback, setFeedback] = useState('');
  const [monsterHealth, setMonsterHealth] = useState(1.0);
  const [comboCount, setComboCount] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [hit, setHit] = useState(false);

  const canvasRef = useRef(null);

  const handleSilenceDetected = async () => {
    const audioBlob = await stopRecording();
    if (audioBlob) {
      setGameState('analyzing');
      try {
        const result = await analyzeAudio(audioBlob, 'monster');
        setTranscript(result.transcript);
        setFeedback(result.feedback);

        const damage = result.gameEvents.monsterDamage || 0;
        const combo = result.gameEvents.comboMultiplier || 1;

        setMonsterHealth(prev => Math.max(0, prev - damage));
        setComboCount(combo);
        setHit(true);

        setTimeout(() => setHit(false), 500);

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
    if (monsterHealth <= 0) {
      // Monster defeated, reset
      setMonsterHealth(1.0);
      setComboCount(0);
    }
    // New prompt
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    setGameState('ready');
    setFeedback('');
    setTranscript('');
  };

  // Draw monster and battle scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Dark mystical background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#1a0b2e');
    bgGradient.addColorStop(1, '#2d1b4e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 30; i++) {
      const x = (i * 57.3) % width;
      const y = (i * 83.7) % height;
      const size = Math.random() * 2;
      ctx.fillRect(x, y, size, size);
    }

    // Monster (friendly Rakshasa)
    const monsterX = width / 2;
    const monsterY = height / 2 - 30;
    const monsterSize = 80;

    // Monster shake when hit
    const shakeX = hit ? (Math.random() - 0.5) * 10 : 0;
    const shakeY = hit ? (Math.random() - 0.5) * 10 : 0;

    // Monster body (friendly purple/pink creature)
    const bodyGradient = ctx.createRadialGradient(
      monsterX + shakeX, monsterY + shakeY, 0,
      monsterX + shakeX, monsterY + shakeY, monsterSize
    );
    if (hit) {
      bodyGradient.addColorStop(0, '#ff0080');
      bodyGradient.addColorStop(1, '#ff00ff');
    } else {
      bodyGradient.addColorStop(0, '#a855f7');
      bodyGradient.addColorStop(1, '#7c3aed');
    }

    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(monsterX + shakeX, monsterY + shakeY, monsterSize, 0, Math.PI * 2);
    ctx.fill();

    // Friendly eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(monsterX - 25 + shakeX, monsterY - 15 + shakeY, 12, 0, Math.PI * 2);
    ctx.arc(monsterX + 25 + shakeX, monsterY - 15 + shakeY, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a0b2e';
    ctx.beginPath();
    ctx.arc(monsterX - 25 + shakeX, monsterY - 12 + shakeY, 6, 0, Math.PI * 2);
    ctx.arc(monsterX + 25 + shakeX, monsterY - 12 + shakeY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Friendly smile
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(monsterX + shakeX, monsterY + 10 + shakeY, 30, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Monster health bar
    const healthBarX = width / 2 - 150;
    const healthBarY = 30;
    const healthBarWidth = 300;
    const healthBarHeight = 25;

    // Background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

    // Health fill
    const healthWidth = healthBarWidth * monsterHealth;
    const healthGradient = ctx.createLinearGradient(healthBarX, healthBarY, healthBarX + healthWidth, healthBarY);
    healthGradient.addColorStop(0, '#ef4444');
    healthGradient.addColorStop(0.5, '#f97316');
    healthGradient.addColorStop(1, '#fbbf24');

    ctx.fillStyle = healthGradient;
    ctx.fillRect(healthBarX, healthBarY, healthWidth, healthBarHeight);

    // Border
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

    // Health text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${Math.round(monsterHealth * 100)}%`, width / 2, healthBarY + 18);

    // Combo counter
    if (comboCount > 1) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`x${comboCount} COMBO!`, width - 30, 80);
    }

    // Victory message
    if (monsterHealth <= 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VICTORY!', width / 2, height / 2);
    }

    // Combat glow when recording
    if (isRecording) {
      const glowRadius = 120 + audioLevel * 50;
      const glowGradient = ctx.createRadialGradient(
        width / 2, height / 2 + 100, 0,
        width / 2, height / 2 + 100, glowRadius
      );
      glowGradient.addColorStop(0, `rgba(0, 217, 255, ${audioLevel * 0.5})`);
      glowGradient.addColorStop(1, 'rgba(0, 217, 255, 0)');

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2 + 100, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

  }, [monsterHealth, comboCount, hit, isRecording, audioLevel, gameState]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>👾 Monster Echo</h1>
        <p style={styles.subtitle}>Controlled Repetition Mode</p>
      </div>

      <canvas ref={canvasRef} width={600} height={400} style={styles.canvas} />

      <div style={styles.promptBox}>
        <p style={styles.promptLabel}>Repeat this word:</p>
        <p style={styles.prompt}>"{prompt}"</p>
      </div>

      <MicWaveform audioLevel={audioLevel} isRecording={isRecording} />

      {gameState === 'ready' && (
        <button onClick={handleStart} style={styles.button}>
          Challenge Rakshasa
        </button>
      )}

      {gameState === 'recording' && (
        <p style={styles.hint}>Repeat the word... (will stop on silence)</p>
      )}

      {gameState === 'analyzing' && (
        <p style={styles.hint}>Calculating damage...</p>
      )}

      {gameState === 'result' && (
        <div style={styles.result}>
          <p style={styles.feedback}>{feedback}</p>
          {transcript && <p style={styles.transcript}>You said: "{transcript}"</p>}
          <button onClick={handleNextRound} style={styles.button}>
            {monsterHealth <= 0 ? 'New Battle' : 'Next Strike'}
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
    background: 'linear-gradient(180deg, #1a0b2e 0%, #2d1b4e 100%)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2.5rem',
    background: 'linear-gradient(90deg, #a855f7, #ec4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#c4b5fd',
    fontSize: '1.1rem',
  },
  canvas: {
    borderRadius: '12px',
    border: '2px solid rgba(168, 85, 247, 0.4)',
    marginBottom: '1.5rem',
    boxShadow: '0 8px 32px rgba(168, 85, 247, 0.3)',
  },
  promptBox: {
    background: 'rgba(26, 11, 46, 0.7)',
    padding: '1rem 2rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    border: '1px solid rgba(168, 85, 247, 0.4)',
    textAlign: 'center',
  },
  promptLabel: {
    fontSize: '1rem',
    color: '#c4b5fd',
    marginBottom: '0.5rem',
  },
  prompt: {
    fontSize: '2rem',
    color: '#fbbf24',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  button: {
    padding: '1rem 3rem',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    background: 'linear-gradient(90deg, #a855f7, #ec4899)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    marginTop: '1rem',
    transition: 'transform 0.2s',
  },
  hint: {
    color: '#c4b5fd',
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
    color: '#fbbf24',
    marginBottom: '1rem',
    fontWeight: 'bold',
  },
  transcript: {
    color: '#e9d5ff',
    fontSize: '1.1rem',
    marginBottom: '1rem',
  },
};

export default MonsterEcho;
