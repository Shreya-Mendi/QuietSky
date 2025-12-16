import React, { useEffect, useRef } from 'react';

const MicWaveform = ({ audioLevel, isRecording }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = 'rgba(10, 14, 39, 0.3)';
    ctx.fillRect(0, 0, width, height);

    if (isRecording) {
      // Draw waveform bars
      const barCount = 32;
      const barWidth = width / barCount;
      const maxBarHeight = height * 0.8;

      for (let i = 0; i < barCount; i++) {
        // Create wave effect
        const wave = Math.sin((i / barCount) * Math.PI * 2 + Date.now() / 200) * 0.3 + 0.7;
        const barHeight = audioLevel * maxBarHeight * wave;

        const x = i * barWidth;
        const y = (height - barHeight) / 2;

        // Gradient from cyan to pink
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, '#00d9ff');
        gradient.addColorStop(0.5, '#a855f7');
        gradient.addColorStop(1, '#ec4899');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      }

      // Pulsing circle in center
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = 20 + audioLevel * 30;

      const circleGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      circleGradient.addColorStop(0, 'rgba(0, 217, 255, 0.8)');
      circleGradient.addColorStop(1, 'rgba(0, 217, 255, 0)');

      ctx.fillStyle = circleGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Show idle state
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(width / 2 - 30, height / 2 - 2, 60, 4);
    }
  }, [audioLevel, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={100}
      style={{
        width: '100%',
        maxWidth: '400px',
        height: '100px',
        borderRadius: '12px',
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(100, 116, 139, 0.3)',
      }}
    />
  );
};

export default MicWaveform;
