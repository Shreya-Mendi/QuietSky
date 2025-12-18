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
  const [sandParticles, setSandParticles] = useState([]);
  const [stars, setStars] = useState([]);

  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize stars
  useEffect(() => {
    const newStars = [];
    for (let i = 0; i < 80; i++) {
      newStars.push({
        x: Math.random() * 600,
        y: Math.random() * 200,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.3
      });
    }
    setStars(newStars);
  }, []);

  const handleSilenceDetected = async () => {
    const audioBlob = await stopRecording();
    if (audioBlob) {
      setGameState('analyzing');
      try {
        const result = await analyzeAudio(audioBlob, 'treasure');

        console.log('=== TREASURE RESPONSE ===');
        console.log('Progression:', result.gameEvents.sceneProgression);
        console.log('Transcript:', result.transcript);
        console.log('Features:', result.features);

        setTranscript(result.transcript);
        setFeatures(result.features);
        setFeedback(result.feedback);

        const progression = result.gameEvents.sceneProgression || 0;
        setPathProgress(prev => Math.min(1, prev + progression));

        // Create sand particles
        const newParticles = [];
        const particleCount = Math.floor(progression * 100) + 20;
        for (let i = 0; i < particleCount; i++) {
          newParticles.push({
            x: 100 + pathProgress * 400 + (Math.random() - 0.5) * 150,
            y: 280 + (Math.random() - 0.5) * 80,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 3 - 1,
            life: 1.0,
            size: Math.random() * 3 + 1
          });
        }
        setSandParticles(newParticles);

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

  // Animate Journey-inspired desert landscape
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const animate = () => {
      // Sky gradient (warm desert sunset)
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
      skyGradient.addColorStop(0, '#fef3c7');
      skyGradient.addColorStop(0.3, '#fed7aa');
      skyGradient.addColorStop(0.6, '#fdba74');
      skyGradient.addColorStop(1, '#fb923c');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height);

      // Stars (faint)
      stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Sun/glow
      const sunX = width * 0.75;
      const sunY = height * 0.22;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 150);
      sunGlow.addColorStop(0, 'rgba(254, 243, 199, 0.9)');
      sunGlow.addColorStop(0.2, 'rgba(254, 215, 170, 0.6)');
      sunGlow.addColorStop(0.5, 'rgba(254, 215, 170, 0.3)');
      sunGlow.addColorStop(1, 'rgba(254, 215, 170, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 150, 0, Math.PI * 2);
      ctx.fill();

      // Sun core
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 35, 0, Math.PI * 2);
      ctx.fill();

      // Distant mountain/peak
      ctx.fillStyle = 'rgba(120, 53, 15, 0.4)';
      ctx.beginPath();
      ctx.moveTo(width * 0.65, height * 0.32);
      ctx.lineTo(width * 0.78, height * 0.55);
      ctx.lineTo(width * 0.52, height * 0.55);
      ctx.closePath();
      ctx.fill();

      // Another mountain
      ctx.fillStyle = 'rgba(120, 53, 15, 0.3)';
      ctx.beginPath();
      ctx.moveTo(width * 0.35, height * 0.38);
      ctx.lineTo(width * 0.45, height * 0.55);
      ctx.lineTo(width * 0.25, height * 0.55);
      ctx.closePath();
      ctx.fill();

      // Sand dunes (multiple layers for depth and parallax)
      const duneColors = [
        { color: '#f59e0b', alpha: 0.7 },
        { color: '#f97316', alpha: 0.8 },
        { color: '#ea580c', alpha: 0.9 },
        { color: '#dc2626', alpha: 1.0 }
      ];

      for (let layer = 0; layer < 4; layer++) {
        const { color, alpha } = duneColors[layer];
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();

        const yOffset = height * 0.45 + layer * 50;
        const amplitude = 50 - layer * 8;
        const frequency = 3 - layer * 0.3;

        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 15) {
          const y = yOffset + Math.sin((x / width) * Math.PI * frequency + layer) * amplitude;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Dune highlights
        ctx.strokeStyle = `rgba(254, 243, 199, ${0.3 - layer * 0.05})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 15) {
          const y = yOffset + Math.sin((x / width) * Math.PI * frequency + layer) * amplitude;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Traveler position based on progress
      const travelerX = 100 + pathProgress * 400;
      const travelerBaseY = height * 0.65;

      // Calculate traveler Y based on dune curve
      const dunePhase = (travelerX / width) * Math.PI * 2.5;
      const travelerY = travelerBaseY + Math.sin(dunePhase) * 25;

      // Path traveled (golden sand trail)
      if (pathProgress > 0) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        for (let i = 0; i <= pathProgress * 100; i++) {
          const px = 100 + (pathProgress * 400) * (i / 100);
          const py = travelerBaseY + Math.sin((px / width) * Math.PI * 2.5) * 25;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Path glow
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
        ctx.lineWidth = 16;
        ctx.stroke();
      }

      // Traveler shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(travelerX, travelerY + 20, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Voice glow when recording
      if (isRecording) {
        const voiceGlow = ctx.createRadialGradient(
          travelerX, travelerY, 0,
          travelerX, travelerY, 80 + audioLevel * 60
        );
        voiceGlow.addColorStop(0, `rgba(251, 191, 36, ${audioLevel * 0.7})`);
        voiceGlow.addColorStop(0.5, `rgba(251, 146, 60, ${audioLevel * 0.4})`);
        voiceGlow.addColorStop(1, 'rgba(251, 146, 60, 0)');
        ctx.fillStyle = voiceGlow;
        ctx.beginPath();
        ctx.arc(travelerX, travelerY, 80 + audioLevel * 60, 0, Math.PI * 2);
        ctx.fill();

        // Voice particles rising
        for (let i = 0; i < 8; i++) {
          const particleX = travelerX + (Math.random() - 0.5) * 50;
          const particleY = travelerY - 40 - (Date.now() / 25 + i * 25) % 120;
          const particleAlpha = 1 - ((Date.now() / 25 + i * 25) % 120) / 120;

          ctx.fillStyle = `rgba(251, 191, 36, ${particleAlpha * audioLevel})`;
          ctx.beginPath();
          ctx.arc(particleX, particleY, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Energy rings
        for (let i = 0; i < 3; i++) {
          const ringRadius = 40 + audioLevel * 40 + i * 20 + (Date.now() / 30) % 30;
          ctx.strokeStyle = `rgba(251, 191, 36, ${audioLevel * (0.5 - i * 0.15)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(travelerX, travelerY, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Scarf/cape flowing (animated)
      const scarfWave = Math.sin(Date.now() / 300) * 18;
      const scarfGradient = ctx.createLinearGradient(
        travelerX, travelerY - 25,
        travelerX - 30 + scarfWave, travelerY + 15
      );
      scarfGradient.addColorStop(0, '#dc2626');
      scarfGradient.addColorStop(1, '#991b1b');
      ctx.fillStyle = scarfGradient;
      ctx.beginPath();
      ctx.moveTo(travelerX, travelerY - 25);
      ctx.lineTo(travelerX - 30 + scarfWave, travelerY);
      ctx.lineTo(travelerX - 25 + scarfWave, travelerY + 15);
      ctx.lineTo(travelerX, travelerY);
      ctx.closePath();
      ctx.fill();

      // Traveler body
      const bodyGradient = ctx.createLinearGradient(
        travelerX - 15, travelerY - 30,
        travelerX + 15, travelerY + 20
      );
      bodyGradient.addColorStop(0, '#92400e');
      bodyGradient.addColorStop(1, '#78350f');
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.moveTo(travelerX, travelerY - 30);
      ctx.lineTo(travelerX - 15, travelerY + 20);
      ctx.lineTo(travelerX + 15, travelerY + 20);
      ctx.closePath();
      ctx.fill();

      // Traveler head
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.arc(travelerX, travelerY - 33, 10, 0, Math.PI * 2);
      ctx.fill();

      // Hood
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(travelerX, travelerY - 35, 12, Math.PI, Math.PI * 2);
      ctx.fill();

      // Traveler glow aura
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(251, 191, 36, 0.8)';
      ctx.beginPath();
      ctx.moveTo(travelerX, travelerY - 30);
      ctx.lineTo(travelerX - 15, travelerY + 20);
      ctx.lineTo(travelerX + 15, travelerY + 20);
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Sand particles
      sandParticles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // Gravity
        particle.life -= 0.015;

        if (particle.life > 0) {
          ctx.fillStyle = `rgba(251, 191, 36, ${particle.life * 0.7})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Mystical symbols appear as progress increases
      if (pathProgress > 0.3) {
        const symbolCount = Math.floor(pathProgress * 15);
        for (let i = 0; i < symbolCount; i++) {
          const sx = 500 + (i * 15) % 80 - 40;
          const sy = 120 + Math.sin(Date.now() / 1000 + i) * 30;
          const alpha = 0.2 + Math.sin(Date.now() / 500 + i) * 0.2;

          ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
          ctx.font = 'bold 20px serif';
          ctx.fillText('✦', sx, sy);
        }
      }

      // Journey completion temple/monument
      if (pathProgress >= 0.9) {
        const monumentX = 520;
        const monumentY = height * 0.55;

        // Monument glow
        const monumentGlow = ctx.createRadialGradient(
          monumentX, monumentY, 0,
          monumentX, monumentY, 100
        );
        monumentGlow.addColorStop(0, 'rgba(251, 191, 36, 0.5)');
        monumentGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = monumentGlow;
        ctx.beginPath();
        ctx.arc(monumentX, monumentY, 100, 0, Math.PI * 2);
        ctx.fill();

        // Monument structure
        ctx.fillStyle = '#fbbf24';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(monumentX, monumentY - 40);
        ctx.lineTo(monumentX - 20, monumentY + 20);
        ctx.lineTo(monumentX + 20, monumentY + 20);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Progress bar (enhanced)
      const progressBarX = 50;
      const progressBarY = height - 45;
      const progressBarWidth = width - 100;
      const progressBarHeight = 20;

      // Background
      ctx.fillStyle = 'rgba(120, 53, 15, 0.4)';
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

      // Progress fill with gradient
      const progressWidth = progressBarWidth * pathProgress;
      const progressGradient = ctx.createLinearGradient(
        progressBarX, progressBarY,
        progressBarX + progressWidth, progressBarY
      );
      progressGradient.addColorStop(0, '#fbbf24');
      progressGradient.addColorStop(0.5, '#f59e0b');
      progressGradient.addColorStop(1, '#dc2626');

      ctx.fillStyle = progressGradient;
      ctx.fillRect(progressBarX, progressBarY, progressWidth, progressBarHeight);

      // Progress bar glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#fbbf24';
      ctx.fillRect(progressBarX, progressBarY, progressWidth, progressBarHeight);
      ctx.shadowBlur = 0;

      // Border
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

      // Progress text
      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 14px serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#78350f';
      ctx.fillText(`Journey Progress: ${Math.round(pathProgress * 100)}%`, width / 2, progressBarY + 15);
      ctx.shadowBlur = 0;

      // Journey completion overlay
      if (pathProgress >= 1) {
        ctx.fillStyle = 'rgba(254, 243, 199, 0.7)';
        ctx.fillRect(0, 0, width, height);

        // Completion burst
        for (let i = 0; i < 30; i++) {
          const angle = (i / 30) * Math.PI * 2;
          const dist = 100 + Math.sin(Date.now() / 300 + i) * 30;
          const x = width / 2 + Math.cos(angle) * dist;
          const y = height / 2 + Math.sin(angle) * dist;

          ctx.fillStyle = `rgba(251, 191, 36, ${0.6 + Math.sin(Date.now() / 400 + i) * 0.4})`;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.shadowBlur = 40;
        ctx.shadowColor = '#fbbf24';
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 56px serif';
        ctx.textAlign = 'center';
        ctx.fillText('Journey Complete', width / 2, height / 2 - 20);

        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#78350f';
        ctx.fillText('🏛️ Temple Reached 🏛️', width / 2, height / 2 + 30);
        ctx.shadowBlur = 0;
      }

      // Clean up dead particles
      setSandParticles(prev => prev.filter(p => p.life > 0));

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [pathProgress, isRecording, audioLevel, gameState, sandParticles, stars]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🗺️ Treasure Talk</h1>
        <p style={styles.subtitle}>Journey Through the Desert of Words</p>
      </div>

      <canvas ref={canvasRef} width={600} height={400} style={styles.canvas} />

      <div style={styles.promptBox}>
        <p style={styles.promptIcon}>📜</p>
        <p style={styles.prompt}>{prompt}</p>
        <p style={styles.hint2}>Speak freely and express yourself...</p>
      </div>

      <MicWaveform audioLevel={audioLevel} isRecording={isRecording} />

      {gameState === 'ready' && (
        <div style={styles.buttonGroup}>
          <button onClick={handleStart} style={styles.button}>
            🗣️ SPEAK FREELY
          </button>
          {pathProgress > 0 && (
            <button onClick={handleReset} style={styles.secondaryButton}>
              Reset Journey
            </button>
          )}
        </div>
      )}

      {gameState === 'recording' && (
        <div style={styles.statusBox}>
          <p style={styles.statusLabel}>● JOURNEYING</p>
          <p style={styles.statusHint}>Share your thoughts... (will stop on silence)</p>
        </div>
      )}

      {gameState === 'analyzing' && (
        <div style={styles.statusBox}>
          <p style={styles.statusLabel}>⟳ LISTENING</p>
          <p style={styles.statusHint}>Absorbing your words...</p>
        </div>
      )}

      {gameState === 'result' && (
        <div style={styles.result}>
          <div style={styles.feedbackBox}>
            <p style={styles.feedbackEmoji}>✨</p>
            <p style={styles.feedback}>{feedback}</p>
          </div>

          {transcript && (
            <div style={styles.transcriptBox}>
              <p style={styles.transcriptLabel}>📝 Your Journey:</p>
              <p style={styles.transcript}>"{transcript}"</p>
            </div>
          )}

          {features && (
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <p style={styles.statLabel}>Words/Min</p>
                <p style={styles.statValue}>{features.words_per_minute || 0}</p>
              </div>
              <div style={styles.statCard}>
                <p style={styles.statLabel}>Expression</p>
                <p style={styles.statValue}>{Math.round((features.expressive_continuity || 0) * 100)}%</p>
              </div>
              <div style={styles.statCard}>
                <p style={styles.statLabel}>Progress</p>
                <p style={styles.statValue}>{Math.round(pathProgress * 100)}%</p>
              </div>
            </div>
          )}

          <button onClick={handleNextRound} style={styles.button}>
            {pathProgress >= 1 ? '🏛️ NEW JOURNEY' : '🗺️ CONTINUE'}
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
    background: 'linear-gradient(180deg, #fed7aa 0%, #fdba74 50%, #fb923c 100%)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '3rem',
    background: 'linear-gradient(90deg, #f59e0b, #dc2626, #78350f)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#78350f',
    fontSize: '1.2rem',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  canvas: {
    borderRadius: '16px',
    border: '3px solid rgba(245, 158, 11, 0.6)',
    marginBottom: '1.5rem',
    boxShadow: '0 0 40px rgba(245, 158, 11, 0.4), 0 8px 32px rgba(220, 38, 38, 0.3)',
  },
  promptBox: {
    background: 'rgba(254, 243, 199, 0.9)',
    padding: '1.5rem 2.5rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    border: '2px solid rgba(245, 158, 11, 0.6)',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
  },
  promptIcon: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
  },
  prompt: {
    fontSize: '1.4rem',
    color: '#78350f',
    fontStyle: 'italic',
    marginBottom: '0.5rem',
    fontWeight: '500',
  },
  hint2: {
    fontSize: '0.95rem',
    color: '#92400e',
    fontStyle: 'italic',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  button: {
    padding: '1.2rem 3.5rem',
    fontSize: '1.3rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    border: 'none',
    borderRadius: '12px',
    color: '#78350f',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  secondaryButton: {
    padding: '1rem 2rem',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    background: 'rgba(120, 53, 15, 0.4)',
    border: '2px solid rgba(120, 53, 15, 0.6)',
    borderRadius: '12px',
    color: '#78350f',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  statusBox: {
    background: 'rgba(254, 243, 199, 0.8)',
    padding: '1.5rem 2rem',
    borderRadius: '12px',
    border: '2px solid rgba(245, 158, 11, 0.6)',
    textAlign: 'center',
    marginTop: '1rem',
  },
  statusLabel: {
    color: '#dc2626',
    fontSize: '1.3rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  statusHint: {
    color: '#78350f',
    fontSize: '1rem',
  },
  result: {
    textAlign: 'center',
    marginTop: '1rem',
    width: '100%',
    maxWidth: '600px',
  },
  feedbackBox: {
    background: 'rgba(254, 243, 199, 0.9)',
    padding: '1.5rem',
    borderRadius: '12px',
    marginBottom: '1rem',
    border: '2px solid rgba(220, 38, 38, 0.5)',
  },
  feedbackEmoji: {
    fontSize: '3rem',
    marginBottom: '0.5rem',
  },
  feedback: {
    fontSize: '1.5rem',
    color: '#dc2626',
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  transcriptBox: {
    background: 'rgba(34, 197, 94, 0.15)',
    padding: '1.5rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    border: '2px solid #4ade80',
    boxShadow: '0 0 20px rgba(74, 222, 128, 0.2)',
  },
  transcriptLabel: {
    color: '#86efac',
    fontSize: '1rem',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
  },
  transcript: {
    color: '#78350f',
    fontSize: '1.5rem',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  statsRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    justifyContent: 'center',
  },
  statCard: {
    background: 'rgba(254, 243, 199, 0.7)',
    padding: '1rem',
    borderRadius: '10px',
    border: '2px solid rgba(245, 158, 11, 0.5)',
    minWidth: '120px',
  },
  statLabel: {
    color: '#92400e',
    fontSize: '0.85rem',
    marginBottom: '0.5rem',
  },
  statValue: {
    color: '#dc2626',
    fontSize: '1.8rem',
    fontWeight: 'bold',
  },
};

export default TreasureTalk;
