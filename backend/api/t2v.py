import os
from google.cloud import texttospeech


# Set up authentication
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.environ.get("GOOGLE_CREDS_PATH")


def synthesize_text(text):
    """Synthesizes speech from the input string of text."""

    client = texttospeech.TextToSpeechClient()

    input_text = texttospeech.SynthesisInput(text=text)
    print("Reached API Call")

    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name="en-US-Journey-O",
        ssml_gender=texttospeech.SsmlVoiceGender.FEMALE,
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    response = client.synthesize_speech(
        request={"input": input_text, "voice": voice, "audio_config": audio_config}
    )

    # print(response.audio_content)  # Debugging

    if not response.audio_content:
        print("Error: No audio content received!")
        return

    return response.audio_content


if __name__ == "__main__":
    synthesize_text()
