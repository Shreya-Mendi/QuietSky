import React, { useState, useEffect, useRef } from 'react';
import { useRecorder } from '../hooks/useRecorder';
import { analyzeAudio } from '../api';
import MicWaveform from './MicWaveform';

const EchoBird = () => {
  const [gameState, setGameState] = useState('ready');
  const [prompt, setPrompt] = useState('Make rhythmic sounds to fly');
  const [feedback, setFeedback] = useState('');
  const [birdY, setBirdY] = useState(200);
  const [targetBirdY, setTargetBirdY] = useState(200);
  const [score, setScore] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [trail, setTrail] = useState([]);
  const [stars, setStars] = useState([]);
  const [buildings, setBuildings] = useState([]);

  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize stars and buildings
  useEffect(() => {
    const newStars = [];
    for (let i = 0; i < 100; i++) {
      newStars.push({
        x: Math.random() * 600,
        y: Math.random() * 300,
        size: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.3,
        brightness: Math.random()
      });
    }
    setStars(newStars);

    const newBuildings = [];
    for (let i = 0; i < 8; i++) {
      newBuildings.push({
        x: i * 100,
        height: 80 + Math.random() * 80,
        width: 70 + Math.random() * 30,
        color: Math.random() > 0.5 ? '#ec4899' : '#a855f7',
        windowPattern: Math.floor(Math.random() * 3)
      });
    }
    setBuildings(newBuildings);
  }, []);

  const handleSilenceDetected = async () => {
    const audioBlob = await stopRecording();
    if (audioBlob) {
      setGameState('analyzing');
      try {
        const result = await analyzeAudio(audioBlob, 'bird');

        console.log('=== BIRD RESPONSE ===');
        console.log('Lift:', result.gameEvents.birdLift);
        console.log('Rhythm:', result.features?.rhythm_match);
        console.log('Transcript:', result.transcript);

        setTranscript(result.transcript);
        setFeedback(result.feedback);

        const lift = result.gameEvents.birdLift || 1;

        // Animate bird movement
        const newY = Math.max(50, Math.min(350, birdY - lift * 40));
        setTargetBirdY(newY);

        // Add to trail
        const newTrail = [];
        for (let i = 0; i < 15; i++) {
          newTrail.push({
            x: 150 - i * 10,
            y: birdY + (Math.random() - 0.5) * 20,
            life: 1.0,
            size: 5 - i * 0.3
          });
        }
        setTrail(newTrail);

        setScore(prev => prev + Math.floor(lift * 10));

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
    const newY = Math.min(350, targetBirdY + 30);
    setBirdY(newY);
    setTargetBirdY(newY);
    setGameState('ready');
    setFeedback('');
    setTranscript('');
  };

  const handleReset = () => {
    setBirdY(200);
    setTargetBirdY(200);
    setScore(0);
    setGameState('ready');
    setFeedback('');
    setTranscript('');
  };

  // Animate scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const animate = () => {
      // Neon cyber sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
      skyGradient.addColorStop(0, '#0a0118');
      skyGradient.addColorStop(0.3, '#0f172a');
      skyGradient.addColorStop(0.7, '#1e293b');
      skyGradient.addColorStop(1, '#334155');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height);

      // Animated stars (parallax)
      stars.forEach(star => {
        star.x -= star.speed;
        if (star.x < 0) star.x = width;

        const twinkle = 0.3 + Math.sin(Date.now() / 400 + star.brightness * Math.PI * 2) * 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Neon grid lines (moving)
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.15)';
      ctx.lineWidth = 1;
      const gridOffset = (Date.now() / 50) % 40;

      for (let i = 0; i < height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i + gridOffset);
        ctx.lineTo(width, i + gridOffset);
        ctx.stroke();
      }

      // Neon buildings (scrolling)
      buildings.forEach(building => {
        building.x -= 1;
        if (building.x < -building.width) {
          building.x = width;
          building.height = 80 + Math.random() * 80;
        }

        const buildingY = height - building.height;

        // Building silhouette
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(building.x, buildingY, building.width, building.height);

        // Neon windows
        ctx.fillStyle = building.color;
        const windowCols = 3;
        const windowRows = Math.floor(building.height / 30);

        for (let row = 0; row < windowRows; row++) {
          for (let col = 0; col < windowCols; col++) {
            const wx = building.x + 10 + col * 20;
            const wy = buildingY + 15 + row * 30;

            // Random flicker
            if (Math.random() > 0.1) {
              ctx.fillRect(wx, wy, 12, 15);

              // Window glow
              ctx.shadowBlur = 8;
              ctx.shadowColor = building.color;
              ctx.fillRect(wx, wy, 12, 15);
              ctx.shadowBlur = 0;
            }
          }
        }

        // Building outline glow
        ctx.strokeStyle = building.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = building.color;
        ctx.strokeRect(building.x, buildingY, building.width, building.height);
        ctx.shadowBlur = 0;
      });

      // Smooth bird movement
      if (Math.abs(birdY - targetBirdY) > 1) {
        setBirdY(prev => prev + (targetBirdY - prev) * 0.1);
      }

      const birdX = 150;
      const birdSize = 35;

      // Trail particles
      trail.forEach(particle => {
        particle.life -= 0.03;
        particle.x -= 2;

        if (particle.life > 0) {
          const alpha = particle.life;
          ctx.fillStyle = `rgba(236, 72, 153, ${alpha * 0.6})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Bird glow aura
      const birdGlow = ctx.createRadialGradient(birdX, birdY, 0, birdX, birdY, birdSize + 20);
      birdGlow.addColorStop(0, 'rgba(236, 72, 153, 0.8)');
      birdGlow.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)');
      birdGlow.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = birdGlow;
      ctx.beginPath();
      ctx.arc(birdX, birdY, birdSize + 20, 0, Math.PI * 2);
      ctx.fill();

      // Bird body (triangle)
      const birdGradient = ctx.createLinearGradient(birdX - 25, birdY, birdX + 25, birdY);
      birdGradient.addColorStop(0, '#ec4899');
      birdGradient.addColorStop(0.5, '#a855f7');
      birdGradient.addColorStop(1, '#00d9ff');
      ctx.fillStyle = birdGradient;

      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ec4899';
      ctx.beginPath();
      ctx.moveTo(birdX + 25, birdY);
      ctx.lineTo(birdX - 20, birdY - 18);
      ctx.lineTo(birdX - 20, birdY + 18);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Bird outline
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(birdX + 25, birdY);
      ctx.lineTo(birdX - 20, birdY - 18);
      ctx.lineTo(birdX - 20, birdY + 18);
      ctx.closePath();
      ctx.stroke();

      // Bird eye
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(birdX + 8, birdY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(birdX + 9, birdY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Wings (animated when recording)
      if (isRecording) {
        const wingFlap = Math.sin(Date.now() / 100) * 15;
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ec4899';

        ctx.beginPath();
        ctx.moveTo(birdX - 8, birdY);
        ctx.lineTo(birdX - 30, birdY - 25 + wingFlap);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(birdX - 8, birdY);
        ctx.lineTo(birdX - 30, birdY + 25 - wingFlap);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Energy field when recording
      if (isRecording && audioLevel > 0.1) {
        const energyRadius = 60 + audioLevel * 40;
        const energyGradient = ctx.createRadialGradient(
          birdX, birdY, 0,
          birdX, birdY, energyRadius
        );
        energyGradient.addColorStop(0, `rgba(0, 217, 255, ${audioLevel * 0.5})`);
        energyGradient.addColorStop(1, 'rgba(0, 217, 255, 0)');

        ctx.fillStyle = energyGradient;
        ctx.beginPath();
        ctx.arc(birdX, birdY, energyRadius, 0, Math.PI * 2);
        ctx.fill();

        // Energy rings
        for (let i = 0; i < 3; i++) {
          const ringRadius = energyRadius * (1 - i * 0.25) + Math.sin(Date.now() / 150 + i) * 8;
          ctx.strokeStyle = `rgba(0, 217, 255, ${audioLevel * (0.6 - i * 0.2)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(birdX, birdY, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Voice particles
        for (let i = 0; i < 5; i++) {
          const particleAngle = (Date.now() / 50 + i * 72) % 360;
          const particleRadius = 50 + audioLevel * 30;
          const px = birdX + Math.cos(particleAngle * Math.PI / 180) * particleRadius;
          const py = birdY + Math.sin(particleAngle * Math.PI / 180) * particleRadius;

          ctx.fillStyle = `rgba(0, 217, 255, ${audioLevel * 0.8})`;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Score display (neon style)
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00d9ff';
      ctx.fillStyle = '#00d9ff';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${score}`, 20, 45);
      ctx.shadowBlur = 0;

      // Altitude indicator
      const altitudePercent = Math.round((1 - birdY / 400) * 100);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`ALT: ${altitudePercent}%`, 20, 75);

      // Status indicator
      ctx.textAlign = 'right';
      if (gameState === 'recording') {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#22c55e';
        ctx.fillStyle = '#22c55e';
        ctx.fillText('[ FLYING ]', width - 20, 45);
        ctx.shadowBlur = 0;
      } else if (gameState === 'analyzing') {
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('[ ANALYZING ]', width - 20, 45);
      }

      // Altitude bar (vertical on right)
      const altBarX = width - 40;
      const altBarY = 100;
      const altBarHeight = 280;
      const altBarWidth = 20;

      // Background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(altBarX, altBarY, altBarWidth, altBarHeight);

      // Altitude fill (inverted - higher bird = more fill)
      const altFill = (1 - birdY / 400) * altBarHeight;
      const altY = altBarY + altBarHeight - altFill;

      const altGradient = ctx.createLinearGradient(altBarX, altY, altBarX, altBarY + altBarHeight);
      altGradient.addColorStop(0, '#00d9ff');
      altGradient.addColorStop(0.5, '#a855f7');
      altGradient.addColorStop(1, '#ec4899');

      ctx.fillStyle = altGradient;
      ctx.fillRect(altBarX, altY, altBarWidth, altFill);

      // Border
      ctx.strokeStyle = '#00d9ff';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00d9ff';
      ctx.strokeRect(altBarX, altBarY, altBarWidth, altBarHeight);
      ctx.shadowBlur = 0;

      // Clean up dead trail particles
      setTrail(prev => prev.filter(p => p.life > 0));

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [birdY, targetBirdY, score, isRecording, audioLevel, gameState, trail, stars, buildings]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎵 Echo Bird</h1>
        <p style={styles.subtitle}>Rhythm & Pacing Flight Mode</p>
      </div>

      <canvas ref={canvasRef} width={600} height={400} style={styles.canvas} />

      <div style={styles.promptBox}>
        <p style={styles.prompt}>{prompt}</p>
        <p style={styles.hint2}>🎶 Short sounds = small flaps | Long sounds = soaring glides</p>
      </div>

      <MicWaveform audioLevel={audioLevel} isRecording={isRecording} />

      {gameState === 'ready' && (
        <div style={styles.buttonGroup}>
          <button onClick={handleStart} style={styles.button}>
            🎵 FLAP WINGS
          </button>
          <button onClick={handleReset} style={styles.secondaryButton}>
            Reset
          </button>
        </div>
      )}

      {gameState === 'recording' && (
        <div style={styles.statusBox}>
          <p style={styles.statusLabel}>● IN FLIGHT</p>
          <p style={styles.statusHint}>Speak rhythmically... (will stop on silence)</p>
        </div>
      )}

      {gameState === 'analyzing' && (
        <div style={styles.statusBox}>
          <p style={styles.statusLabel}>⟳ ANALYZING FLIGHT</p>
          <p style={styles.statusHint}>Processing your rhythm...</p>
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
              <p style={styles.transcriptLabel}>📝 Flight Pattern:</p>
              <p style={styles.transcript}>"{transcript}"</p>
            </div>
          )}

          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <p style={styles.statLabel}>Score</p>
              <p style={styles.statValue}>{score}</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statLabel}>Altitude</p>
              <p style={styles.statValue}>{Math.round((1 - birdY / 400) * 100)}%</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statLabel}>Status</p>
              <p style={styles.statValue}>🚀</p>
            </div>
          </div>

          <button onClick={handleNextRound} style={styles.button}>
            🎵 KEEP FLYING
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
    background: 'linear-gradient(180deg, #0a0118 0%, #0f172a 50%, #1e293b 100%)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '3rem',
    background: 'linear-gradient(90deg, #ec4899, #a855f7, #00d9ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '1.2rem',
    fontWeight: '500',
  },
  canvas: {
    borderRadius: '16px',
    border: '3px solid rgba(236, 72, 153, 0.5)',
    marginBottom: '1.5rem',
    boxShadow: '0 0 40px rgba(236, 72, 153, 0.4), 0 0 80px rgba(0, 217, 255, 0.2)',
  },
  promptBox: {
    background: 'rgba(15, 23, 42, 0.9)',
    padding: '1.5rem 2.5rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    border: '2px solid rgba(0, 217, 255, 0.4)',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0, 217, 255, 0.3)',
  },
  prompt: {
    fontSize: '1.4rem',
    color: '#e2e8f0',
    marginBottom: '0.5rem',
    fontWeight: '500',
  },
  hint2: {
    fontSize: '1rem',
    color: '#94a3b8',
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
    background: 'linear-gradient(135deg, #ec4899, #a855f7)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(236, 72, 153, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  secondaryButton: {
    padding: '1rem 2rem',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    background: 'rgba(71, 85, 105, 0.5)',
    border: '2px solid rgba(148, 163, 184, 0.5)',
    borderRadius: '12px',
    color: '#cbd5e1',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  statusBox: {
    background: 'rgba(15, 23, 42, 0.8)',
    padding: '1.5rem 2rem',
    borderRadius: '12px',
    border: '2px solid rgba(0, 217, 255, 0.5)',
    textAlign: 'center',
    marginTop: '1rem',
  },
  statusLabel: {
    color: '#00d9ff',
    fontSize: '1.3rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  statusHint: {
    color: '#94a3b8',
    fontSize: '1rem',
  },
  result: {
    textAlign: 'center',
    marginTop: '1rem',
    width: '100%',
    maxWidth: '600px',
  },
  feedbackBox: {
    background: 'rgba(15, 23, 42, 0.9)',
    padding: '1.5rem',
    borderRadius: '12px',
    marginBottom: '1rem',
    border: '2px solid rgba(0, 217, 255, 0.5)',
  },
  feedbackEmoji: {
    fontSize: '3rem',
    marginBottom: '0.5rem',
  },
  feedback: {
    fontSize: '1.5rem',
    color: '#00d9ff',
    fontWeight: 'bold',
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
    color: '#fff',
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
    background: 'rgba(15, 23, 42, 0.8)',
    padding: '1rem',
    borderRadius: '10px',
    border: '2px solid rgba(0, 217, 255, 0.4)',
    minWidth: '120px',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    marginBottom: '0.5rem',
  },
  statValue: {
    color: '#00d9ff',
    fontSize: '1.8rem',
    fontWeight: 'bold',
  },
};

export default EchoBird;
