import React, { useState, useEffect, useRef } from 'react';
import { useRecorder } from '../hooks/useRecorder';
import { analyzeAudio } from '../api';
import MicWaveform from './MicWaveform';

const PROMPTS = [
  'Describe what you see in this landscape...',
  'What might happen on this journey?',
  'Tell me about a place you love...',
  'What does peace feel like to you?',
  'Imagine walking through these dunes...',
];

const TreasureTalk = () => {
  const [gameState, setGameState] = useState('ready');
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const [feedback, setFeedback] = useState('');
  const [pathProgress, setPathProgress] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [features, setFeatures] = useState(null);

  const canvasRef = useRef(null);

  const handleSilenceDetected = async () => {
    const audioBlob = await stopRecording();
    if (audioBlob) {
      setGameState('analyzing');
      try {
        const result = await analyzeAudio(audioBlob, 'treasure');
        setTranscript(result.transcript);
        setFeatures(result.features);
        setFeedback(result.feedback);

        const progression = result.gameEvents.sceneProgression || 0;
        setPathProgress(prev => Math.min(1, prev + progression));

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
    // New prompt
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    setGameState('ready');
    setFeedback('');
    setTranscript('');
  };

  const handleReset = () => {
    setPathProgress(0);
    setPrompt(PROMPTS[0]);
    setGameState('ready');
    setFeedback('');
    setTranscript('');
  };

  // Draw Journey-inspired desert landscape
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Sky gradient (warm desert sunset)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, '#fef3c7');
    skyGradient.addColorStop(0.4, '#fed7aa');
    skyGradient.addColorStop(0.7, '#fdba74');
    skyGradient.addColorStop(1, '#fb923c');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Sun/glow
    const sunX = width * 0.7;
    const sunY = height * 0.25;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 120);
    sunGlow.addColorStop(0, 'rgba(254, 243, 199, 0.8)');
    sunGlow.addColorStop(0.3, 'rgba(254, 215, 170, 0.4)');
    sunGlow.addColorStop(1, 'rgba(254, 215, 170, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 120, 0, Math.PI * 2);
    ctx.fill();

    // Sand dunes (layers for depth)
    const duneColors = ['#f59e0b', '#f97316', '#ea580c'];

    for (let layer = 0; layer < 3; layer++) {
      ctx.fillStyle = duneColors[layer];
      ctx.beginPath();

      const yOffset = height * 0.5 + layer * 60;
      const amplitude = 40 - layer * 10;

      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 20) {
        const y = yOffset + Math.sin((x / width) * Math.PI * 3 + layer) * amplitude;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
    }

    // Distant mountain/peak
    ctx.fillStyle = 'rgba(120, 53, 15, 0.3)';
    ctx.beginPath();
    ctx.moveTo(width * 0.7, height * 0.35);
    ctx.lineTo(width * 0.8, height * 0.55);
    ctx.lineTo(width * 0.6, height * 0.55);
    ctx.closePath();
    ctx.fill();

    // Traveler (small robed figure)
    const travelerX = 100 + pathProgress * (width - 200);
    const travelerY = height * 0.65;

    // Scarf/cape flowing
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(travelerX, travelerY - 20);
    const scarfWave = Math.sin(Date.now() / 300) * 15;
    ctx.lineTo(travelerX - 25 + scarfWave, travelerY);
    ctx.lineTo(travelerX - 20 + scarfWave, travelerY + 10);
    ctx.lineTo(travelerX, travelerY);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(travelerX, travelerY - 25);
    ctx.lineTo(travelerX - 12, travelerY + 15);
    ctx.lineTo(travelerX + 12, travelerY + 15);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(travelerX, travelerY - 28, 8, 0, Math.PI * 2);
    ctx.fill();

    // Glow when speaking
    if (isRecording) {
      const voiceGlow = ctx.createRadialGradient(travelerX, travelerY, 0, travelerX, travelerY, 60 + audioLevel * 40);
      voiceGlow.addColorStop(0, `rgba(251, 191, 36, ${audioLevel * 0.6})`);
      voiceGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = voiceGlow;
      ctx.beginPath();
      ctx.arc(travelerX, travelerY, 60 + audioLevel * 40, 0, Math.PI * 2);
      ctx.fill();

      // Particles rising
      for (let i = 0; i < 5; i++) {
        const particleX = travelerX + (Math.random() - 0.5) * 40;
        const particleY = travelerY - 30 - (Date.now() / 20 + i * 20) % 100;
        const particleAlpha = 1 - ((Date.now() / 20 + i * 20) % 100) / 100;

        ctx.fillStyle = `rgba(251, 191, 36, ${particleAlpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Path opened indicator
    if (pathProgress > 0.5) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
      for (let i = 0; i < 10; i++) {
        const starX = width * 0.7 + (Math.random() - 0.5) * 100;
        const starY = height * 0.35 + (Math.random() - 0.5) * 100;
        ctx.beginPath();
        ctx.arc(starX, starY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Progress bar
    const progressBarX = 50;
    const progressBarY = height - 40;
    const progressBarWidth = width - 100;
    const progressBarHeight = 15;

    ctx.fillStyle = 'rgba(120, 53, 15, 0.3)';
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

    const progressGradient = ctx.createLinearGradient(
      progressBarX, progressBarY,
      progressBarX + progressBarWidth * pathProgress, progressBarY
    );
    progressGradient.addColorStop(0, '#fbbf24');
    progressGradient.addColorStop(1, '#f59e0b');

    ctx.fillStyle = progressGradient;
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth * pathProgress, progressBarHeight);

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

    // Journey completion
    if (pathProgress >= 1) {
      ctx.fillStyle = 'rgba(254, 243, 199, 0.8)';
      ctx.font = 'bold 36px serif';
      ctx.textAlign = 'center';
      ctx.fillText('Journey Complete', width / 2, height / 2);
    }

  }, [pathProgress, isRecording, audioLevel, gameState]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🗺️ Treasure Talk</h1>
        <p style={styles.subtitle}>Conversation Mode</p>
      </div>

      <canvas ref={canvasRef} width={600} height={400} style={styles.canvas} />

      <div style={styles.promptBox}>
        <p style={styles.prompt}>{prompt}</p>
      </div>

      <MicWaveform audioLevel={audioLevel} isRecording={isRecording} />

      {gameState === 'ready' && (
        <div style={styles.buttonGroup}>
          <button onClick={handleStart} style={styles.button}>
            Speak Freely
          </button>
          {pathProgress > 0 && (
            <button onClick={handleReset} style={styles.secondaryButton}>
              Reset Journey
            </button>
          )}
        </div>
      )}

      {gameState === 'recording' && (
        <p style={styles.hint}>Share your thoughts... (will stop on silence)</p>
      )}

      {gameState === 'analyzing' && (
        <p style={styles.hint}>Listening...</p>
      )}

      {gameState === 'result' && (
        <div style={styles.result}>
          <p style={styles.feedback}>{feedback}</p>
          {transcript && (
            <div style={styles.transcriptBox}>
              <p style={styles.transcriptLabel}>Your words:</p>
              <p style={styles.transcript}>"{transcript}"</p>
            </div>
          )}
          {features && (
            <div style={styles.features}>
              <p>Pacing: {features.words_per_minute} words/min</p>
              <p>Expressiveness: {(features.expressive_continuity * 100).toFixed(0)}%</p>
            </div>
          )}
          <button onClick={handleNextRound} style={styles.button}>
            Continue Journey
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
    background: 'linear-gradient(180deg, #fed7aa 0%, #fb923c 100%)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2.5rem',
    background: 'linear-gradient(90deg, #f59e0b, #dc2626)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#78350f',
    fontSize: '1.1rem',
  },
  canvas: {
    borderRadius: '12px',
    border: '2px solid rgba(245, 158, 11, 0.4)',
    marginBottom: '1.5rem',
    boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)',
  },
  promptBox: {
    background: 'rgba(254, 243, 199, 0.7)',
    padding: '1rem 2rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    textAlign: 'center',
  },
  prompt: {
    fontSize: '1.3rem',
    color: '#78350f',
    fontStyle: 'italic',
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
    background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
    border: 'none',
    borderRadius: '8px',
    color: '#78350f',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  secondaryButton: {
    padding: '1rem 2rem',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    background: 'rgba(120, 53, 15, 0.3)',
    border: '1px solid rgba(120, 53, 15, 0.5)',
    borderRadius: '8px',
    color: '#78350f',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  hint: {
    color: '#78350f',
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
    color: '#dc2626',
    marginBottom: '1rem',
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  transcriptBox: {
    background: 'rgba(254, 243, 199, 0.6)',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    border: '1px solid rgba(245, 158, 11, 0.3)',
  },
  transcriptLabel: {
    color: '#92400e',
    fontSize: '0.9rem',
    marginBottom: '0.5rem',
  },
  transcript: {
    color: '#78350f',
    fontSize: '1.1rem',
    fontStyle: 'italic',
  },
  features: {
    background: 'rgba(254, 243, 199, 0.5)',
    padding: '0.8rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    color: '#78350f',
    fontSize: '0.95rem',
  },
};

export default TreasureTalk;
