
import os

from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("ERROR: GEMINI_API_KEY was not found in .env")
else:
    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=(
                "Reply with exactly: "
                "VerityBrand AI Gemini connection successful."
            ),
        )

        print("SUCCESS: Connected to the Gemini API.")
        print("AI response:", response.text)

    except Exception as error:
        print("Connection failed.")
        print("Error type:", type(error).__name__)
        print("Error details:", str(error)[:500])
