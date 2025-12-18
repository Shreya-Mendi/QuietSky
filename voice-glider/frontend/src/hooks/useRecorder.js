import { useState, useRef, useCallback, useEffect } from 'react';

export const useRecorder = (onSilenceDetected) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Silence detection parameters - LOWERED for sensitivity
  const SILENCE_THRESHOLD = 0.01; // Even quieter detection (was 0.02)
  const SILENCE_DURATION = 2500; // 2.5 seconds of silence

  const analyzeAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    // Calculate RMS (Root Mean Square) for volume level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / bufferLength);

    // Amplify the audio level for better visual feedback (especially for quiet voices)
    const amplified = Math.min(1.0, rms * 3); // 3x amplification
    setAudioLevel(amplified);

    // Silence detection
    if (isRecording) {
      if (rms < SILENCE_THRESHOLD) {
        // Start silence timer if not already started
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            // Silence detected for long enough
            if (onSilenceDetected) {
              onSilenceDetected();
            }
          }, SILENCE_DURATION);
        }
      } else {
        // Sound detected, reset silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      }
    }

    // Continue analyzing
    animationFrameRef.current = requestAnimationFrame(analyzeAudioLevel);
  }, [isRecording, onSilenceDetected]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up Web Audio API for volume analysis
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 2048;

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start analyzing audio level
      analyzeAudioLevel();

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, [analyzeAudioLevel]);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
          chunksRef.current = [];
          resolve(blob);
        };

        mediaRecorderRef.current.stop();

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        // Clean up audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }

        // Clear timers and animations
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        setIsRecording(false);
        setAudioLevel(0);
      } else {
        resolve(null);
      }
    });
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    isRecording,
    audioLevel,
    startRecording,
    stopRecording,
  };
};
