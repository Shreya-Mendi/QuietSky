# QuietSky 🚀

**A calming, encouragement-focused speech adventure game designed to help practice fluent, confident speech through fun gameplay.**

![QuietSky](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.8+-green)
![React](https://img.shields.io/badge/react-18.2+-61dafb)
![License](https://img.shields.io/badge/license-Educational-orange)

---

## 🎮 What is QuietSky?

QuietSky is a multi-mode web game that uses **speech as the primary input**. It helps players practice smooth, paced, confident speech inside fun, modern gameplay loops. The game is **non-therapeutic in wording**—there is no failure, no "try again," and no negative feedback.

Perfect for:
- Speech practice in a fun, pressure-free environment
- Building confidence with vocal expression
- Rhythm and pacing exercises
- Gentle onset practice
- Conversational speech in a supportive context

**Important:** This is a supportive game for practice, not a replacement for professional speech therapy.

---

## 🎯 Game Modes

### 🚀 Rocket Flight (Smooth Airflow Mode)
Power your futuristic rocket with smooth, steady vocal sounds. Practice gentle onsets and calm pacing while stabilizing your engine. No sudden bursts fail you—just visual flutter to show the variation.

**Focuses on:** Continuity, gentle onsets, airflow stability

---

### 👾 Monster Echo (Controlled Repetition Mode)
Face a friendly, stylized Rakshasa in a mystical battle. Repeat words with smooth onsets and calm pacing to deal combo damage. Controlled repetition triggers critical hits, and calm pauses unlock "Mantra Strikes."

**Focuses on:** Controlled repetition, onset softness, pause timing

---

### 🎵 Echo Bird (Rhythm & Pacing Mode)
Guide a cyber-bird through neon skies with your speech rhythm. Short sounds create small flaps, long smooth sounds create glides, and rhythmic patterns maintain balance in this Flappy-Bird-style game.

**Focuses on:** Rhythm matching, vowel duration, syllable timing

---

### 🗺️ Treasure Talk (Conversation Mode)
Journey through serene, Journey-inspired desert landscapes while speaking freely. Receive open-ended prompts like "Describe this scene" and speak naturally. The landscape responds to your voice with gentle, encouraging animations.

**Focuses on:** Natural pacing, pause comfort, expressive continuity

---

## ✨ Key Features

### Emotionally Safe Design
- ✅ **Never cuts off during pauses or stutters** - waits for true silence (2.5+ seconds)
- ✅ **No failure states** - only encouraging, game-themed feedback
- ✅ **No correctness judgment** - celebrates effort and participation
- ✅ **Gentle progression** - adapts to comfort level
- ✅ **Privacy-first** - all processing happens locally

### Interactive Visuals
- Beautiful, animated game environments
- Real-time audio visualization
- Responsive feedback animations
- Calming color palettes and smooth transitions

### AI-Powered (But Private!)
- **OpenAI Whisper** for speech recognition (runs 100% locally)
- Advanced audio analysis using signal processing
- No data sent to cloud
- No user tracking or data storage

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Microphone

### Installation

1. **Clone or download** this repository

2. **Install backend dependencies:**
```bash
cd voice-glider/backend
pip install -r requirements.txt
```

3. **Install frontend dependencies:**
```bash
cd voice-glider/frontend
npm install
```

### Running the Game

**Option 1: Use the start script (Linux/Mac)**
```bash
cd voice-glider
./start.sh
```

**Option 2: Manual start (2 terminals)**

Terminal 1 (Backend):
```bash
cd voice-glider/backend
python app.py
```

Terminal 2 (Frontend):
```bash
cd voice-glider/frontend
npm run dev
```

### Play!

Open your browser and go to: **http://localhost:3000**

Grant microphone permissions when prompted, choose a game mode, and start playing!

---

## 📖 Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup instructions, troubleshooting, and configuration
- **[AI_USAGE.md](AI_USAGE.md)** - Complete transparency about where and how AI is used
- **[README.md (main repo)](../README.md)** - Original design document and game specifications

---

## 🔬 How It Works

### Speech Recording
1. Click button to start recording
2. Browser captures audio using Web Audio API
3. Audio level continuously monitored
4. Stops automatically after 2.5 seconds of silence
5. **Never interrupts during pauses or disfluencies**

### AI Processing
1. Audio sent to local backend server
2. **Whisper AI** transcribes speech to text (locally!)
3. Audio analysis measures rhythm, continuity, smoothness
4. Game events generated based on measurements
5. Encouraging feedback selected

### Game Response
1. Animations triggered based on speech features
2. Visual feedback shows results
3. Progress tracked within game session
4. Ready for next round!

**All processing is local. Your voice never leaves your computer.**

---

## 🎨 Technical Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Fast build tool
- **Canvas API** - Game animations
- **Web Audio API** - Audio capture and visualization
- **Axios** - HTTP client

### Backend
- **FastAPI** - Modern Python web framework
- **OpenAI Whisper** - Speech recognition AI
- **librosa** - Audio analysis
- **NumPy** - Numerical computing
- **Uvicorn** - ASGI server

---

## 🔒 Privacy & Security

- ✅ **100% local processing** - no cloud services
- ✅ **No data storage** - audio deleted after analysis
- ✅ **No tracking** - no analytics or user profiling
- ✅ **No external API calls** - works completely offline after setup
- ✅ **Open source** - inspect the code yourself

See [AI_USAGE.md](AI_USAGE.md) for complete details.

---

## 🎓 Educational Context

QuietSky is designed based on evidence-based speech therapy principles:

1. **Gentle Onset Practice** - Starting sounds smoothly reduces tension
2. **Controlled Repetition** - Reframes repetition as skill, not error
3. **Rhythm Training** - Paced speech can improve fluency
4. **Low-Pressure Practice** - Anxiety reduction supports better speech
5. **Positive Reinforcement** - Encouragement builds confidence

**This is not medical software.** Always consult a licensed speech-language pathologist for professional therapy.

---

## 🛠️ Customization

### Change Whisper Model Size
Edit `backend/asr.py` line 12:
```python
asr_engine = get_asr_engine("base")  # Options: tiny, base, small
```

### Adjust Silence Detection
Edit `frontend/src/hooks/useRecorder.js` lines 11-12:
```javascript
const SILENCE_THRESHOLD = 0.02;  // Lower = more sensitive
const SILENCE_DURATION = 2500;   // Milliseconds of silence
```

### Modify Feedback Messages
Edit `backend/heuristics.py` - search for feedback strings in each game mode function.

See [SETUP.md](SETUP.md) for more configuration options.

---

## 🐛 Troubleshooting

**Microphone not working?**
- Grant permissions in browser
- Check system microphone settings
- Try Chrome or Firefox

**Backend won't start?**
- Install dependencies: `pip install -r requirements.txt`
- Check Python version: `python --version` (need 3.8+)

**Can't connect to backend?**
- Ensure backend is running on port 8000
- Check firewall settings
- Verify CORS is enabled (already configured)

**Game is slow?**
- First transcription loads model (takes longer)
- Try smaller Whisper model (edit `backend/asr.py`)
- Ensure no other heavy processes running

See [SETUP.md](SETUP.md) for detailed troubleshooting.

---

## 🤝 Contributing

This is an educational project. Feel free to:
- Report bugs or issues
- Suggest new game modes
- Improve documentation
- Enhance visuals
- Add language support

---

## 📜 License

Educational use. Created to support speech practice in a fun, accessible way.

**Not for commercial use without proper therapeutic review and oversight.**

---

## 🙏 Acknowledgments

- **OpenAI Whisper** - Speech recognition model
- **librosa** - Audio analysis library
- **Journey (thatgamecompany)** - Visual inspiration for Treasure Talk
- **Flappy Bird** - Gameplay inspiration for Echo Bird
- Evidence-based speech therapy research

---

## 📞 Support

For setup help, see [SETUP.md](SETUP.md)

For AI transparency, see [AI_USAGE.md](AI_USAGE.md)

For game design details, see [README.md (main repo)](../README.md)

---

## 🌟 Design Philosophy

> "This game never judges your speech. It only celebrates your effort."

QuietSky is built on the principle that speech practice should be:
- **Fun** - Engaging gameplay, not boring drills
- **Safe** - No judgment, no pressure
- **Private** - Your voice stays on your device
- **Encouraging** - Only positive feedback
- **Accessible** - Free, open, local

---

**Ready to start your journey? Choose a game mode and let your voice guide you! 🎮✨**
