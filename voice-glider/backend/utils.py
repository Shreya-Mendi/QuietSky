import numpy as np
import librosa
import soundfile as sf

def load_audio(file_path, sr=16000):
    """Load audio file and return waveform and sample rate."""
    audio, sample_rate = librosa.load(file_path, sr=sr)
    return audio, sample_rate

def compute_rms_energy(audio, frame_length=2048, hop_length=512):
    """Compute RMS energy over time for silence detection."""
    rms = librosa.feature.rms(y=audio, frame_length=frame_length, hop_length=hop_length)[0]
    return rms

def detect_silence_segments(audio, sr=16000, threshold=0.02, min_silence_duration=0.5):
    """
    Detect silence segments in audio.
    Returns list of (start_time, end_time) tuples for silence segments.
    """
    rms = compute_rms_energy(audio)
    hop_length = 512
    times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop_length)

    is_silence = rms < threshold
    silence_segments = []

    in_silence = False
    silence_start = 0

    for i, silent in enumerate(is_silence):
        if silent and not in_silence:
            silence_start = times[i]
            in_silence = True
        elif not silent and in_silence:
            silence_end = times[i]
            if silence_end - silence_start >= min_silence_duration:
                silence_segments.append((silence_start, silence_end))
            in_silence = False

    return silence_segments

def compute_onset_smoothness(audio, sr=16000):
    """
    Measure how smoothly the audio starts (gentle onset).
    Returns a score between 0 and 1, where 1 is very smooth.
    """
    if len(audio) < sr * 0.1:  # Less than 100ms
        return 0.5

    # Look at first 200ms
    onset_window = int(sr * 0.2)
    onset_audio = audio[:onset_window]

    # Compute RMS buildup
    rms = compute_rms_energy(onset_audio, frame_length=512, hop_length=128)

    if len(rms) < 2:
        return 0.5

    # Measure gradient - smooth onset has gradual increase
    gradient = np.diff(rms)
    max_gradient = np.max(np.abs(gradient)) if len(gradient) > 0 else 0

    # Normalize: lower max gradient = smoother onset
    smoothness = 1.0 / (1.0 + max_gradient * 10)

    return float(smoothness)

def compute_continuity(audio, sr=16000):
    """
    Measure speech continuity (how steady/continuous the audio is).
    Returns a score between 0 and 1, where 1 is very continuous.
    """
    rms = compute_rms_energy(audio)

    if len(rms) < 2:
        return 0.5

    # Measure variance in RMS - lower variance = more continuous
    rms_std = np.std(rms)
    rms_mean = np.mean(rms)

    if rms_mean < 0.01:  # Very quiet
        return 0.3

    # Coefficient of variation
    cv = rms_std / (rms_mean + 1e-6)

    # Normalize: lower CV = more continuous
    continuity = 1.0 / (1.0 + cv * 2)

    return float(continuity)

def compute_amplitude_stability(audio, sr=16000):
    """
    Measure amplitude stability (inverse of jitter).
    Returns a score between 0 and 1, where 1 is very stable.
    """
    rms = compute_rms_energy(audio, frame_length=1024, hop_length=256)

    if len(rms) < 3:
        return 0.5

    # Measure second-order differences (acceleration of amplitude changes)
    first_diff = np.diff(rms)
    second_diff = np.diff(first_diff)

    jitter = np.std(second_diff)

    # Normalize
    stability = 1.0 / (1.0 + jitter * 50)

    return float(stability)
