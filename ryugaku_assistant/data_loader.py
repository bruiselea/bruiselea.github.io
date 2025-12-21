import pandas as pd
import os

import json

def load_data(file_path):
    """
    Loads the study abroad survey data.
    Prioritizes 'processed_students.json' if it exists in the same directory.
    Otherwise loads from the specified Excel file path.
    """
    # Check for processed JSON first
    json_path = os.path.join(os.path.dirname(file_path), 'processed_students.json')
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Check if it's the new format with 'config' and 'students'
                if isinstance(data, dict) and 'students' in data:
                    return data['students'], data.get('config', {})
                # Old format (list of students)
                elif isinstance(data, list):
                    return data, {}
        except Exception as e:
            print(f"Error loading JSON: {e}, falling back to Excel.")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
        
    # If we reach here and it's not a JSON file we can handle, return empty
    return [], {}

if __name__ == "__main__":
    # Test the loader
    path = '/Users/satounatsuki/bruiselea.github.io/ryugaku_assistant/留学アンケート_ダミーデータ.xlsx'
    data, config = load_data(path)
    print(f"Loaded {len(data)} students.")
    if len(data) > 0:
        print("Sample Student 1:", data[0])
