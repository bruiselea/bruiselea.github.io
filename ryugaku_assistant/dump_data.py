import pandas as pd
import json

DATA_PATH = '留学アンケート_ダミーデータ.xlsx'

try:
    df = pd.read_excel(DATA_PATH, header=None)
    attributes = df.iloc[:, 0].fillna('Unknown').astype(str).tolist()
    students = []
    for col_idx in range(1, df.shape[1]):
        student_data = {}
        student_id = df.iloc[0, col_idx]
        if pd.notna(student_id):
            student_data['ID'] = student_id
        for row_idx in range(1, df.shape[0]):
            attr = attributes[row_idx]
            val = df.iloc[row_idx, col_idx]
            if attr == 'nan' or attr == 'Unknown': continue
            if pd.isna(val): val = None
            student_data[attr] = val
        if student_data.get('氏名（仮名）') or student_data.get('ID'): 
             students.append(student_data)
    
    print(json.dumps(students, ensure_ascii=False, indent=2))

except Exception as e:
    print(f"Error: {e}")
