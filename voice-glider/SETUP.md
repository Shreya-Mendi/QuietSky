# QuietSky - Setup Instructions

## Overview
QuietSky is a speech therapy game that helps practice fluent, confident speech through fun, interactive gameplay. The game uses AI-powered speech recognition and analysis to provide encouraging feedback without any judgment or pressure.

---

## Prerequisites

### System Requirements
- **Python 3.8+** (for backend)
- **Node.js 16+** and **npm** (for frontend)
- **Microphone** access for speech input
- **~2GB free disk space** (for AI models)

### Operating Systems
- Linux (recommended)
- macOS
- Windows (with WSL recommended)

---

## Installation Steps

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd voice-glider/backend
```

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

This will install:
- **FastAPI** - Web framework for the API server
- **Uvicorn** - ASGI server
- **OpenAI Whisper** - AI speech recognition model
- **librosa** - Audio analysis library
- **NumPy** - Numerical computing

#### Download Whisper Model (First Time Only)
The first time you run the backend, Whisper will automatically download the AI model (~140MB for the 'base' model). This is a one-time download.

Model sizes available:
- `tiny` - Fastest, ~75MB (less accurate)
- `base` - Balanced, ~140MB (recommended)
- `small` - More accurate, ~460MB (slower)

You can change the model in `backend/asr.py` line 12.

---

### 2. Frontend Setup

Navigate to the frontend directory:
```bash
cd voice-glider/frontend
```

#### Install Node Dependencies
```bash
npm install
```

This will install:
- **React** - UI framework
- **Vite** - Fast build tool
- **Axios** - HTTP client for API calls

---

## Running the Application

You'll need **two terminal windows** - one for backend, one for frontend.

### Terminal 1: Start Backend Server

```bash
cd voice-glider/backend
python app.py
```

You should see:
```
Loading Whisper model: base...
Whisper model 'base' loaded successfully!
QuietSky backend ready! 🚀
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Backend will be running on:** `http://localhost:8000`

---

### Terminal 2: Start Frontend Development Server

```bash
cd voice-glider/frontend
npm run dev
```

You should see:
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:3000/
```

**Frontend will be running on:** `http://localhost:3000`

---

## Using the Application

1. **Open your browser** and go to: `http://localhost:3000`

2. **Grant microphone permissions** when prompted

3. **Choose a game mode:**
   - 🚀 **Rocket Flight** - Practice smooth vocal onsets
   - 👾 **Monster Echo** - Practice controlled repetition
   - 🎵 **Echo Bird** - Practice rhythm and pacing
   - 🗺️ **Treasure Talk** - Practice natural conversation

4. **Click the button to start recording**

5. **Speak when prompted**

6. **The game will automatically stop** after 2.5 seconds of silence (this is intentional - it won't cut you off during pauses or disfluencies!)

7. **Receive encouraging feedback** and see your results

8. **Continue playing** - no penalties, no pressure!

---

## How It Works

### Speech Recording
- Uses **Web Audio API** and **MediaRecorder** in the browser
- Continuously monitors audio levels using RMS (Root Mean Square) energy
- Detects silence by waiting for 2.5 seconds of low audio energy
- **Never cuts off during stutters or pauses** - only stops on true silence

### AI Speech Recognition (Whisper)
- Audio is sent to the backend server
- **OpenAI Whisper** transcribes speech to text
- Whisper runs **locally on your computer** (no cloud, private!)
- Provides word-level timestamps for rhythm analysis

### Speech Analysis Heuristics
- Analyzes audio features (NOT correctness):
  - **Continuity** - How steady the speech is
  - **Onset Smoothness** - How gently speech starts
  - **Rhythm** - Timing patterns
  - **Amplitude Stability** - Consistency of volume
- **Never penalizes disfluencies**
- Only used to trigger positive game events

### Game Feedback
- All feedback is **encouraging and game-themed**
- No "incorrect" or "try again" messages
- Celebrates effort and participation
- Adapts to player performance with gentle progression

---

## Troubleshooting

### Backend Issues

**"Module not found" error:**
```bash
pip install -r requirements.txt
```

**"Port 8000 already in use":**
```bash
# Kill the process using port 8000
lsof -ti:8000 | xargs kill -9

# Or change the port in backend/app.py line 106
```

**Whisper model download fails:**
- Check internet connection
- Try smaller model: change `"base"` to `"tiny"` in `backend/asr.py` line 12

### Frontend Issues

**"Cannot connect to backend":**
- Make sure backend is running on port 8000
- Check browser console for errors
- Verify CORS is enabled (already configured)

**Microphone not working:**
- Grant microphone permissions in browser
- Check system microphone settings
- Try a different browser (Chrome/Firefox recommended)
- Ensure microphone is not being used by another app

**Audio stops immediately:**
- The silence detection is working correctly!
- Speak louder or adjust threshold in `frontend/src/hooks/useRecorder.js` line 11

### General Issues

**Nothing happens when I speak:**
- Check that backend is running and responding at `http://localhost:8000`
- Check browser console (F12) for errors
- Verify microphone is connected and working

**Game is slow:**
- First transcription takes longer (model loading)
- Subsequent requests are faster
- Consider using `tiny` model for faster performance

---

## AI Usage in QuietSky

### Where AI is Used:

1. **Speech Recognition (Whisper)**
   - **Location:** `backend/asr.py`
   - **Model:** OpenAI Whisper (base model, ~140MB)
   - **Purpose:** Transcribe speech to text
   - **Privacy:** Runs 100% locally - no data sent to cloud
   - **Can be replaced:** Yes, you can use VOSK or other ASR engines

2. **Speech Analysis**
   - **Location:** `backend/heuristics.py`
   - **Technology:** Traditional signal processing (librosa)
   - **Not AI:** Uses mathematical algorithms, not neural networks
   - **Purpose:** Analyze rhythm, continuity, smoothness

### What AI is NOT Used For:

- ❌ Judging speech correctness
- ❌ Detecting or labeling "disfluencies"
- ❌ Generating feedback messages (pre-written by humans)
- ❌ Tracking or storing user data
- ❌ Cloud processing (everything is local)

### Privacy & Data

- **All processing happens locally** on your computer
- **No data is sent to external servers**
- **No user data is stored**
- Audio recordings are deleted immediately after analysis
- Whisper model downloads once and runs offline

---

## Advanced Configuration

### Changing Whisper Model Size

Edit `backend/asr.py` line 12:
```python
# Faster, less accurate
asr_engine = get_asr_engine("tiny")

# Balanced (default)
asr_engine = get_asr_engine("base")

# More accurate, slower
asr_engine = get_asr_engine("small")
```

### Adjusting Silence Detection

Edit `frontend/src/hooks/useRecorder.js`:
```javascript
// Line 11 - Silence threshold (lower = more sensitive)
const SILENCE_THRESHOLD = 0.02;

// Line 12 - Silence duration in milliseconds
const SILENCE_DURATION = 2500; // 2.5 seconds
```

### Changing Server Port

Backend port (edit `backend/app.py` line 106):
```python
uvicorn.run(app, host="0.0.0.0", port=8000)
```

Frontend port (edit `frontend/vite.config.js` line 6):
```javascript
server: {
  port: 3000,
  // ...
}
```

---

## Building for Production

### Build Frontend
```bash
cd voice-glider/frontend
npm run build
```

This creates optimized files in `frontend/dist/`

### Serve Production Build
```bash
npm run preview
```

---

## Credits

- **Speech Recognition:** OpenAI Whisper
- **Audio Processing:** librosa, Web Audio API
- **Visual Inspiration:** Journey (thatgamecompany), Flappy Bird, cyberpunk aesthetics
- **Design Philosophy:** Evidence-based speech therapy principles, non-judgmental feedback

---

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Verify both backend and frontend are running
3. Check browser console for errors
4. Review the README.md for game design details

---

## License

This is an educational speech therapy game. Use it freely to help practice speech in a fun, pressure-free environment!
