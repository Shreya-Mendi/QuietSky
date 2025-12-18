import React, { useState, useEffect, useRef } from 'react';
import { useRecorder } from '../hooks/useRecorder';
import { analyzeAudio } from '../api';

const RocketFlight = () => {
  const [gameState, setGameState] = useState('ready');
  const [feedback, setFeedback] = useState('');
  const [rocketFuel, setRocketFuel] = useState(0);
  const [rocketHeight, setRocketHeight] = useState(0); // Actual visual height
  const [transcript, setTranscript] = useState('');
  const [features, setFeatures] = useState(null);
  const [stars, setStars] = useState([]);
  const [clouds, setClouds] = useState([]);
  const [planets, setPlanets] = useState([]);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const handleSilenceDetected = async () => {
    const audioBlob = await stopRecording();
    if (audioBlob) {
      setGameState('analyzing');
      try {
        const result = await analyzeAudio(audioBlob, 'rocket');
        console.log('=== ROCKET RESPONSE ===');
        console.log('Fuel:', result.gameEvents?.rocketFuel);
        console.log('Transcript:', result.transcript);

        setTranscript(result.transcript);
        setFeatures(result.features);
        setFeedback(result.feedback);

        const newFuel = result.gameEvents?.rocketFuel || 0;
        console.log('Setting rocket fuel to:', newFuel);
        setRocketFuel(newFuel);

        // Animate rocket rising based on fuel
        const targetHeight = newFuel * 500; // Rocket rises up to 500px
        console.log('Rocket will rise to:', targetHeight);
        animateRocketRise(targetHeight);

        setGameState('result');
      } catch (error) {
        console.error('Analysis error:', error);
        setFeedback('Connection error. Check backend!');
        setGameState('ready');
      }
    }
  };

  const animateRocketRise = (targetHeight) => {
    const startHeight = rocketHeight;
    const duration = 1500; // 1.5 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentHeight = startHeight + (targetHeight - startHeight) * eased;

      setRocketHeight(currentHeight);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  const { isRecording, audioLevel, startRecording, stopRecording} = useRecorder(handleSilenceDetected);

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

  // Initialize parallax elements
  useEffect(() => {
    // Stars
    const newStars = [];
    for (let i = 0; i < 200; i++) {
      newStars.push({
        x: Math.random() * 1200,
        y: Math.random() * 800,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.5 + 0.5,
      });
    }
    setStars(newStars);

    // Clouds
    const newClouds = [];
    for (let i = 0; i < 8; i++) {
      newClouds.push({
        x: Math.random() * 1200,
        y: Math.random() * 600 + 100,
        width: Math.random() * 150 + 100,
        height: Math.random() * 60 + 40,
        speed: Math.random() * 0.2 + 0.1,
      });
    }
    setClouds(newClouds);

    // Planets in background
    setPlanets([
      { x: 900, y: 150, size: 120, color: '#4a5568', rings: false },
      { x: 200, y: 80, size: 60, color: '#ed8936', rings: true },
    ]);
  }, []);

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      // Deep space gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#000428');
      bgGradient.addColorStop(0.5, '#004e92');
      bgGradient.addColorStop(1, '#000428');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Draw planets
      planets.forEach(planet => {
        // Planet shadow/glow
        const planetGlow = ctx.createRadialGradient(
          planet.x, planet.y, 0,
          planet.x, planet.y, planet.size * 1.5
        );
        planetGlow.addColorStop(0, `${planet.color}80`);
        planetGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = planetGlow;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Planet body
        ctx.fillStyle = planet.color;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
        ctx.fill();

        // Planet rings
        if (planet.rings) {
          ctx.strokeStyle = `${planet.color}60`;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.ellipse(planet.x, planet.y, planet.size * 1.6, planet.size * 0.3, 0.3, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Craters/details
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(planet.x + planet.size * 0.3, planet.y - planet.size * 0.2, planet.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Animated stars (parallax effect)
      stars.forEach((star, i) => {
        star.y += star.speed;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }

        const twinkle = Math.sin(Date.now() / 500 + star.x) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);

        // Star glow
        if (star.size > 1.5) {
          ctx.fillStyle = `rgba(200, 220, 255, ${star.opacity * 0.3 * twinkle})`;
          ctx.fillRect(star.x - 1, star.y - 1, star.size + 2, star.size + 2);
        }
      });

      // Clouds with parallax
      clouds.forEach(cloud => {
        cloud.x += cloud.speed;
        if (cloud.x > width + 200) cloud.x = -cloud.width;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.ellipse(cloud.x + cloud.width / 3, cloud.y - cloud.height / 4, cloud.width / 3, cloud.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Launch platform
      const platformY = height - 100;
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(width / 2 - 150, platformY, 300, 20);

      // Platform glow when recording
      if (isRecording) {
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#00d9ff';
      }
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(width / 2 - 140, platformY + 20, 280, 80);
      ctx.shadowBlur = 0;

      // ROCKET - positioned based on height (rises when fuel increases)
      const rocketX = width / 2;
      const rocketBaseY = platformY - rocketHeight; // This makes it rise!
      const rocketY = rocketBaseY - 60;

      // Rocket exhaust (MUCH MORE DRAMATIC when recording or has fuel)
      if (isRecording || rocketFuel > 0) {
        const exhaustIntensity = isRecording ? audioLevel * 0.8 + 0.2 : rocketFuel;
        const exhaustLength = 100 + exhaustIntensity * 200;

        // Main exhaust flame
        const exhaustGradient = ctx.createLinearGradient(
          rocketX, rocketBaseY,
          rocketX, rocketBaseY + exhaustLength
        );
        exhaustGradient.addColorStop(0, `rgba(255, 200, 100, ${exhaustIntensity})`);
        exhaustGradient.addColorStop(0.3, `rgba(255, 100, 50, ${exhaustIntensity * 0.8})`);
        exhaustGradient.addColorStop(0.6, `rgba(100, 150, 255, ${exhaustIntensity * 0.5})`);
        exhaustGradient.addColorStop(1, 'rgba(100, 150, 255, 0)');

        ctx.fillStyle = exhaustGradient;
        ctx.beginPath();
        ctx.moveTo(rocketX - 25, rocketBaseY);
        ctx.lineTo(rocketX + 25, rocketBaseY);
        ctx.lineTo(rocketX + 15, rocketBaseY + exhaustLength);
        ctx.lineTo(rocketX - 15, rocketBaseY + exhaustLength);
        ctx.closePath();
        ctx.fill();

        // Exhaust particles
        for (let i = 0; i < 15; i++) {
          const px = rocketX + (Math.random() - 0.5) * 40;
          const py = rocketBaseY + Math.random() * exhaustLength;
          const pSize = Math.random() * 4 + 2;
          const pAlpha = Math.random() * exhaustIntensity;

          ctx.fillStyle = Math.random() > 0.5
            ? `rgba(255, 150, 50, ${pAlpha})`
            : `rgba(100, 180, 255, ${pAlpha})`;
          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Rocket body with metallic gradient
      const rocketGradient = ctx.createLinearGradient(rocketX - 30, 0, rocketX + 30, 0);
      rocketGradient.addColorStop(0, '#cbd5e0');
      rocketGradient.addColorStop(0.5, '#f7fafc');
      rocketGradient.addColorStop(1, '#a0aec0');

      // Main body
      ctx.fillStyle = rocketGradient;
      ctx.beginPath();
      ctx.moveTo(rocketX, rocketY - 30); // Nose
      ctx.lineTo(rocketX - 30, rocketY + 50);
      ctx.lineTo(rocketX + 30, rocketY + 50);
      ctx.closePath();
      ctx.fill();

      // Body highlights
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rocketX - 15, rocketY - 10);
      ctx.lineTo(rocketX - 15, rocketY + 40);
      ctx.stroke();

      // Red accent stripe
      ctx.fillStyle = '#fc8181';
      ctx.fillRect(rocketX - 30, rocketY + 10, 60, 8);

      // Windows
      ctx.fillStyle = '#4299e1';
      ctx.beginPath();
      ctx.arc(rocketX, rocketY, 12, 0, Math.PI * 2);
      ctx.fill();

      // Window reflection
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(rocketX - 3, rocketY - 3, 5, 0, Math.PI * 2);
      ctx.fill();

      // Fins with gradient
      const finGradient = ctx.createLinearGradient(rocketX - 50, 0, rocketX - 30, 0);
      finGradient.addColorStop(0, '#718096');
      finGradient.addColorStop(1, '#a0aec0');

      ctx.fillStyle = finGradient;
      // Left fin
      ctx.beginPath();
      ctx.moveTo(rocketX - 30, rocketY + 30);
      ctx.lineTo(rocketX - 55, rocketY + 70);
      ctx.lineTo(rocketX - 30, rocketY + 50);
      ctx.fill();

      // Right fin
      ctx.beginPath();
      ctx.moveTo(rocketX + 30, rocketY + 30);
      ctx.lineTo(rocketX + 55, rocketY + 70);
      ctx.lineTo(rocketX + 30, rocketY + 50);
      ctx.fill();

      // HUD Overlay - Altitude indicator (BIG and CLEAR)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(20, 20, 250, 120);
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, 250, 120);

      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('ALTITUDE', 35, 45);
      ctx.font = 'bold 36px monospace';
      ctx.fillText(`${Math.round(rocketHeight)}m`, 35, 80);

      ctx.font = 'bold 18px monospace';
      ctx.fillText('FUEL', 35, 105);
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`${Math.round(rocketFuel * 100)}%`, 35, 130);

      // Big progress bar on right
      const barX = width - 270;
      const barY = 30;
      const barWidth = 40;
      const barHeight = 500;

      // Bar background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Fuel fill (bottom to top)
      const fuelHeight = barHeight * rocketFuel;
      const fuelY = barY + barHeight - fuelHeight;

      const fuelGradient = ctx.createLinearGradient(0, fuelY, 0, barY + barHeight);
      fuelGradient.addColorStop(0, '#fbbf24');
      fuelGradient.addColorStop(0.5, '#f59e0b');
      fuelGradient.addColorStop(1, '#dc2626');

      ctx.fillStyle = fuelGradient;
      ctx.fillRect(barX, fuelY, barWidth, fuelHeight);

      ctx.strokeStyle = '#cbd5e0';
      ctx.lineWidth = 3;
      ctx.strokeRect(barX, barY, barWidth, barHeight);

      // Status
      if (gameState === 'recording') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(width / 2 - 100, 30, 200, 50);
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('● RECORDING', width / 2, 60);
      } else if (gameState === 'analyzing') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(width / 2 - 100, 30, 200, 50);
        ctx.fillStyle = '#ecc94b';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⟳ ANALYZING', width / 2, 60);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stars, clouds, planets, isRecording, audioLevel, rocketHeight, rocketFuel, gameState]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🚀 Space Flight Training</h1>
        <p style={styles.subtitle}>Smooth Voice Control</p>
      </div>

      <canvas ref={canvasRef} width={1200} height={800} style={styles.canvas} />

      <div style={styles.controls}>
        <div style={styles.promptBox}>
          <p style={styles.prompt}>
            🎤 Speak smoothly to launch your rocket! Try: "Ahhhh" or "Ready for liftoff"
          </p>
        </div>

        {gameState === 'ready' && (
          <button onClick={handleStart} style={styles.button}>
            🎤 START MISSION
          </button>
        )}

        {gameState === 'recording' && (
          <div style={styles.statusBox}>
            <p style={styles.status}>🔴 Recording... Speak now!</p>
            <p style={styles.hint}>(Will auto-stop after 2.5s of silence)</p>
          </div>
        )}

        {gameState === 'analyzing' && (
          <div style={styles.statusBox}>
            <p style={styles.status}>⏳ Analyzing your voice...</p>
          </div>
        )}

        {gameState === 'result' && (
          <div style={styles.results}>
            <div style={styles.feedbackBox}>
              <p style={styles.feedbackTitle}>🎯 Mission Status:</p>
              <p style={styles.feedback}>{feedback}</p>
            </div>

            {transcript && (
              <div style={styles.transcriptBox}>
                <p style={styles.transcriptLabel}>📝 Transmission Received:</p>
                <p style={styles.transcript}>"{transcript}"</p>
              </div>
            )}

            {features && (
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <p style={styles.statLabel}>Continuity</p>
                  <p style={styles.statValue}>{(features.continuity * 100).toFixed(0)}%</p>
                  <div style={styles.statBar}>
                    <div style={{...styles.statBarFill, width: `${features.continuity * 100}%`}}></div>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <p style={styles.statLabel}>Smooth Onset</p>
                  <p style={styles.statValue}>{(features.onset_smoothness * 100).toFixed(0)}%</p>
                  <div style={styles.statBar}>
                    <div style={{...styles.statBarFill, width: `${features.onset_smoothness * 100}%`}}></div>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <p style={styles.statLabel}>Stability</p>
                  <p style={styles.statValue}>{(features.airflow_stability * 100).toFixed(0)}%</p>
                  <div style={styles.statBar}>
                    <div style={{...styles.statBarFill, width: `${features.airflow_stability * 100}%`}}></div>
                  </div>
                </div>
              </div>
            )}

            <button onClick={handleNextRound} style={styles.button}>
              🚀 NEXT LAUNCH
            </button>
          </div>
        )}
      </div>
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '1.2rem',
  },
  canvas: {
    border: '4px solid #1e293b',
    borderRadius: '12px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
    marginBottom: '2rem',
  },
  controls: {
    width: '100%',
    maxWidth: '800px',
    textAlign: 'center',
  },
  promptBox: {
    background: 'rgba(15, 23, 42, 0.8)',
    padding: '1.5rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    border: '2px solid #334155',
  },
  prompt: {
    fontSize: '1.2rem',
    color: '#e2e8f0',
    margin: 0,
  },
  button: {
    padding: '1.25rem 3rem',
    fontSize: '1.3rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 10px 25px rgba(102, 126, 234, 0.5)',
    transition: 'transform 0.2s',
  },
  statusBox: {
    background: 'rgba(15, 23, 42, 0.8)',
    padding: '2rem',
    borderRadius: '12px',
    border: '2px solid #334155',
  },
  status: {
    fontSize: '1.5rem',
    color: '#4ade80',
    margin: '0 0 0.5rem 0',
    fontWeight: 'bold',
  },
  hint: {
    fontSize: '1rem',
    color: '#94a3b8',
    margin: 0,
  },
  results: {
    animation: 'fadeIn 0.5s',
  },
  feedbackBox: {
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
    padding: '2rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    border: '2px solid #667eea',
  },
  feedbackTitle: {
    fontSize: '1rem',
    color: '#94a3b8',
    margin: '0 0 0.5rem 0',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  feedback: {
    fontSize: '2rem',
    color: '#fff',
    margin: 0,
    fontWeight: 'bold',
  },
  transcriptBox: {
    background: 'rgba(15, 23, 42, 0.8)',
    padding: '1.5rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    border: '2px solid #4ade80',
  },
  transcriptLabel: {
    fontSize: '0.9rem',
    color: '#4ade80',
    margin: '0 0 0.5rem 0',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  transcript: {
    fontSize: '1.5rem',
    color: '#e2e8f0',
    margin: 0,
    fontStyle: 'italic',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginBottom: '2rem',
  },
  statCard: {
    background: 'rgba(15, 23, 42, 0.8)',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '2px solid #334155',
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    margin: '0 0 0.5rem 0',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  statValue: {
    fontSize: '2.5rem',
    color: '#667eea',
    margin: '0 0 0.5rem 0',
    fontWeight: 'bold',
  },
  statBar: {
    width: '100%',
    height: '8px',
    background: '#1e293b',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #667eea, #764ba2)',
    transition: 'width 0.5s ease',
  },
};

export default RocketFlight;
