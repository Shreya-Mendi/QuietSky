# AI Usage in QuietSky

## Overview
This document details exactly where, how, and why artificial intelligence is used in QuietSky. We believe in transparency about AI usage, especially in applications designed for therapeutic purposes.

---

## AI Components

### 1. OpenAI Whisper (Speech Recognition)

**Location in codebase:**
- `backend/asr.py` - Main ASR engine wrapper
- `backend/app.py` lines 22-24, 47-48 - ASR initialization and usage

**What it does:**
- Converts spoken audio (sound waves) into text transcriptions
- Provides word-level timestamps for each spoken word
- Detects language automatically

**How it works:**
- Whisper is a neural network trained on 680,000 hours of multilingual speech data
- Uses an encoder-decoder transformer architecture
- Processes audio in 30-second chunks
- Outputs text transcriptions with confidence scores

**Privacy & Security:**
- ✅ Runs **100% locally** on your computer
- ✅ **No cloud connection** required after initial model download
- ✅ **No data sent to OpenAI** or any external server
- ✅ Audio files are **deleted immediately** after transcription
- ✅ No user data is stored or logged

**Model Details:**
- **Default model:** `base` (~140 MB)
- **Parameters:** 74 million
- **Accuracy:** Good for most use cases
- **Speed:** ~1-2 seconds per transcription on modern CPU
- **Alternative models:**
  - `tiny` (39M parameters, ~75MB) - Faster, less accurate
  - `small` (244M parameters, ~460MB) - More accurate, slower
  - `medium` (769M parameters, ~1.5GB) - Very accurate, slow
  - `large` (1550M parameters, ~2.9GB) - Most accurate, very slow

**Can be replaced:** Yes! The ASR interface in `backend/asr.py` is designed to be swappable. You could use:
- VOSK (smaller, faster, offline)
- Mozilla DeepSpeech (privacy-focused)
- Google Speech API (cloud-based, not recommended for privacy)
- Any other ASR system

**Why we use it:**
- High accuracy for natural speech
- Handles accents, dialects, and speech variations well
- Provides word-level timestamps (critical for rhythm analysis)
- Completely private and offline
- Free and open-source

---

## Non-AI Components (Often Confused with AI)

### Speech Analysis Heuristics

**Location in codebase:**
- `backend/heuristics.py` - All speech analysis functions
- `backend/utils.py` - Audio signal processing utilities

**What it does:**
- Measures speech features like rhythm, continuity, smoothness
- Analyzes audio waveforms using mathematical algorithms
- Generates game events based on speech characteristics

**How it works:**
```python
# Example: Measuring continuity
rms = compute_rms_energy(audio)  # Root Mean Square energy over time
rms_std = np.std(rms)            # Standard deviation
rms_mean = np.mean(rms)          # Mean energy
cv = rms_std / rms_mean          # Coefficient of variation
continuity = 1.0 / (1.0 + cv * 2)  # Normalize to 0-1 score
```

This is **NOT AI** - it's traditional signal processing using:
- Fast Fourier Transforms (FFT)
- Root Mean Square (RMS) calculations
- Standard deviation and statistical measures
- Onset detection algorithms
- Audio envelope analysis

**Why we don't use AI here:**
- Signal processing is more transparent and explainable
- No training data needed
- Consistent and predictable results
- Faster processing
- No bias from training data

### Features Measured:

1. **Continuity** (Rocket Flight, Treasure Talk)
   - Measures how steady/consistent the audio is
   - Uses coefficient of variation in RMS energy
   - Higher continuity = smoother, more sustained sound

2. **Onset Smoothness** (Rocket Flight, Monster Echo)
   - Measures how gently speech starts
   - Analyzes RMS buildup in first 200ms
   - Gradual increase = smooth onset

3. **Amplitude Stability** (Rocket Flight)
   - Measures inverse of amplitude jitter
   - Uses second-order differences in RMS
   - Stable amplitude = less variation

4. **Rhythm Regularity** (Echo Bird)
   - Detects syllable onset times
   - Measures consistency of timing intervals
   - Regular rhythm = predictable spacing

5. **Pause Detection** (Monster Echo, Treasure Talk)
   - Identifies silence segments in audio
   - Measures duration and frequency
   - Used for controlled repetition detection

6. **Speech Rate** (Treasure Talk)
   - Calculates words per minute
   - Simple division: (word_count / duration) * 60
   - Normal speech: 80-180 WPM

**Important:** None of these features judge "correctness" or detect "errors." They only measure observable characteristics of the audio signal.

---

## What AI is NOT Used For

❌ **Judging speech quality** - No AI determines if speech is "good" or "bad"

❌ **Detecting stuttering** - The system doesn't label or identify disfluencies

❌ **Generating feedback** - All feedback messages are pre-written by humans

❌ **Adapting difficulty** - Uses simple threshold-based logic

❌ **User profiling** - No AI learns about individual users

❌ **Predicting outcomes** - No predictive models

❌ **Emotional analysis** - Doesn't detect emotions or sentiment

---

## Data Flow Diagram

```
1. User speaks into microphone
   ↓
2. Browser records audio (Web Audio API)
   ↓
3. Silence detected (RMS-based algorithm)
   ↓
4. Audio blob sent to backend server
   ↓
5. Backend saves to temporary file
   ↓
6. [AI] Whisper transcribes audio → text
   ↓
7. [Non-AI] librosa analyzes audio features
   ↓
8. [Non-AI] Heuristics calculate scores
   ↓
9. [Non-AI] Pre-written feedback selected
   ↓
10. Results sent back to frontend
    ↓
11. Game visualizations updated
    ↓
12. Temporary audio file DELETED
```

**Data retention:** ZERO - No audio or transcripts are stored

---

## Ethical Considerations

### Why We Use AI Transparently

1. **User Autonomy:** Users should know when AI is analyzing their speech
2. **Trust:** Transparency builds trust in therapeutic applications
3. **Privacy:** Users should know their data stays local
4. **Informed Consent:** Users can choose to use the app knowing how it works

### Design Principles

1. **Never Punitive:** AI/algorithms never penalize or judge
2. **Encouraging Only:** All feedback is positive and supportive
3. **Privacy-First:** All processing is local, no cloud
4. **Explainable:** Users can understand how scores are calculated
5. **No Bias Amplification:** Simple heuristics avoid training data bias

### Potential Limitations

1. **Whisper Accuracy:**
   - May struggle with very quiet speech
   - Accents/dialects may affect accuracy
   - Background noise can interfere
   - Not perfect - ~90-95% word accuracy typical

2. **Heuristic Limitations:**
   - Measures objective features, not therapeutic value
   - Cannot detect nuanced speech patterns
   - Thresholds are somewhat arbitrary
   - Not a replacement for professional assessment

3. **Not a Diagnostic Tool:**
   - This is a game, not medical software
   - Cannot diagnose speech disorders
   - Cannot replace speech therapy
   - Should not be used for clinical decisions

---

## Replacing or Modifying AI Components

### Using a Different ASR Model

Edit `backend/asr.py`:

```python
# Option 1: Use VOSK instead of Whisper
from vosk import Model, KaldiRecognizer
import json

class ASREngine:
    def __init__(self, model_path="model"):
        self.model = Model(model_path)

    def transcribe(self, audio_path):
        # VOSK transcription logic
        # ... implementation ...
        return {"transcript": text, "word_timestamps": []}
```

### Adjusting Heuristics

Edit `backend/heuristics.py`:

```python
# Example: Make continuity measurement more forgiving
def compute_continuity(audio, sr=16000):
    # ... existing code ...

    # More forgiving normalization
    continuity = 1.0 / (1.0 + cv * 1.5)  # Was 2.0, now 1.5

    return float(continuity)
```

### Disabling AI Entirely

You can replace Whisper with a mock transcriber for testing:

```python
# backend/asr.py
class ASREngine:
    def transcribe(self, audio_path):
        return {
            "transcript": "[Mock transcription]",
            "word_timestamps": [],
            "segments": []
        }
```

The game will still work with speech analysis, just without real transcriptions.

---

## Performance & Resource Usage

### CPU Usage
- **Whisper (base):** ~30-60% CPU during transcription (1-2 seconds)
- **Idle:** <5% CPU
- **Audio analysis:** <10% CPU

### Memory Usage
- **Whisper model loaded:** ~300-500 MB RAM
- **Frontend:** ~50-100 MB RAM
- **Peak during transcription:** ~600 MB RAM

### Disk Usage
- **Whisper base model:** 140 MB
- **Dependencies:** ~500 MB
- **Total:** ~650 MB

### Network Usage
- **Initial setup:** ~200 MB (model download)
- **During gameplay:** 0 MB (completely offline)

---

## Future AI Considerations

### Potential Enhancements (Not Implemented)

1. **Personalized Feedback:**
   - Could use ML to learn what encouragement works best
   - Would require ethical review and consent
   - Not implemented for privacy reasons

2. **Progress Tracking:**
   - Could use AI to identify improvement patterns
   - Would require data storage
   - Not implemented to maintain privacy

3. **Adaptive Difficulty:**
   - Could use RL to optimize difficulty curves
   - Complex to implement ethically
   - Currently uses simple thresholds

### Why We Keep It Simple

- **Privacy First:** Complex AI often requires data collection
- **Transparency:** Simple systems are easier to explain
- **Reliability:** Fewer AI components = fewer failure points
- **Accessibility:** Lightweight = runs on more devices
- **Trust:** Users can understand how it works

---

## Questions & Answers

**Q: Does my voice data go to the cloud?**
A: No. Everything runs locally. Your audio never leaves your computer.

**Q: Can I use this offline?**
A: Yes, after the initial Whisper model download, the game works completely offline.

**Q: Is my speech data stored anywhere?**
A: No. Audio files are deleted immediately after transcription. Nothing is saved.

**Q: How accurate is Whisper?**
A: Typically 90-95% word accuracy for clear speech. May vary with accents, background noise, etc.

**Q: Can the game detect if I'm stuttering?**
A: No, and it's designed not to. It only measures general audio features, never labels disfluencies.

**Q: Could OpenAI see my data?**
A: No. Whisper runs locally on your machine. OpenAI has no access to your audio or usage.

**Q: Is this a replacement for speech therapy?**
A: No. This is a supportive game for practice. Always consult a licensed speech-language pathologist for therapy.

**Q: Can I trust the feedback?**
A: The feedback is encouraging and game-themed, not clinical. It's designed to support practice, not provide therapeutic assessment.

---

## Conclusion

QuietSky uses AI (Whisper) **only** for speech-to-text conversion. All analysis and feedback uses traditional algorithms. Everything runs locally, ensuring complete privacy. The design prioritizes transparency, user autonomy, and ethical use of AI in a therapeutic context.

For technical questions about AI implementation, see the code comments in:
- `backend/asr.py` - ASR engine
- `backend/heuristics.py` - Speech analysis
- `backend/utils.py` - Audio processing utilities
