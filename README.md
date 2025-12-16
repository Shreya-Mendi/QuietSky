# QuietSky
QuietSky is a calming, encouragement-focused speech adventure game designed to help players practice fluent, confident speech through fun gameplay—not through clinical or corrective cues

The game contains four distinct modes, each modeled after genres the player enjoys (Flappy Bird, light exploration, light combat, and cockpit/FPS HUDs). Each mode supports a different aspect of fluent speech behavior, but the game never labels anything as “therapy” and never penalizes disfluencies. Instead, it rewards effort, rhythm, participation, and smoothness in a fun, non-judgmental world.

Players interact using natural speech. The system listens to the entire spoken attempt (never cutting off during pauses or stutters), runs the audio through a local or server ASR model, evaluates gentle features like rhythm and continuity, and returns friendly, game-themed feedback.

The four core modes are:

1. 🚀 Rocket Flight (Smooth Airflow Mode)

A futuristic jet cockpit interface where the player powers the engine using a smooth, steady vocal sound. Soft starts (“gentle onset”), steady airflow, and calm pacing stabilize the engine. Sudden bursts don’t fail the attempt; they just show small visual flutter. This builds ease and comfort initiating speech.

2. 👾 Monster Echo (Controlled Repetition Mode)

The player faces a stylized, friendly Rakshasa who challenges them with spoken or displayed short words/phrases. The player repeats these intentionally, using smooth onsets and calm pacing. Controlled repetition creates combo hits, steady speech triggers critical strikes, and calm pauses unlock a “Mantra Strike.” This reframes repetition as ability—not failure.

3. 🎵 Echo Bird (Rhythm & Pacing Mode, Flappy-Bird Style)

A side-scrolling neon sky where a cyber-bird glides between obstacles. The player's speech rhythm controls flaps and glides: short sounds = small flaps, long smooth sounds = long glides, rhythmic patterns keep balance. This lightly trains pacing, breath timing, and prosody in a fun, skill-based manner.

4. 🗺️ Treasure Talk (Conversation Mode)

A serene exploration environment inspired by minimal Indian landscapes (banyan trees, hill silhouettes, small markets—but no deities or myth-heavy content). The player receives open-ended prompts like “Describe this scene” or “What might happen next?” They speak freely; the game listens fully, waits for silence (3–5 seconds), then responds with soft, encouraging game-world reactions (“The path brightens as you speak”). This mode supports expressive, natural, low-pressure speech.

Across all modes, the system never judges correctness. It only measures approachable features such as continuity, rhythm, and effort. The game supports both structured prompts (for practice) and open-ended prompts (for generalization). It also includes a gentle difficulty progression system to keep everything fun and manageable.

It is a multi-mode web game that uses speech as the primary input. The game helps players practice smooth, paced, confident speech inside fun, modern gameplay loops. The game is non-therapeutic in wording—there is no failure, no “try again,” and no negative feedback. The system listens until true silence (never cutting players off) and responds with encouraging, game-appropriate animations.

The project consists of:

Frontend: React (Vite) web app

Backend: FastAPI (Python) server

ASR Engine: Whisper-tiny/small or VOSK (local-first recommended)

Audio Processing: ffmpeg, Web Audio API, MediaRecorder

Modes: Rocket Flight, Monster Echo, Echo Bird, Treasure Talk

Core Features: silence detection, ASR transcription, simple heuristics (continuity, rhythm, repetition), adaptive feedback

Project Structure
voice-glider/
├── backend/
│   ├── app.py                # FastAPI server
│   ├── asr.py                # ASR wrapper (Whisper or VOSK)
│   ├── heuristics.py         # speech analysis (smoothness, rhythm, repetition)
│   ├── utils.py              # silence detection thresholds, audio utils
│   ├── requirements.txt
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js            # axios wrapper to backend
│   │   ├── hooks/useRecorder.js
│   │   ├── components/
│   │   │   ├── RocketFlight.jsx
│   │   │   ├── MonsterEcho.jsx
│   │   │   ├── EchoBird.jsx
│   │   │   ├── TreasureTalk.jsx
│   │   │   └── MicWaveform.jsx
│   └── package.json
└── README.md

Frontend Requirements
UI Framework

React + Vite

CSS or Tailwind for layout

Audio Capture

Use MediaRecorder and Web Audio API

Capture audio as .wav or .ogg

Use an RMS-based silence detector:

Silence Detection Logic
- Start recording when user taps a "Record" button or when a prompt appears.
- Every 100ms, compute RMS energy from mic.
- Detect silence if RMS < threshold for >= 2.5–3 seconds.
- Only stop recording after silence, not on disfluencies.

API Calls

POST audio to backend:

POST /analyze
Content-Type: multipart/form-data
Form field: file (blob)
Payload: audio file + mode identifier

Mode Components

Each mode has:

A prompt area (text or animated cue)

A microphone visualization

A canvas or div with game animation

A results area (friendly feedback + stats if needed)

Scheduling:
Modes can operate in rounds—prompt → speak → backend analysis → update game state → next prompt.

Backend Requirements
FastAPI Endpoints

POST /analyze

Input: audio file + mode identifier

Output example:

{
  "transcript": "go up",
  "features": {
    "continuity": 0.82,
    "rhythm_match": 0.74,
    "repetition_count": 1,
    "avg_vowel_duration": 0.18
  },
  "feedback": "Smooth start! Stability increased.",
  "gameEvents": {
    "rocketFuel": 0.3,
    "monsterDamage": 0,
    "birdLift": 2,
    "pathOpened": true
  }
}

Audio Handling

Save uploaded file to /tmp

Convert (if needed) to wav using ffmpeg

Pass to ASR engine

ASR Engine (asr.py)

Implement abstraction with two interchangeable backends:

Whisper (default)

VOSK (fallback or low-resource option)

Returns:

transcript string

word timestamps

optional phoneme timestamps

Speech Heuristics (heuristics.py)

Different computed features depending on mode:

Rocket Flight

continuity = measure of voiced-frame consistency

onset_smoothness = measure of RMS build-up slope

airflow stability = inverse of amplitude jitter

Monster Echo

detect repeated tokens (same word within 1s)

onset softness

pause timing

Echo Bird

rhythm_match = compare timestamps of spoken syllables vs target beat grid

vowel_duration = sustained vowel measurement for long flaps

Treasure Talk

pace = syllables/min

pause_comfort = average inter-phrase silence

expressive continuity = smoothness score, not correctness

Heuristics should never penalize disfluency. They simply produce values used to trigger game animations.

Mode Implementations
1. Rocket Flight (Smooth Airflow)

Gameplay Loop:

Display prompt: “Hold a smooth steady sound”

Start microphone

Stop after silence

Backend returns continuity score

Increase rocket fuel proportionally

Display feedback: “Engines stable!”

Frontend Requirements:

Cockpit HUD

Smooth gauge animation

No penalties

2. Monster Echo (Controlled Repetition)

Gameplay Loop:

Show text prompt: a word or phrase

User repeats it

ASR detects number + quality of repetitions

Controlled repetition → combo damage

Calm pause → “Mantra Strike”

Display friendly Rakshasa animations

Frontend Requirements:

Cute stylized enemy

Hit animations based on backend events

No correctness judgment

3. Echo Bird (Flappy-Style Pacing)

Gameplay Loop:

Show target rhythm or phrase

Player speaks with rhythmic sounds

Backend returns rhythm match + vowel length

Short sound → small flap

Long smooth sound → long glide

Balanced rhythm → stable level

Obstacles shift based on game event values

Frontend Requirements:

Canvas-based Flappy-style movement

Neon cyber-bird

Gentle difficulty curve

4. Treasure Talk (Open Conversation)

Gameplay Loop:

Display an image or scene

Prompt user with open-ended question

Record full response (until silence)

Backend measures pacing + continuity

Trigger game events (“Path opens”)

Provide calm, encouraging visual feedback

Frontend Requirements:

Beautiful traversal environment

Smooth transitions triggered by speech events

No accuracy scoring

Adaptive Difficulty System

Backend returns a simple metric (0–1) for stability or rhythm.
Frontend uses thresholds to adjust:

next prompt length

next scene difficulty (Echo Bird speed, Monster Echo word length)

assistive cues (visual pulse, longer silence timeout)

Always keep difficulty low until the player demonstrates comfort.

Non-Negotiable UX Rules

Never stop recording because of a stutter or long pause. Always wait for silence.

Never display: “I didn’t understand.”

Never judge speech as “correct/incorrect.”

Always reward effort with positive, game-themed feedback.

Keep animations gentle, supportive, and encouraging.

These rules ensure the game is emotionally safe.