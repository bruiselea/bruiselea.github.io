import google.generativeai as genai
import os

# Try to get API key from env or ask user to set it
api_key = os.environ.get("GOOGLE_API_KEY")

if not api_key:
    print("Please set GOOGLE_API_KEY environment variable or edit this script.")
else:
    genai.configure(api_key=api_key)
    try:
        print("Listing available models...")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(m.name)
    except Exception as e:
        print(f"Error: {e}")
