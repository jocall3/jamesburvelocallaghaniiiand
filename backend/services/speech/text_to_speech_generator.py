```python
from google.cloud import texttospeech

class TextToSpeechGenerator:
    """
    Service using Cloud Text-to-Speech API to generate audio summaries of financial reports.
    """

    def __init__(self):
        self.client = texttospeech.TextToSpeechClient()

    def generate_audio_summary(self, text, output_path="output.mp3"):
        """
        Generates an audio summary from the given text and saves it to a file.

        Args:
            text (str): The text to convert to speech.
            output_path (str): The path to save the generated audio file. Defaults to "output.mp3".

        Returns:
            str: The path to the generated audio file.

        Raises:
            Exception: If there's an error during audio generation.
        """
        try:
            # Configure the synthesis input
            synthesis_input = texttospeech.SynthesisInput(text=text)

            # Build the voice request
            voice = texttospeech.VoiceSelectionParams(
                language_code="en-US", ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
            )

            # Select the type of audio file you want returned
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3
            )

            # Perform the text-to-speech request on the text input with the selected
            # voice parameters and audio file type
            response = self.client.synthesize_speech(
                input=synthesis_input, voice=voice, audio_config=audio_config
            )

            # The response's audio_content is binary.
            with open(output_path, "wb") as out:
                # Write the response to the output file.
                out.write(response.audio_content)
                print(f'Audio content written to file "{output_path}"')

            return output_path

        except Exception as e:
            print(f"Error generating audio summary: {e}")
            raise
```