import pandas as pd

file_path = 'ダミー協定校一覧_実在大学版.xlsx'
try:
    df = pd.read_excel(file_path)
    print(df.head().to_markdown())
    print("\nColumns:", df.columns.tolist())
except Exception as e:
    print(f"Error reading {file_path}: {e}")
