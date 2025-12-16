import whisper
import torch

class ASREngine:
    """
    ASR Engine using OpenAI Whisper.
    Supports multiple model sizes: tiny, base, small, medium, large.
    """

    def __init__(self, model_name="base"):
        """
        Initialize Whisper model.

        Args:
            model_name: One of 'tiny', 'base', 'small', 'medium', 'large'
                       'tiny' is fastest but less accurate
                       'base' is good balance for real-time use
                       'small' is more accurate, slightly slower
        """
        print(f"Loading Whisper model: {model_name}...")
        self.model = whisper.load_model(model_name)
        self.model_name = model_name
        print(f"Whisper model '{model_name}' loaded successfully!")

    def transcribe(self, audio_path, language="en"):
        """
        Transcribe audio file to text with word timestamps.

        Args:
            audio_path: Path to audio file
            language: Language code (default: 'en' for English)

        Returns:
            dict with:
                - transcript: Full transcription text
                - word_timestamps: List of (word, start_time, end_time) tuples
                - segments: Detailed segment information
        """
        # Transcribe with word-level timestamps
        result = self.model.transcribe(
            audio_path,
            language=language,
            word_timestamps=True,
            verbose=False
        )

        transcript = result["text"].strip()

        # Extract word timestamps
        word_timestamps = []
        for segment in result.get("segments", []):
            for word_info in segment.get("words", []):
                word = word_info.get("word", "").strip()
                start = word_info.get("start", 0)
                end = word_info.get("end", 0)
                word_timestamps.append({
                    "word": word,
                    "start": start,
                    "end": end
                })

        return {
            "transcript": transcript,
            "word_timestamps": word_timestamps,
            "segments": result.get("segments", []),
            "language": result.get("language", language)
        }

    def transcribe_simple(self, audio_path):
        """
        Simple transcription without timestamps (faster).

        Returns:
            str: Transcribed text
        """
        result = self.model.transcribe(audio_path, verbose=False)
        return result["text"].strip()


# Global ASR instance (lazy loading)
_asr_instance = None

def get_asr_engine(model_name="base"):
    """Get or create global ASR engine instance."""
    global _asr_instance
    if _asr_instance is None:
        _asr_instance = ASREngine(model_name)
    return _asr_instance
