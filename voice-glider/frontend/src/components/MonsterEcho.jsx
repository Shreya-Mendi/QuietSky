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
  const [damageParticles, setDamageParticles] = useState([]);
  const [stars, setStars] = useState([]);

  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize stars
  useEffect(() => {
    const newStars = [];
    for (let i = 0; i < 150; i++) {
      newStars.push({
        x: Math.random() * 600,
        y: Math.random() * 400,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
        brightness: Math.random()
      });
    }
    setStars(newStars);
  }, []);

  const handleSilenceDetected = async () => {
    const audioBlob = await stopRecording();
    if (audioBlob) {
      setGameState('analyzing');
      try {
        const result = await analyzeAudio(audioBlob, 'monster');

        console.log('=== MONSTER RESPONSE ===');
        console.log('Damage:', result.gameEvents.monsterDamage);
        console.log('Combo:', result.gameEvents.comboMultiplier);
        console.log('Transcript:', result.transcript);

        setTranscript(result.transcript);
        setFeedback(result.feedback);

        const damage = result.gameEvents.monsterDamage || 0;
        const combo = result.gameEvents.comboMultiplier || 1;

        setMonsterHealth(prev => Math.max(0, prev - damage));
        setComboCount(combo);
        setHit(true);

        // Create damage particles
        const newParticles = [];
        const particleCount = Math.floor(damage * 50) + 10;
        for (let i = 0; i < particleCount; i++) {
          newParticles.push({
            x: 300 + (Math.random() - 0.5) * 100,
            y: 170 + (Math.random() - 0.5) * 100,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1.0,
            color: combo > 1 ? '#fbbf24' : '#ff0080'
          });
        }
        setDamageParticles(newParticles);

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
      setMonsterHealth(1.0);
      setComboCount(0);
    }
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    setGameState('ready');
    setFeedback('');
    setTranscript('');
  };

  // Animate battle scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const animate = () => {
      // Dark mystical background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#0a0118');
      bgGradient.addColorStop(0.5, '#1a0b2e');
      bgGradient.addColorStop(1, '#2d1b4e');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Animated twinkling stars
      stars.forEach(star => {
        const twinkle = 0.3 + Math.sin(Date.now() / 500 + star.brightness * Math.PI * 2) * 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Energy floor grid
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.lineWidth = 1;
      const gridOffset = (Date.now() / 30) % 30;
      for (let i = 0; i < width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i + gridOffset, height - 50);
        ctx.lineTo(i + gridOffset, height);
        ctx.stroke();
      }

      // Monster position and shake
      const monsterX = width / 2;
      const monsterY = height / 2 - 30;
      const monsterSize = 100;
      const shakeX = hit ? (Math.random() - 0.5) * 15 : 0;
      const shakeY = hit ? (Math.random() - 0.5) * 15 : 0;

      // Monster aura (gets weaker with damage)
      const auraRadius = monsterSize + 30;
      const auraGradient = ctx.createRadialGradient(
        monsterX + shakeX, monsterY + shakeY, 0,
        monsterX + shakeX, monsterY + shakeY, auraRadius
      );
      auraGradient.addColorStop(0, `rgba(168, 85, 247, ${monsterHealth * 0.4})`);
      auraGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(monsterX + shakeX, monsterY + shakeY, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      // Monster body (changes color based on health)
      const bodyGradient = ctx.createRadialGradient(
        monsterX + shakeX, monsterY + shakeY, 0,
        monsterX + shakeX, monsterY + shakeY, monsterSize
      );
      if (hit) {
        bodyGradient.addColorStop(0, '#ff0080');
        bodyGradient.addColorStop(1, '#ff00ff');
      } else if (monsterHealth < 0.3) {
        bodyGradient.addColorStop(0, '#6b21a8');
        bodyGradient.addColorStop(1, '#4c1d95');
      } else {
        bodyGradient.addColorStop(0, '#a855f7');
        bodyGradient.addColorStop(1, '#7c3aed');
      }

      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.arc(monsterX + shakeX, monsterY + shakeY, monsterSize, 0, Math.PI * 2);
      ctx.fill();

      // Glowing outline
      ctx.strokeStyle = hit ? '#fbbf24' : '#a855f7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(monsterX + shakeX, monsterY + shakeY, monsterSize, 0, Math.PI * 2);
      ctx.stroke();

      // Friendly eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(monsterX - 30 + shakeX, monsterY - 20 + shakeY, 15, 0, Math.PI * 2);
      ctx.arc(monsterX + 30 + shakeX, monsterY - 20 + shakeY, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1a0b2e';
      ctx.beginPath();
      ctx.arc(monsterX - 30 + shakeX, monsterY - 17 + shakeY, 7, 0, Math.PI * 2);
      ctx.arc(monsterX + 30 + shakeX, monsterY - 17 + shakeY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Friendly smile (turns to frown when damaged)
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      if (monsterHealth < 0.5) {
        ctx.arc(monsterX + shakeX, monsterY + 30 + shakeY, 35, Math.PI + 0.3, Math.PI * 2 - 0.3);
      } else {
        ctx.arc(monsterX + shakeX, monsterY + 15 + shakeY, 35, 0.3, Math.PI - 0.3);
      }
      ctx.stroke();

      // Damage particles
      damageParticles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;

        if (particle.life > 0) {
          ctx.fillStyle = `${particle.color}${Math.floor(particle.life * 255).toString(16).padStart(2, '0')}`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Monster health bar
      const healthBarX = width / 2 - 200;
      const healthBarY = 30;
      const healthBarWidth = 400;
      const healthBarHeight = 30;

      // Background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

      // Health fill (with gradient)
      const healthWidth = healthBarWidth * monsterHealth;
      const healthGradient = ctx.createLinearGradient(healthBarX, healthBarY, healthBarX + healthWidth, healthBarY);
      if (monsterHealth > 0.6) {
        healthGradient.addColorStop(0, '#ef4444');
        healthGradient.addColorStop(1, '#f97316');
      } else if (monsterHealth > 0.3) {
        healthGradient.addColorStop(0, '#f97316');
        healthGradient.addColorStop(1, '#fbbf24');
      } else {
        healthGradient.addColorStop(0, '#fbbf24');
        healthGradient.addColorStop(1, '#84cc16');
      }

      ctx.fillStyle = healthGradient;
      ctx.fillRect(healthBarX, healthBarY, healthWidth, healthBarHeight);

      // Border with glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#a855f7';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
      ctx.shadowBlur = 0;

      // Health text
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`RAKSHASA HP: ${Math.round(monsterHealth * 100)}%`, width / 2, healthBarY + 21);

      // Combo counter (animated)
      if (comboCount > 1) {
        const comboScale = 1 + Math.sin(Date.now() / 200) * 0.1;
        ctx.save();
        ctx.translate(width - 80, 80);
        ctx.scale(comboScale, comboScale);

        // Glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fbbf24';

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`x${comboCount}`, 0, 0);

        ctx.font = 'bold 16px monospace';
        ctx.fillText('COMBO!', 0, 20);

        ctx.restore();
        ctx.shadowBlur = 0;
      }

      // Victory message
      if (monsterHealth <= 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);

        // Victory star burst
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * Math.PI * 2;
          const dist = 80 + Math.sin(Date.now() / 200 + i) * 20;
          const x = width / 2 + Math.cos(angle) * dist;
          const y = height / 2 + Math.sin(angle) * dist;

          ctx.fillStyle = `rgba(251, 191, 36, ${0.5 + Math.sin(Date.now() / 300 + i) * 0.5})`;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.shadowBlur = 30;
        ctx.shadowColor = '#fbbf24';
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 60px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', width / 2, height / 2 - 20);

        ctx.font = 'bold 24px monospace';
        ctx.fillStyle = '#a855f7';
        ctx.fillText('Rakshasa Defeated', width / 2, height / 2 + 30);
        ctx.shadowBlur = 0;
      }

      // Combat glow when recording
      if (isRecording) {
        const glowRadius = 150 + audioLevel * 80;
        const glowGradient = ctx.createRadialGradient(
          width / 2, height - 80, 0,
          width / 2, height - 80, glowRadius
        );
        glowGradient.addColorStop(0, `rgba(0, 217, 255, ${audioLevel * 0.7})`);
        glowGradient.addColorStop(1, 'rgba(0, 217, 255, 0)');

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(width / 2, height - 80, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Voice energy rings
        for (let i = 0; i < 3; i++) {
          const ringRadius = glowRadius * (1 - i * 0.3) + Math.sin(Date.now() / 200 + i) * 10;
          ctx.strokeStyle = `rgba(0, 217, 255, ${audioLevel * (0.5 - i * 0.15)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(width / 2, height - 80, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Clean up dead particles
      setDamageParticles(prev => prev.filter(p => p.life > 0));

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [monsterHealth, comboCount, hit, isRecording, audioLevel, gameState, damageParticles, stars]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>👾 Monster Echo</h1>
        <p style={styles.subtitle}>Controlled Repetition Battle Mode</p>
      </div>

      <canvas ref={canvasRef} width={600} height={400} style={styles.canvas} />

      <div style={styles.promptBox}>
        <p style={styles.promptLabel}>⚔️ Battle Word:</p>
        <p style={styles.prompt}>"{prompt}"</p>
        <p style={styles.hint2}>Repeat smoothly for combo attacks!</p>
      </div>

      <MicWaveform audioLevel={audioLevel} isRecording={isRecording} />

      {gameState === 'ready' && (
        <button onClick={handleStart} style={styles.button}>
          ⚔️ CHALLENGE RAKSHASA
        </button>
      )}

      {gameState === 'recording' && (
        <div style={styles.statusBox}>
          <p style={styles.statusLabel}>● CHANNELING ATTACK</p>
          <p style={styles.statusHint}>Speak the word... (will stop on silence)</p>
        </div>
      )}

      {gameState === 'analyzing' && (
        <div style={styles.statusBox}>
          <p style={styles.statusLabel}>⟳ CALCULATING DAMAGE</p>
          <p style={styles.statusHint}>Processing your attack...</p>
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
              <p style={styles.transcriptLabel}>📝 Attack Command:</p>
              <p style={styles.transcript}>"{transcript}"</p>
            </div>
          )}

          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <p style={styles.statLabel}>Damage Dealt</p>
              <p style={styles.statValue}>{Math.round((1 - (monsterHealth / (monsterHealth + 0.2))) * 100)}%</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statLabel}>Combo</p>
              <p style={styles.statValue}>x{comboCount}</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statLabel}>HP Remaining</p>
              <p style={styles.statValue}>{Math.round(monsterHealth * 100)}%</p>
            </div>
          </div>

          <button onClick={handleNextRound} style={styles.button}>
            {monsterHealth <= 0 ? '🎯 NEW BATTLE' : '⚔️ NEXT STRIKE'}
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
    background: 'linear-gradient(180deg, #0a0118 0%, #1a0b2e 50%, #2d1b4e 100%)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '3rem',
    background: 'linear-gradient(90deg, #a855f7, #ec4899, #fbbf24)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#c4b5fd',
    fontSize: '1.2rem',
    fontWeight: '500',
  },
  canvas: {
    borderRadius: '16px',
    border: '3px solid rgba(168, 85, 247, 0.5)',
    marginBottom: '1.5rem',
    boxShadow: '0 0 40px rgba(168, 85, 247, 0.4), 0 0 80px rgba(168, 85, 247, 0.2)',
  },
  promptBox: {
    background: 'rgba(26, 11, 46, 0.9)',
    padding: '1.5rem 2.5rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    border: '2px solid rgba(168, 85, 247, 0.6)',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(168, 85, 247, 0.3)',
  },
  promptLabel: {
    fontSize: '1.1rem',
    color: '#c4b5fd',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
  },
  prompt: {
    fontSize: '2.5rem',
    color: '#fbbf24',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textShadow: '0 0 20px rgba(251, 191, 36, 0.6)',
    marginBottom: '0.5rem',
  },
  hint2: {
    fontSize: '0.95rem',
    color: '#a78bfa',
    fontStyle: 'italic',
  },
  button: {
    padding: '1.2rem 3.5rem',
    fontSize: '1.3rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    cursor: 'pointer',
    marginTop: '1rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  statusBox: {
    background: 'rgba(26, 11, 46, 0.8)',
    padding: '1.5rem 2rem',
    borderRadius: '12px',
    border: '2px solid rgba(168, 85, 247, 0.5)',
    textAlign: 'center',
    marginTop: '1rem',
  },
  statusLabel: {
    color: '#fbbf24',
    fontSize: '1.3rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  statusHint: {
    color: '#c4b5fd',
    fontSize: '1rem',
  },
  result: {
    textAlign: 'center',
    marginTop: '1rem',
    width: '100%',
    maxWidth: '600px',
  },
  feedbackBox: {
    background: 'rgba(26, 11, 46, 0.9)',
    padding: '1.5rem',
    borderRadius: '12px',
    marginBottom: '1rem',
    border: '2px solid rgba(236, 72, 153, 0.5)',
  },
  feedbackEmoji: {
    fontSize: '3rem',
    marginBottom: '0.5rem',
  },
  feedback: {
    fontSize: '1.5rem',
    color: '#fbbf24',
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
    background: 'rgba(26, 11, 46, 0.8)',
    padding: '1rem',
    borderRadius: '10px',
    border: '2px solid rgba(168, 85, 247, 0.4)',
    minWidth: '120px',
  },
  statLabel: {
    color: '#c4b5fd',
    fontSize: '0.85rem',
    marginBottom: '0.5rem',
  },
  statValue: {
    color: '#fbbf24',
    fontSize: '1.8rem',
    fontWeight: 'bold',
  },
};

export default MonsterEcho;
