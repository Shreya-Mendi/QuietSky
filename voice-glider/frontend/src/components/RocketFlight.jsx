import React, { useState, useEffect, useRef } from 'react';
import { useRecorder } from '../hooks/useRecorder';
import { analyzeAudio } from '../api';

const RocketFlight = () => {
  const [gameState, setGameState] = useState('ready');
  const [feedback, setFeedback] = useState('');
  const [rocketFuel, setRocketFuel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [liveText, setLiveText] = useState('');
  const [features, setFeatures] = useState(null);
  const [successAnim, setSuccessAnim] = useState(false);

  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  const handleSilenceDetected = async () => {
    const audioBlob = await stopRecording();
    if (audioBlob) {
      setGameState('analyzing');
      setLiveText('Processing your voice...');
      try {
        const result = await analyzeAudio(audioBlob, 'rocket');
        setTranscript(result.transcript);
        setFeatures(result.features);
        setFeedback(result.feedback);
        setRocketFuel(result.gameEvents.rocketFuel);
        setSuccessAnim(true);
        setTimeout(() => setSuccessAnim(false), 1000);
        setGameState('result');
        setLiveText('');
      } catch (error) {
        console.error('Analysis error:', error);
        setFeedback('Connection error. Try again!');
        setGameState('ready');
        setLiveText('');
      }
    }
  };

  const { isRecording, audioLevel, startRecording, stopRecording } = useRecorder(handleSilenceDetected);

  const handleStart = () => {
    setGameState('recording');
    setFeedback('');
    setTranscript('');
    setLiveText('Listening to your voice...');
    startRecording();
  };

  const handleNextRound = () => {
    setGameState('ready');
    setFeedback('');
    setTranscript('');
    setLiveText('');
  };

  // Animated canvas with particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Initialize particles
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 100; i++) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
        });
      }
    }

    const animate = () => {
      // Dark space background with gradient
      const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
      bgGradient.addColorStop(0, '#0f1729');
      bgGradient.addColorStop(1, '#050a14');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Update and draw particles (stars)
      particlesRef.current.forEach(p => {
        p.x += p.vx + (isRecording ? audioLevel * 2 : 0);
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const brightness = isRecording ? 0.5 + audioLevel * 0.5 : 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      // Rocket ship
      const rocketX = width / 2;
      const rocketY = height / 2;
      const rocketSize = 60;

      // Rocket exhaust (when active)
      if (isRecording || rocketFuel > 0) {
        const exhaustLength = 40 + audioLevel * 60;
        const exhaustGradient = ctx.createLinearGradient(
          rocketX, rocketY + rocketSize / 2,
          rocketX, rocketY + rocketSize / 2 + exhaustLength
        );
        exhaustGradient.addColorStop(0, `rgba(0, 217, 255, ${0.8 + audioLevel * 0.2})`);
        exhaustGradient.addColorStop(0.5, `rgba(168, 85, 247, ${0.6 + audioLevel * 0.2})`);
        exhaustGradient.addColorStop(1, 'rgba(236, 72, 153, 0)');

        ctx.fillStyle = exhaustGradient;
        ctx.beginPath();
        ctx.moveTo(rocketX - 15, rocketY + rocketSize / 2);
        ctx.lineTo(rocketX + 15, rocketY + rocketSize / 2);
        ctx.lineTo(rocketX + 8, rocketY + rocketSize / 2 + exhaustLength);
        ctx.lineTo(rocketX - 8, rocketY + rocketSize / 2 + exhaustLength);
        ctx.closePath();
        ctx.fill();

        // Exhaust particles
        for (let i = 0; i < 5; i++) {
          const pX = rocketX + (Math.random() - 0.5) * 20;
          const pY = rocketY + rocketSize / 2 + Math.random() * exhaustLength;
          const pSize = Math.random() * 4 + 2;
          const pAlpha = Math.random() * 0.5;

          ctx.fillStyle = `rgba(0, 217, 255, ${pAlpha})`;
          ctx.beginPath();
          ctx.arc(pX, pY, pSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Rocket body
      const rocketGradient = ctx.createLinearGradient(rocketX - rocketSize / 2, 0, rocketX + rocketSize / 2, 0);
      rocketGradient.addColorStop(0, '#1e3a8a');
      rocketGradient.addColorStop(0.5, '#3b82f6');
      rocketGradient.addColorStop(1, '#60a5fa');

      // Rocket glow when active
      if (isRecording) {
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#00d9ff';
      }

      ctx.fillStyle = rocketGradient;
      ctx.beginPath();
      ctx.moveTo(rocketX, rocketY - rocketSize / 2); // Nose
      ctx.lineTo(rocketX - rocketSize / 3, rocketY + rocketSize / 2); // Left bottom
      ctx.lineTo(rocketX + rocketSize / 3, rocketY + rocketSize / 2); // Right bottom
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;

      // Rocket window
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.arc(rocketX, rocketY - 5, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(rocketX - 3, rocketY - 8, 5, 0, Math.PI * 2);
      ctx.fill();

      // Rocket fins
      ctx.fillStyle = '#1e40af';
      ctx.beginPath();
      ctx.moveTo(rocketX - rocketSize / 3, rocketY + rocketSize / 2);
      ctx.lineTo(rocketX - rocketSize / 2, rocketY + rocketSize / 2 + 15);
      ctx.lineTo(rocketX - rocketSize / 3, rocketY + rocketSize / 2 + 8);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(rocketX + rocketSize / 3, rocketY + rocketSize / 2);
      ctx.lineTo(rocketX + rocketSize / 2, rocketY + rocketSize / 2 + 15);
      ctx.lineTo(rocketX + rocketSize / 3, rocketY + rocketSize / 2 + 8);
      ctx.fill();

      // Fuel gauge (modern HUD style)
      const gaugeX = 50;
      const gaugeY = height - 60;
      const gaugeWidth = width - 100;
      const gaugeHeight = 30;

      // Gauge background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(gaugeX - 5, gaugeY - 5, gaugeWidth + 10, gaugeHeight + 10);

      ctx.strokeStyle = '#00d9ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(gaugeX - 5, gaugeY - 5, gaugeWidth + 10, gaugeHeight + 10);

      // Fuel fill
      const fuelWidth = gaugeWidth * rocketFuel;
      const fuelGradient = ctx.createLinearGradient(gaugeX, 0, gaugeX + fuelWidth, 0);
      fuelGradient.addColorStop(0, '#00d9ff');
      fuelGradient.addColorStop(0.5, '#a855f7');
      fuelGradient.addColorStop(1, '#ec4899');

      ctx.fillStyle = fuelGradient;
      ctx.fillRect(gaugeX, gaugeY, fuelWidth, gaugeHeight);

      // Animated fill effect
      if (successAnim) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(gaugeX, gaugeY, fuelWidth, gaugeHeight);
      }

      // Fuel text
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px "SF Pro", -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`FUEL: ${Math.round(rocketFuel * 100)}%`, width / 2, gaugeY + 20);

      // Status indicator
      ctx.font = 'bold 18px "SF Pro", monospace';
      ctx.textAlign = 'left';

      if (gameState === 'recording') {
        const pulse = Math.sin(Date.now() / 200) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(34, 197, 94, ${0.5 + pulse * 0.5})`;
        ctx.fillText('● REC', 30, 40);
      } else if (gameState === 'analyzing') {
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('⟳ ANALYZING', 30, 40);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, audioLevel, rocketFuel, gameState, successAnim]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🚀 ROCKET FLIGHT</h1>
        <p style={styles.subtitle}>Smooth Airflow Mode</p>
      </div>

      <div style={styles.gameContainer}>
        <canvas ref={canvasRef} width={700} height={500} style={styles.canvas} />

        {/* Live transcript overlay */}
        {(isRecording || gameState === 'analyzing') && (
          <div style={styles.liveOverlay}>
            <div style={styles.liveBox}>
              <div style={styles.liveIndicator}>
                <span style={styles.pulse}>●</span>
                {gameState === 'recording' ? 'LISTENING' : 'PROCESSING'}
              </div>
              <p style={styles.liveText}>{liveText}</p>
            </div>
          </div>
        )}
      </div>

      <div style={styles.promptBox}>
        <p style={styles.prompt}>Hold a smooth, steady sound like "Ahhhhh"</p>
      </div>

      {gameState === 'ready' && (
        <button onClick={handleStart} style={styles.button}>
          <span style={styles.buttonIcon}>🎤</span>
          START ENGINE
        </button>
      )}

      {gameState === 'result' && (
        <div style={styles.resultContainer}>
          <div style={styles.feedbackBox}>
            <p style={styles.feedbackEmoji}>✨</p>
            <p style={styles.feedback}>{feedback}</p>
          </div>

          {transcript && (
            <div style={styles.transcriptBox}>
              <p style={styles.transcriptLabel}>📝 You said:</p>
              <p style={styles.transcript}>"{transcript}"</p>
            </div>
          )}

          {features && (
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{(features.continuity * 100).toFixed(0)}%</div>
                <div style={styles.statLabel}>Continuity</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{(features.onset_smoothness * 100).toFixed(0)}%</div>
                <div style={styles.statLabel}>Smooth Start</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{(features.airflow_stability * 100).toFixed(0)}%</div>
                <div style={styles.statLabel}>Stability</div>
              </div>
            </div>
          )}

          <button onClick={handleNextRound} style={styles.button}>
            <span style={styles.buttonIcon}>🚀</span>
            NEXT FLIGHT
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
    padding: '1.5rem',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)',
    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '3rem',
    fontWeight: '900',
    background: 'linear-gradient(135deg, #00d9ff 0%, #a855f7 50%, #ec4899 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.5rem',
    letterSpacing: '2px',
    textShadow: '0 0 30px rgba(0, 217, 255, 0.5)',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '1.1rem',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '3px',
  },
  gameContainer: {
    position: 'relative',
    marginBottom: '1.5rem',
  },
  canvas: {
    borderRadius: '20px',
    border: '3px solid rgba(0, 217, 255, 0.5)',
    boxShadow: '0 20px 60px rgba(0, 217, 255, 0.3), inset 0 0 30px rgba(0, 217, 255, 0.1)',
    background: '#000',
  },
  liveOverlay: {
    position: 'absolute',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
  },
  liveBox: {
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '1rem 2rem',
    borderRadius: '15px',
    border: '2px solid rgba(0, 217, 255, 0.5)',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
    minWidth: '300px',
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    color: '#22c55e',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  pulse: {
    animation: 'pulse 1.5s infinite',
    fontSize: '1.2rem',
  },
  liveText: {
    color: '#e2e8f0',
    fontSize: '1.1rem',
    margin: 0,
    fontWeight: '500',
  },
  promptBox: {
    background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
    backdropFilter: 'blur(10px)',
    padding: '1.5rem 3rem',
    borderRadius: '15px',
    marginBottom: '1.5rem',
    border: '2px solid rgba(100, 116, 139, 0.3)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  prompt: {
    fontSize: '1.3rem',
    color: '#e2e8f0',
    textAlign: 'center',
    margin: 0,
    fontWeight: '500',
  },
  button: {
    padding: '1.2rem 3rem',
    fontSize: '1.3rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #00d9ff 0%, #a855f7 100%)',
    border: 'none',
    borderRadius: '15px',
    color: '#fff',
    cursor: 'pointer',
    marginTop: '1rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 30px rgba(0, 217, 255, 0.4)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    letterSpacing: '1px',
  },
  buttonIcon: {
    fontSize: '1.5rem',
  },
  resultContainer: {
    width: '100%',
    maxWidth: '600px',
    marginTop: '1rem',
  },
  feedbackBox: {
    background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
    padding: '2rem',
    borderRadius: '20px',
    marginBottom: '1.5rem',
    textAlign: 'center',
    border: '2px solid rgba(0, 217, 255, 0.4)',
    boxShadow: '0 10px 40px rgba(0, 217, 255, 0.3)',
  },
  feedbackEmoji: {
    fontSize: '3rem',
    margin: '0 0 0.5rem 0',
  },
  feedback: {
    fontSize: '1.8rem',
    color: '#00d9ff',
    fontWeight: 'bold',
    margin: 0,
  },
  transcriptBox: {
    background: 'rgba(15, 23, 42, 0.6)',
    padding: '1.5rem',
    borderRadius: '15px',
    marginBottom: '1.5rem',
    border: '2px solid rgba(100, 116, 139, 0.3)',
  },
  transcriptLabel: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    marginBottom: '0.5rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  transcript: {
    color: '#e2e8f0',
    fontSize: '1.3rem',
    margin: 0,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    background: 'rgba(15, 23, 42, 0.8)',
    padding: '1.5rem 1rem',
    borderRadius: '12px',
    textAlign: 'center',
    border: '2px solid rgba(0, 217, 255, 0.2)',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #00d9ff, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.3rem',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
};

export default RocketFlight;
