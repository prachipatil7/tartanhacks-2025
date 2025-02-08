import os
from google.cloud import texttospeech


# Set up authentication
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/AnuranjanAnand/Downloads/google_credentials.json"

def synthesize_text(text):
    """Synthesizes speech from the input string of text."""
    # print(text)
    # text = "Hello there girlypop"
    client = texttospeech.TextToSpeechClient()

    input_text = texttospeech.SynthesisInput(text=text)
    print("Reached API Call")

    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name="en-US-Journey-O",
        ssml_gender=texttospeech.SsmlVoiceGender.FEMALE,
    )

    audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)

    response = client.synthesize_speech(
        request={"input": input_text, "voice": voice, "audio_config": audio_config}
    )

    # print(response.audio_content)  # Debugging

    if not response.audio_content:
        print("Error: No audio content received!")
        return

    # Save output
    output_path = "/Users/AnuranjanAnand/tartanhacks-2025/files/output.mp3"
    with open(output_path, "wb") as out:
        out.write(response.audio_content)
        print(f'Audio content written to file: {output_path}')
   
    return response.audio_content

if __name__ == "__main__":
    synthesize_text()