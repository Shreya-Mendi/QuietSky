from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import os
import tempfile
from pathlib import Path

from asr import get_asr_engine
from heuristics import (
    analyze_rocket_flight,
    analyze_monster_echo,
    analyze_echo_bird,
    analyze_treasure_talk
)
from utils import load_audio

app = FastAPI(title="QuietSky Speech Game API")

# CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ASR engine on startup
asr_engine = None

@app.on_event("startup")
async def startup_event():
    """Initialize ASR engine when server starts."""
    global asr_engine
    # Using 'base' model - good balance of speed and accuracy
    # Options: 'tiny' (fastest), 'base', 'small' (more accurate)
    asr_engine = get_asr_engine("base")
    print("QuietSky backend ready! 🚀")

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "QuietSky Speech Game API",
        "status": "running",
        "version": "1.0.0"
    }

@app.post("/analyze")
async def analyze_speech(
    file: UploadFile = File(...),
    mode: str = Form(...)
):
    """
    Analyze speech audio for a specific game mode.

    Args:
        file: Audio file (wav, mp3, ogg, etc.)
        mode: Game mode ('rocket', 'monster', 'bird', 'treasure')

    Returns:
        JSON with transcript, features, feedback, and game events
    """
    # Save uploaded file to temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
        contents = await file.read()
        tmp_file.write(contents)
        tmp_path = tmp_file.name

    try:
        # Transcribe audio using Whisper
        asr_result = asr_engine.transcribe(tmp_path)
        transcript = asr_result["transcript"]
        word_timestamps = asr_result["word_timestamps"]

        # Load audio for analysis
        audio, sr = load_audio(tmp_path)

        # Analyze based on mode
        if mode == "rocket":
            features, feedback, game_events = analyze_rocket_flight(audio, sr, transcript)
        elif mode == "monster":
            features, feedback, game_events = analyze_monster_echo(audio, sr, transcript)
        elif mode == "bird":
            features, feedback, game_events = analyze_echo_bird(audio, sr, transcript)
        elif mode == "treasure":
            features, feedback, game_events = analyze_treasure_talk(audio, sr, transcript)
        else:
            return {
                "error": f"Unknown mode: {mode}",
                "valid_modes": ["rocket", "monster", "bird", "treasure"]
            }

        # Return results
        return {
            "transcript": transcript,
            "word_timestamps": word_timestamps,
            "features": features,
            "feedback": feedback,
            "gameEvents": game_events,
            "mode": mode
        }

    finally:
        # Clean up temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.post("/test-audio")
async def test_audio(file: UploadFile = File(...)):
    """
    Simple endpoint to test audio upload and transcription.
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
        contents = await file.read()
        tmp_file.write(contents)
        tmp_path = tmp_file.name

    try:
        # Just transcribe
        transcript = asr_engine.transcribe_simple(tmp_path)

        return {
            "transcript": transcript,
            "file_size": len(contents),
            "status": "success"
        }

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
