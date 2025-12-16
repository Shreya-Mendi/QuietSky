import React, { useState, useEffect, useRef } from 'react';
import { useRecorder } from '../hooks/useRecorder';
import { analyzeAudio } from '../api';

const RocketFlight = () => {
  const [gameState, setGameState] = useState('ready');
  const [feedback, setFeedback] = useState('');
  const [rocketFuel, setRocketFuel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [liveText, setLiveText] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [features, setFeatures] = useState(null);
  const [successAnim, setSuccessAnim] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const recognitionRef = useRef(null);

  const handleSilenceDetected = async () => {
    // Stop live recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const audioBlob = await stopRecording();
    if (audioBlob) {
      console.log('=== Audio Blob Details ===');
      console.log('Audio blob size:', audioBlob.size);
      console.log('Audio blob type:', audioBlob.type);

      setGameState('analyzing');
      setLiveText('PROCESSING VOICE DATA...');
      try {
        console.log('Sending audio to backend...');
        const result = await analyzeAudio(audioBlob, 'rocket');
        console.log('=== API Response ===');
        console.log('Full result:', result);
        console.log('Transcript:', result.transcript);
        console.log('Features:', result.features);
        console.log('Feedback:', result.feedback);
        console.log('Game Events:', result.gameEvents);
        console.log('Rocket Fuel:', result.gameEvents?.rocketFuel);

        setTranscript(result.transcript);
        setFeatures(result.features);
        setFeedback(result.feedback);

        const fuelValue = result.gameEvents?.rocketFuel || 0;
        console.log('Setting rocket fuel to:', fuelValue);
        setRocketFuel(fuelValue);

        setSuccessAnim(true);
        setTimeout(() => setSuccessAnim(false), 1000);
        setGameState('result');
        setLiveText('');
      } catch (error) {
        console.error('=== Analysis Error ===');
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);
        console.error('Error details:', error);
        console.error('Error response:', error.response);
        console.error('Error response data:', error.response?.data);
        console.error('Error response status:', error.response?.status);
        setFeedback('CONNECTION ERROR // TRY AGAIN');
        setGameState('ready');
        setLiveText('');
      }
    } else {
      console.error('=== No Audio Blob ===');
      console.error('stopRecording() returned null or undefined');
    }
  };

  const { isRecording, audioLevel, startRecording, stopRecording } = useRecorder(handleSilenceDetected);

  const handleStart = () => {
    setGameState('recording');
    setFeedback('');
    setTranscript('');
    setRocketFuel(0);
    setLiveTranscript('');
    setLiveText('VOICE INPUT ACTIVE...');
    startRecording();

    // Start live speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setLiveTranscript((prev) => {
          const updated = prev + finalTranscript;
          return updated || interimTranscript;
        });
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      recognition.start();
      recognitionRef.current = recognition;
    }
  };

  const handleNextRound = () => {
    setGameState('ready');
    setFeedback('');
    setTranscript('');
    setLiveText('');
    setRocketFuel(0); // Reset fuel
  };

  // Test backend connectivity
  const testBackend = async () => {
    try {
      const response = await fetch('http://localhost:8000/');
      const data = await response.json();
      console.log('Backend test successful:', data);
      alert('Backend is connected! ' + JSON.stringify(data));
    } catch (error) {
      console.error('Backend test failed:', error);
      alert('Backend connection failed! Check if backend is running on port 8000');
    }
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
      // Valorant-style dark tactical background
      ctx.fillStyle = '#0a0f16';
      ctx.fillRect(0, 0, width, height);

      // Grid lines - tactical HUD
      ctx.strokeStyle = 'rgba(255, 70, 85, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Update and draw particles - Valorant style angular particles
      particlesRef.current.forEach(p => {
        p.x += p.vx + (isRecording ? audioLevel * 3 : 0);
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const opacity = isRecording ? 0.4 + audioLevel * 0.4 : 0.2;

        // Draw angular particles (small diamonds/squares)
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = `rgba(255, 70, 85, ${opacity})`;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      // Tactical visualization - Angular design (moves up with fuel)
      const centerX = width / 2;
      const baseY = height / 2;
      const rocketRise = rocketFuel * 150; // Rocket rises as fuel increases
      const centerY = baseY - rocketRise;
      const visualSize = 80;

      // Energy trails when active (Valorant-style)
      if (isRecording || rocketFuel > 0) {
        const trailLength = 60 + audioLevel * 80;

        // Angular energy trails
        for (let i = 0; i < 3; i++) {
          const offset = (i - 1) * 25;
          const alpha = 0.3 + audioLevel * 0.4;

          ctx.strokeStyle = `rgba(255, 70, 85, ${alpha})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(centerX + offset, centerY + visualSize / 2);
          ctx.lineTo(centerX + offset, centerY + visualSize / 2 + trailLength);
          ctx.stroke();

          // Angular accents
          ctx.fillStyle = `rgba(255, 70, 85, ${alpha * 0.6})`;
          for (let j = 0; j < 8; j++) {
            const py = centerY + visualSize / 2 + (j * trailLength / 8);
            ctx.save();
            ctx.translate(centerX + offset, py);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-2, -2, 4, 4);
            ctx.restore();
          }
        }
      }

      // Main angular shape - Valorant style hexagon/diamond
      ctx.save();
      ctx.translate(centerX, centerY);

      // Outer glow when active
      if (isRecording) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ff4655';
      }

      // Main body - angular hexagon
      ctx.fillStyle = '#1c252e';
      ctx.strokeStyle = '#ff4655';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = Math.cos(angle) * visualSize / 2;
        const y = Math.sin(angle) * visualSize / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Inner core - pulsing
      const pulseSize = 20 + (isRecording ? audioLevel * 15 : 0);
      ctx.fillStyle = isRecording ? '#ff4655' : '#7a8a99';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = Math.cos(angle) * pulseSize;
        const y = Math.sin(angle) * pulseSize;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Corner accents
      ctx.fillStyle = '#ff4655';
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = Math.cos(angle) * (visualSize / 2 + 5);
        const y = Math.sin(angle) * (visualSize / 2 + 5);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillRect(-2, -6, 4, 12);
        ctx.restore();
      }

      ctx.restore();

      // Tactical HUD - Fuel/Power gauge (Valorant style)
      const gaugeX = 40;
      const gaugeY = height - 50;
      const gaugeWidth = width - 80;
      const gaugeHeight = 6;

      // Gauge label
      ctx.fillStyle = '#7a8a99';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('VOICE POWER', gaugeX, gaugeY - 8);

      // Gauge background
      ctx.fillStyle = '#1c252e';
      ctx.fillRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);

      // Fuel fill with angular accent
      const fuelWidth = gaugeWidth * rocketFuel;
      ctx.fillStyle = '#ff4655';
      ctx.fillRect(gaugeX, gaugeY, fuelWidth, gaugeHeight);

      // Angular end cap
      if (fuelWidth > 0) {
        ctx.fillStyle = '#ff4655';
        ctx.beginPath();
        ctx.moveTo(gaugeX + fuelWidth, gaugeY);
        ctx.lineTo(gaugeX + fuelWidth + 8, gaugeY + gaugeHeight / 2);
        ctx.lineTo(gaugeX + fuelWidth, gaugeY + gaugeHeight);
        ctx.fill();
      }

      // Percentage text
      ctx.fillStyle = '#ece8e1';
      ctx.font = 'bold 14px "Arial Black", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(rocketFuel * 100)}%`, gaugeX + gaugeWidth + 35, gaugeY + gaugeHeight + 2);

      // Status indicator - top left
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';

      if (gameState === 'recording') {
        const pulse = Math.sin(Date.now() / 300) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 70, 85, ${0.6 + pulse * 0.4})`;
        ctx.fillRect(25, 25, 3, 15);
        ctx.fillStyle = '#ff4655';
        ctx.fillText('RECORDING', 35, 36);
      } else if (gameState === 'analyzing') {
        ctx.fillStyle = '#53a0d8';
        ctx.fillRect(25, 25, 3, 15);
        ctx.fillStyle = '#53a0d8';
        ctx.fillText('ANALYZING', 35, 36);
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
      {/* Valorant-style corner accents */}
      <div style={styles.cornerTL}></div>
      <div style={styles.cornerTR}></div>
      <div style={styles.cornerBL}></div>
      <div style={styles.cornerBR}></div>

      {/* Header with tactical styling */}
      <div style={styles.header}>
        <div style={styles.headerAccent}></div>
        <h1 style={styles.title}>// VOICE TRAINING MODULE</h1>
        <p style={styles.subtitle}>SMOOTH AIRFLOW PROTOCOL</p>
      </div>

      {/* Main game area */}
      <div style={styles.gameContainer}>
        <canvas ref={canvasRef} width={900} height={600} style={styles.canvas} />

        {/* Live status overlay - Valorant style */}
        {(isRecording || gameState === 'analyzing') && (
          <div style={styles.liveOverlay}>
            <div style={styles.liveBox}>
              <div style={styles.liveHeader}>
                <div style={styles.liveAccent}></div>
                <span style={styles.pulse}>▐</span>
                <span style={styles.liveStatus}>
                  {gameState === 'recording' ? 'RECORDING' : 'ANALYZING'}
                </span>
              </div>
              <p style={styles.liveText}>{liveText}</p>

              {/* Live transcript display */}
              {liveTranscript && gameState === 'recording' && (
                <div style={styles.liveTranscriptBox}>
                  <div style={styles.liveTranscriptLabel}>// LIVE INPUT</div>
                  <div style={styles.liveTranscriptText}>
                    {liveTranscript || '...'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instruction panel */}
      <div style={styles.promptBox}>
        <div style={styles.promptAccent}></div>
        <p style={styles.prompt}>// SMOOTH SPEECH TRAINING</p>
        <p style={styles.promptOptions}>
          Practice smooth, continuous speech. Try saying:<br/>
          <span style={styles.promptExample}>"Hello everyone"</span> •
          <span style={styles.promptExample}>"Good morning"</span> •
          <span style={styles.promptExample}>"My name is..."</span><br/>
          <span style={styles.promptTip}>Focus on steady airflow and gentle onset</span>
        </p>
      </div>

      {/* Action button */}
      {gameState === 'ready' && (
        <>
          <button
            onClick={handleStart}
            style={{
              ...styles.button,
              backgroundColor: buttonHovered ? '#ff4655' : '#fd4556',
              transform: buttonHovered ? 'translateX(4px)' : 'translateX(0)',
            }}
            onMouseEnter={() => setButtonHovered(true)}
            onMouseLeave={() => setButtonHovered(false)}
          >
            <div style={styles.buttonAccent}></div>
            <span style={styles.buttonText}>INITIATE TRAINING</span>
          </button>

          {/* Debug: Test Backend Button */}
          <button
            onClick={testBackend}
            style={{
              ...styles.button,
              marginTop: '0.5rem',
              opacity: 0.7,
              backgroundColor: '#53a0d8',
            }}
          >
            <div style={styles.buttonAccent}></div>
            <span style={styles.buttonText}>TEST BACKEND CONNECTION</span>
          </button>
        </>
      )}

      {/* Results panel - Valorant style */}
      {gameState === 'result' && (
        <div style={styles.resultContainer}>
          {/* Feedback section */}
          <div style={styles.feedbackBox}>
            <div style={styles.feedbackAccent}></div>
            <div style={styles.feedbackHeader}>
              <span style={styles.feedbackIcon}>▶</span>
              <span>ANALYSIS COMPLETE</span>
            </div>
            <p style={styles.feedback}>{feedback.toUpperCase()}</p>
          </div>

          {/* Transcript */}
          {transcript && (
            <div style={styles.transcriptBox}>
              <div style={styles.transcriptAccent}></div>
              <p style={styles.transcriptLabel}>// VOICE INPUT DETECTED</p>
              <p style={styles.transcript}>"{transcript}"</p>
            </div>
          )}

          {/* Stats grid - tactical style */}
          {features && (
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statAccent}></div>
                <div style={styles.statHeader}>CONTINUITY</div>
                <div style={styles.statValue}>{(features.continuity * 100).toFixed(0)}</div>
                <div style={styles.statBar}>
                  <div style={{...styles.statBarFill, width: `${features.continuity * 100}%`}}></div>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statAccent}></div>
                <div style={styles.statHeader}>ONSET</div>
                <div style={styles.statValue}>{(features.onset_smoothness * 100).toFixed(0)}</div>
                <div style={styles.statBar}>
                  <div style={{...styles.statBarFill, width: `${features.onset_smoothness * 100}%`}}></div>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statAccent}></div>
                <div style={styles.statHeader}>STABILITY</div>
                <div style={styles.statValue}>{(features.airflow_stability * 100).toFixed(0)}</div>
                <div style={styles.statBar}>
                  <div style={{...styles.statBarFill, width: `${features.airflow_stability * 100}%`}}></div>
                </div>
              </div>
            </div>
          )}

          {/* Next round button */}
          <button
            onClick={handleNextRound}
            style={{
              ...styles.button,
              backgroundColor: buttonHovered ? '#ff4655' : '#fd4556',
              transform: buttonHovered ? 'translateX(4px)' : 'translateX(0)',
            }}
            onMouseEnter={() => setButtonHovered(true)}
            onMouseLeave={() => setButtonHovered(false)}
          >
            <div style={styles.buttonAccent}></div>
            <span style={styles.buttonText}>CONTINUE TRAINING</span>
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
    background: '#0f1923',
    fontFamily: '"Tungsten", "Druk Wide", "Industry", "Arial Black", sans-serif',
    position: 'relative',
    overflow: 'hidden',
  },
  // Corner accents - Valorant style
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '60px',
    height: '60px',
    borderTop: '3px solid #ff4655',
    borderLeft: '3px solid #ff4655',
    zIndex: 10,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '60px',
    height: '60px',
    borderTop: '3px solid #ff4655',
    borderRight: '3px solid #ff4655',
    zIndex: 10,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '60px',
    height: '60px',
    borderBottom: '3px solid #ff4655',
    borderLeft: '3px solid #ff4655',
    zIndex: 10,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '60px',
    height: '60px',
    borderBottom: '3px solid #ff4655',
    borderRight: '3px solid #ff4655',
    zIndex: 10,
  },
  header: {
    textAlign: 'left',
    marginBottom: '2rem',
    width: '100%',
    maxWidth: '900px',
    position: 'relative',
  },
  headerAccent: {
    position: 'absolute',
    left: -20,
    top: 0,
    width: '4px',
    height: '100%',
    background: '#ff4655',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#ece8e1',
    marginBottom: '0.25rem',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    fontFamily: '"Tungsten", "Arial Black", sans-serif',
  },
  subtitle: {
    color: '#ff4655',
    fontSize: '0.9rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    fontFamily: 'monospace',
  },
  gameContainer: {
    position: 'relative',
    marginBottom: '1.5rem',
  },
  canvas: {
    border: '2px solid #1c252e',
    background: '#000',
    clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))',
  },
  // Live overlay - Valorant tactical style
  liveOverlay: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 10,
  },
  liveBox: {
    background: 'rgba(15, 25, 35, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '1rem 1.5rem',
    border: '2px solid #ff4655',
    clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)',
    minWidth: '280px',
  },
  liveHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  liveAccent: {
    width: '3px',
    height: '18px',
    background: '#ff4655',
  },
  liveStatus: {
    color: '#ff4655',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    letterSpacing: '2px',
    fontFamily: 'monospace',
  },
  pulse: {
    animation: 'pulse 1s ease-in-out infinite',
    fontSize: '1rem',
    color: '#ff4655',
    display: 'inline-block',
  },
  liveText: {
    color: '#ece8e1',
    fontSize: '0.9rem',
    margin: 0,
    fontWeight: '400',
    fontFamily: 'monospace',
  },
  // Live transcript box
  liveTranscriptBox: {
    marginTop: '1rem',
    padding: '0.75rem',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(83, 160, 216, 0.3)',
    borderLeft: '2px solid #53a0d8',
  },
  liveTranscriptLabel: {
    color: '#53a0d8',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    letterSpacing: '1px',
    marginBottom: '0.5rem',
    fontFamily: 'monospace',
  },
  liveTranscriptText: {
    color: '#ece8e1',
    fontSize: '1rem',
    fontWeight: '400',
    lineHeight: '1.4',
    minHeight: '1.5rem',
    fontFamily: 'monospace',
  },
  // Instruction panel
  promptBox: {
    background: 'rgba(28, 37, 46, 0.6)',
    padding: '1rem 2rem',
    marginBottom: '1.5rem',
    border: '1px solid #2a3a47',
    borderLeft: '3px solid #ff4655',
    maxWidth: '900px',
    width: '100%',
    position: 'relative',
  },
  promptAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '3px',
    height: '100%',
    background: '#ff4655',
  },
  prompt: {
    fontSize: '0.95rem',
    color: '#ece8e1',
    textAlign: 'left',
    margin: 0,
    marginBottom: '0.75rem',
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: '0.5px',
  },
  promptOptions: {
    fontSize: '0.85rem',
    color: '#ece8e1',
    textAlign: 'left',
    margin: 0,
    lineHeight: '1.6',
    fontFamily: 'sans-serif',
  },
  promptExample: {
    color: '#53a0d8',
    fontWeight: '600',
    padding: '0 0.5rem',
    fontFamily: 'monospace',
  },
  promptTip: {
    color: '#7a8a99',
    fontSize: '0.75rem',
    fontStyle: 'italic',
    display: 'block',
    marginTop: '0.5rem',
  },
  // Button - Valorant style
  button: {
    padding: '1rem 2.5rem',
    fontSize: '1.1rem',
    fontWeight: '700',
    background: '#fd4556',
    border: 'none',
    color: '#0f1923',
    cursor: 'pointer',
    marginTop: '1rem',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    position: 'relative',
    clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
  },
  buttonAccent: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '12px',
    height: '12px',
    background: '#ff1744',
    clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
  },
  buttonText: {
    fontFamily: '"Arial Black", sans-serif',
  },
  // Results
  resultContainer: {
    width: '100%',
    maxWidth: '900px',
    marginTop: '1.5rem',
    animation: 'slideIn 0.3s ease-out',
  },
  feedbackBox: {
    background: 'rgba(28, 37, 46, 0.8)',
    padding: '1.5rem 2rem',
    marginBottom: '1.5rem',
    border: '2px solid #ff4655',
    position: 'relative',
    clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))',
  },
  feedbackAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '4px',
    height: '100%',
    background: '#ff4655',
  },
  feedbackHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#ff4655',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    letterSpacing: '2px',
    marginBottom: '0.75rem',
    fontFamily: 'monospace',
  },
  feedbackIcon: {
    fontSize: '0.7rem',
  },
  feedback: {
    fontSize: '1.5rem',
    color: '#ece8e1',
    fontWeight: '700',
    margin: 0,
    letterSpacing: '1px',
  },
  // Transcript
  transcriptBox: {
    background: 'rgba(28, 37, 46, 0.6)',
    padding: '1.25rem 1.5rem',
    marginBottom: '1.5rem',
    border: '1px solid #2a3a47',
    borderLeft: '3px solid #53a0d8',
    position: 'relative',
  },
  transcriptAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '3px',
    height: '100%',
    background: '#53a0d8',
  },
  transcriptLabel: {
    color: '#53a0d8',
    fontSize: '0.75rem',
    marginBottom: '0.5rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontFamily: 'monospace',
  },
  transcript: {
    color: '#ece8e1',
    fontSize: '1.1rem',
    margin: 0,
    fontWeight: '400',
  },
  // Stats grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    background: 'rgba(28, 37, 46, 0.8)',
    padding: '1.25rem 1rem',
    border: '1px solid #2a3a47',
    position: 'relative',
    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
  },
  statAccent: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '10px',
    height: '10px',
    background: '#ff4655',
    clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
  },
  statHeader: {
    color: '#7a8a99',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '0.5rem',
    fontFamily: 'monospace',
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#ece8e1',
    marginBottom: '0.5rem',
    fontFamily: '"Arial Black", sans-serif',
  },
  statBar: {
    width: '100%',
    height: '4px',
    background: '#1c252e',
    position: 'relative',
  },
  statBarFill: {
    height: '100%',
    background: '#ff4655',
    transition: 'width 0.5s ease',
  },
};

export default RocketFlight;
