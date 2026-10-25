
import os

from dotenv import load_dotenv
from openai import OpenAI

# Load the API key from the project's .env file.
load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")

if not api_key or api_key == "paste_your_actual_key_here" or api_key == "your_api_key_here":
    print("ERROR: OpenAI API key is missing. Check your .env file.")
else:
    try:
        client = OpenAI(api_key=api_key)

        response = client.responses.create(
            model="gpt-4.1-mini",
            input="Reply with exactly: VerityBrand AI connection successful."
        )

        print("SUCCESS: Connected to the OpenAI API.")
        print("AI response:", response.output_text)

    except Exception as error:
        print("Connection failed.")
        print("Error type:", type(error).__name__)
        print("Check your API key, API access, and billing settings.")
