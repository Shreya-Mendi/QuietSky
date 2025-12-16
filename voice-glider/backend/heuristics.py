import numpy as np
import librosa
from utils import (
    compute_continuity,
    compute_onset_smoothness,
    compute_amplitude_stability,
    compute_rms_energy
)

def analyze_rocket_flight(audio, sr=16000, transcript=""):
    """
    Analyze audio for Rocket Flight mode (Smooth Airflow).
    Focuses on: continuity, onset smoothness, amplitude stability.
    """
    continuity = compute_continuity(audio, sr)
    onset_smoothness = compute_onset_smoothness(audio, sr)
    stability = compute_amplitude_stability(audio, sr)

    # Compute average vowel duration (sustained sound)
    avg_vowel_duration = estimate_sustained_duration(audio, sr)

    features = {
        "continuity": round(continuity, 3),
        "onset_smoothness": round(onset_smoothness, 3),
        "airflow_stability": round(stability, 3),
        "avg_vowel_duration": round(avg_vowel_duration, 3)
    }

    # Generate encouraging feedback
    if continuity > 0.7 and onset_smoothness > 0.6:
        feedback = "Smooth start! Engines stable!"
    elif continuity > 0.5:
        feedback = "Good airflow! Thrusters engaged!"
    else:
        feedback = "Engines warming up! Keep going!"

    # Game events for rocket
    rocket_fuel = min(1.0, (continuity + stability) / 2)

    game_events = {
        "rocketFuel": round(rocket_fuel, 3),
        "stabilityBonus": stability > 0.7,
        "smoothOnset": onset_smoothness > 0.6
    }

    return features, feedback, game_events

def analyze_monster_echo(audio, sr=16000, transcript=""):
    """
    Analyze audio for Monster Echo mode (Controlled Repetition).
    Focuses on: repetition detection, onset softness, pause timing.
    """
    onset_smoothness = compute_onset_smoothness(audio, sr)
    continuity = compute_continuity(audio, sr)

    # Detect repetitions in transcript
    words = transcript.lower().split()
    repetition_count = count_word_repetitions(words)

    # Detect pauses in audio
    pause_count, avg_pause_duration = detect_pauses(audio, sr)

    features = {
        "repetition_count": repetition_count,
        "onset_smoothness": round(onset_smoothness, 3),
        "pause_count": pause_count,
        "avg_pause_duration": round(avg_pause_duration, 3)
    }

    # Generate feedback
    if repetition_count >= 2 and onset_smoothness > 0.6:
        feedback = "Perfect combo! Critical hit!"
    elif repetition_count >= 1:
        feedback = "Nice strike! The Rakshasa staggers!"
    else:
        feedback = "Good effort! Keep the rhythm!"

    # Game events
    combo_multiplier = min(3, repetition_count + 1)
    mantra_strike = avg_pause_duration > 0.3 and continuity > 0.6

    game_events = {
        "monsterDamage": combo_multiplier * 0.3,
        "comboMultiplier": combo_multiplier,
        "mantraStrike": mantra_strike,
        "criticalHit": repetition_count >= 2 and onset_smoothness > 0.7
    }

    return features, feedback, game_events

def analyze_echo_bird(audio, sr=16000, transcript=""):
    """
    Analyze audio for Echo Bird mode (Rhythm & Pacing).
    Focuses on: rhythm matching, vowel duration, syllable timing.
    """
    # Detect onset times (syllables)
    onset_times = detect_onset_times(audio, sr)

    # Measure rhythm regularity
    rhythm_score = compute_rhythm_regularity(onset_times)

    # Measure vowel duration for sustained sounds
    avg_vowel_duration = estimate_sustained_duration(audio, sr)

    # Syllable count estimate
    syllable_count = len(onset_times)

    features = {
        "rhythm_match": round(rhythm_score, 3),
        "avg_vowel_duration": round(avg_vowel_duration, 3),
        "syllable_count": syllable_count,
        "onset_count": len(onset_times)
    }

    # Generate feedback
    if rhythm_score > 0.7:
        feedback = "Perfect rhythm! Soaring high!"
    elif avg_vowel_duration > 0.3:
        feedback = "Smooth glide! Nice control!"
    else:
        feedback = "Keep flapping! You're doing great!"

    # Game events
    # Short sounds = small flaps, long sounds = glides
    if avg_vowel_duration > 0.4:
        bird_lift = 3  # Long glide
    elif avg_vowel_duration > 0.2:
        bird_lift = 2  # Medium
    else:
        bird_lift = 1  # Small flap

    game_events = {
        "birdLift": bird_lift,
        "rhythmBonus": rhythm_score > 0.7,
        "glideMode": avg_vowel_duration > 0.4,
        "flapCount": syllable_count
    }

    return features, feedback, game_events

def analyze_treasure_talk(audio, sr=16000, transcript=""):
    """
    Analyze audio for Treasure Talk mode (Conversation).
    Focuses on: pacing, pause comfort, expressive continuity.
    """
    # Estimate speech rate
    duration = len(audio) / sr
    word_count = len(transcript.split()) if transcript else 0
    words_per_minute = (word_count / duration * 60) if duration > 0 else 0

    # Measure pauses
    pause_count, avg_pause_duration = detect_pauses(audio, sr)

    # Continuity
    continuity = compute_continuity(audio, sr)

    features = {
        "words_per_minute": round(words_per_minute, 1),
        "pause_count": pause_count,
        "pause_comfort": round(avg_pause_duration, 3),
        "expressive_continuity": round(continuity, 3)
    }

    # Generate feedback
    if continuity > 0.6:
        feedback = "The path brightens as you speak..."
    elif word_count > 5:
        feedback = "Your words guide the way forward..."
    else:
        feedback = "The landscape responds to your voice..."

    # Game events
    game_events = {
        "pathOpened": continuity > 0.5,
        "sceneProgression": min(1.0, word_count / 10),
        "naturalPacing": 80 <= words_per_minute <= 180,
        "expressiveness": round(continuity, 3)
    }

    return features, feedback, game_events

# Helper functions

def count_word_repetitions(words):
    """Count how many words are repeated consecutively or within a window."""
    if len(words) < 2:
        return 0

    repetitions = 0
    seen_recent = set()

    for i, word in enumerate(words):
        # Check within a 3-word window
        window_start = max(0, i - 3)
        recent_words = words[window_start:i]

        if word in recent_words:
            repetitions += 1

    return repetitions

def detect_pauses(audio, sr=16000, threshold=0.02, min_pause=0.2):
    """Detect pauses in audio and return count and average duration."""
    rms = compute_rms_energy(audio)
    hop_length = 512
    times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop_length)

    is_silence = rms < threshold
    pauses = []

    in_pause = False
    pause_start = 0

    for i, silent in enumerate(is_silence):
        if silent and not in_pause:
            pause_start = times[i]
            in_pause = True
        elif not silent and in_pause:
            pause_end = times[i]
            pause_duration = pause_end - pause_start
            if pause_duration >= min_pause:
                pauses.append(pause_duration)
            in_pause = False

    avg_pause = np.mean(pauses) if pauses else 0
    return len(pauses), float(avg_pause)

def estimate_sustained_duration(audio, sr=16000):
    """Estimate average duration of sustained sounds (vowels)."""
    rms = compute_rms_energy(audio, frame_length=1024, hop_length=256)
    hop_length = 256
    frame_duration = hop_length / sr

    # Find regions above threshold
    threshold = np.mean(rms) * 0.5
    voiced = rms > threshold

    durations = []
    current_duration = 0

    for is_voiced in voiced:
        if is_voiced:
            current_duration += frame_duration
        else:
            if current_duration > 0.05:  # At least 50ms
                durations.append(current_duration)
            current_duration = 0

    if current_duration > 0.05:
        durations.append(current_duration)

    avg_duration = np.mean(durations) if durations else 0
    return float(avg_duration)

def detect_onset_times(audio, sr=16000):
    """Detect onset times (syllable boundaries) in audio."""
    onset_env = librosa.onset.onset_strength(y=audio, sr=sr)
    onset_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)
    onset_times = librosa.frames_to_time(onset_frames, sr=sr)
    return onset_times.tolist()

def compute_rhythm_regularity(onset_times):
    """Compute how regular the rhythm is (0-1 score)."""
    if len(onset_times) < 3:
        return 0.5

    # Compute inter-onset intervals
    intervals = np.diff(onset_times)

    if len(intervals) < 2:
        return 0.5

    # Measure coefficient of variation
    std = np.std(intervals)
    mean = np.mean(intervals)

    if mean < 0.01:
        return 0.5

    cv = std / mean

    # Lower CV = more regular rhythm
    regularity = 1.0 / (1.0 + cv * 2)

    return float(regularity)
