import os
import json
import time
import pandas as pd
import google.generativeai as genai
from data_loader import load_data

# Configuration
DATA_PATH = '留学アンケート_ダミーデータ.xlsx'
OUTPUT_PATH = 'processed_students.json'

# Define Tag Configuration here
TAG_CONFIG = [
    {"id": "language_focus", "label": "語学ガチ度", "description": "語学力向上への熱量 (1:低い - 5:高い)", "weight": 1.0},
    {"id": "stem_score", "label": "文系⇔理系", "description": "専門分野 (1:文系 - 5:理系)", "weight": 1.0},
    {"id": "english_score", "label": "英語環境", "description": "英語の使用頻度 (1:非英語圏 - 5:英語圏)", "weight": 1.0},
    {"id": "social_focus", "label": "交流・遊び", "description": "現地での交流や遊びの充実度 (1:少ない - 5:多い)", "weight": 1.0},
    {"id": "cost_performance", "label": "コスパ", "description": "費用対効果・満足度 (1:悪い - 5:良い)", "weight": 1.0},
    {"id": "safety_rating", "label": "治安", "description": "現地の治安・安全性 (1:危険 - 5:安全)", "weight": 1.0}
]

def analyze_student_heuristic(student):
    """
    Analyzes a student's data using local heuristics (Rule-based).
    """
    scores = {
        "language_focus": 3,
        "stem_score": 1, # Default to Humanities (1)
        "english_score": 1, # Default to Non-English (1)
        "social_focus": 3,
        "cost_performance": 3,
        "safety_rating": 3,
        "one_line_summary": ""
    }
    
    # 1. Language Focus
    # Keywords: 語学, IELTS, TOEFL, 英語
    text_blob = str(student.get('〔留学前〕大学を選んだ理由', '')) + str(student.get('後輩へのアドバイス', ''))
    if '語学' in text_blob or '英語' in text_blob:
        scores['language_focus'] += 1
    if 'IELTS' in str(student.get('語学試験名', '')) or 'TOEFL' in str(student.get('語学試験名', '')):
        scores['language_focus'] += 1
    
    # 2. STEM Score (理系度)
    # 1: Humanities, 5: STEM
    affiliation = str(student.get('所属・学年', '')) + str(student.get('所属（英語）/専攻', ''))
    stem_keywords = ['工学', '理学', '医学', '薬学', '情報', '農学', 'Engineering', 'Science', 'Chemistry', 'Biology', 'Physics', 'Math', 'Computer']
    humanities_keywords = ['文', '法', '経済', '教育', '社会', 'Arts', 'Law', 'Economics', 'Education', 'Sociology']
    
    is_stem = any(k in affiliation for k in stem_keywords)
    is_humanities = any(k in affiliation for k in humanities_keywords)
    
    if is_stem:
        scores['stem_score'] = 5
    elif is_humanities:
        scores['stem_score'] = 1
    else:
        scores['stem_score'] = 3 # Neutral/Unknown

    # 3. English Environment (英語環境)
    # 1: Non-English, 5: English
    country = str(student.get('国・地域', ''))
    language = str(student.get('指導言語', ''))
    
    english_countries = ['アメリカ', 'イギリス', 'カナダ', 'オーストラリア', 'ニュージーランド', 'アイルランド', 'USA', 'UK', 'Canada', 'Australia']
    
    if any(c in country for c in english_countries):
        scores['english_score'] = 5
    elif '英語' in language and '/' not in language: # English only
        scores['english_score'] = 4
    elif '英語' in language: # Mixed
        scores['english_score'] = 3
    else:
        scores['english_score'] = 1

    # 4. Social Focus
    # Keywords: 交流, 友人, 旅行, サークル
    activities = str(student.get('活動内容', ''))
    if '交流' in activities or 'サークル' in activities or '旅行' in activities:
        scores['social_focus'] += 1
    if '毎日' in str(student.get('課外活動の参加頻度', '')):
        scores['social_focus'] += 1

    # 5. Cost Performance
    # Based on monthly cost
    try:
        cost = int(student.get('生活費（月額）-合計', 150000))
        if cost < 100000: scores['cost_performance'] = 5
        elif cost < 150000: scores['cost_performance'] = 4
        elif cost < 200000: scores['cost_performance'] = 3
        elif cost < 300000: scores['cost_performance'] = 2
        else: scores['cost_performance'] = 1
    except:
        pass

    # 6. Safety Rating
    # Keywords in safety advice
    safety_text = str(student.get('治安状況（具体例）', ''))
    if '良い' in safety_text or '安全' in safety_text:
        scores['safety_rating'] += 1
    if '悪い' in safety_text or '危険' in safety_text or 'スリ' in safety_text:
        scores['safety_rating'] -= 1
        
    # Clamp scores 1-5
    for k in scores:
        if k == 'one_line_summary': continue
        scores[k] = max(1, min(5, scores[k]))

    # Summary
    scores['one_line_summary'] = f"{student.get('国・地域')}で{student.get('専攻', '専門')}を学ぶ"
    if scores['stem_score'] >= 4: scores['one_line_summary'] += " (理系)"
    elif scores['english_score'] >= 4: scores['one_line_summary'] += " (英語圏)"
    
    return scores

def extract_keyword_tags(student):
    """
    Extracts keyword tags from student text fields.
    Returns a list of tags (e.g., ["#ボランティア", "#旅行"]).
    """
    tags = set()
    
    # Define keywords mapping
    # Tag: [List of keywords to search for]
    keyword_map = {
        # Existing
        "#ボランティア": ["ボランティア", "volunteer", "奉仕"],
        "#旅行": ["旅行", "観光", "travel", "trip", "sightseeing"],
        "#インターン": ["インターン", "internship", "実習"],
        "#サークル": ["サークル", "club", "部活", "society"],
        "#寮": ["寮", "dorm", "residence"],
        "#ホームステイ": ["ホームステイ", "homestay", "host family"],
        "#奨学金": ["奨学金", "scholarship", "grant"],
        "#トラブル": ["トラブル", "困った", "盗難", "差別", "trouble"],
        "#就活": ["就活", "就職", "キャリア", "career", "job"],

        # Life
        "#自炊": ["自炊", "料理", "cooking", "grocery"],
        "#外食": ["外食", "レストラン", "restaurant", "dining"],
        "#シェアハウス": ["シェアハウス", "share house", "flat share"],
        "#物価": ["物価", "高い", "安い", "cost", "price"],
        "#買い物": ["買い物", "ショッピング", "shopping", "supermarket"],
        "#交通": ["交通", "バス", "電車", "地下鉄", "transport", "bus", "train", "subway", "metro"],
        "#自転車": ["自転車", "bike", "bicycle", "cycling"],

        # Study
        "#授業": ["授業", "講義", "class", "lecture", "course"],
        "#研究": ["研究", "ラボ", "research", "lab"],
        "#論文": ["論文", "paper", "thesis"],
        "#実験": ["実験", "experiment"],
        "#ゼミ": ["ゼミ", "seminar"],
        "#プレゼン": ["プレゼン", "発表", "presentation"],
        "#ディスカッション": ["ディスカッション", "議論", "discussion"],
        "#図書館": ["図書館", "library"],
        "#課題": ["課題", "assignment", "homework"],

        # Trouble / Health
        "#病気": ["病気", "風邪", "熱", "sick", "ill", "cold"],
        "#病院": ["病院", "クリニック", "hospital", "clinic", "doctor"],
        "#保険": ["保険", "insurance"],
        "#騒音": ["騒音", "うるさい", "noise", "noisy"],
        "#ホームシック": ["ホームシック", "homesick", "lonely", "寂しい"],

        # Activity
        "#ジム": ["ジム", "gym", "fitness", "sports"],
        "#パーティー": ["パーティー", "party"],
        "#イベント": ["イベント", "event", "festival"],
        "#友達": ["友達", "友人", "friend"],
        "#ルームメイト": ["ルームメイト", "roommate", "flatmate"],

        # Prep
        "#ビザ": ["ビザ", "visa", "permit"],
        "#航空券": ["航空券", "フライト", "flight", "ticket"],
        "#荷物": ["荷物", "パッキング", "luggage", "packing"],
        "#SIM": ["SIM", "sim card", "phone"],
        "#Wi-Fi": ["Wi-Fi", "wifi", "internet"],
    }
    
    # Combine all relevant text fields for searching
    text_blob = (
        str(student.get('〔留学前〕大学を選んだ理由', '')) + 
        str(student.get('研究概要・内容（要約）', '')) + 
        str(student.get('活動内容', '')) + 
        str(student.get('安全のために気を付けたこと', '')) + 
        str(student.get('治安状況（具体例）', '')) + 
        str(student.get('留学の成果・課題（要約）', '')) + 
        str(student.get('後輩へのアドバイス', '')) +
        str(student.get('住居形態', '')) +
        str(student.get('奨学金の有無', ''))
    ).lower()
    
    for tag, keywords in keyword_map.items():
        for k in keywords:
            if k.lower() in text_blob:
                tags.add(tag)
                
    # Add University Name as Tag
    uni_name = student.get('大学名（留学先機関）')
    if uni_name and isinstance(uni_name, str):
        tags.add(f"#{uni_name}")

    # Add Major as Tag
    major = student.get('所属（英語）/専攻')
    if major and isinstance(major, str):
        tags.add(f"#{major}")
                
    return sorted(list(tags))

def load_university_list(file_path):
    """
    Loads the partner university list from Excel.
    """
    try:
        df = pd.read_excel(file_path)
        
        # Clean column names (remove newlines, spaces)
        df.columns = [str(c).replace('\n', '').strip() for c in df.columns]
        
        universities = []
        for _, row in df.iterrows():
            # Extract relevant fields based on inspected column names
            # Note: Column names might vary slightly, so we use .get with defaults
            uni_data = {
                "name_jp": row.get('大学間協定校名', ''),
                "name_en": row.get('Partner Institution', ''),
                "country_jp": row.get('国・地域名', ''),
                "country_en": row.get('Country/Region', ''),
                "area": row.get('地域', ''),
                "quota": row.get('学生交流人数 /Quota of Students for Tuition waivers', '')
            }
            
            # Only add if we have at least a name
            if uni_data['name_jp'] or uni_data['name_en']:
                # Handle NaN
                for k, v in uni_data.items():
                    if pd.isna(v): uni_data[k] = None
                universities.append(uni_data)
                
        return universities
    except Exception as e:
        print(f"Error loading university list {file_path}: {e}")
        return []

def load_raw_data(file_path):
    """
    Loads raw student data from Excel or CSV.
    Assumes transposed format (Rows=Attributes, Cols=Students).
    """
    try:
        if file_path.endswith('.xlsx'):
            df = pd.read_excel(file_path, header=None)
        elif file_path.endswith('.csv'):
            df = pd.read_csv(file_path, header=None)
        else:
            print(f"Unsupported file format: {file_path}")
            return []

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
        return students
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return []

def process_data(api_key=None, input_paths=[DATA_PATH, '留学アンケート_ダミーデータ_20名のみ.csv'], uni_list_path='ダミー協定校一覧_実在大学版.xlsx', output_path=OUTPUT_PATH, progress_callback=None):
    """
    Processes the data from multiple files using local heuristics.
    Also loads the university master list.
    """
    # Load Data from all sources
    students = []
    for path in input_paths:
        if os.path.exists(path):
            print(f"Loading data from: {path}")
            students.extend(load_raw_data(path))
        else:
            print(f"File not found (skipping): {path}")

    if not students:
        raise RuntimeError("No student data found in provided paths.")
        
    # Load University List
    universities = []
    if os.path.exists(uni_list_path):
        print(f"Loading university list from: {uni_list_path}")
        universities = load_university_list(uni_list_path)
    else:
        print(f"University list not found: {uni_list_path}")

    total_students = len(students)
    processed_students = []
    
    for i, student in enumerate(students):
        msg = f"Processing {i+1}/{total_students}: {student.get('ID', 'Unknown')}"
        if progress_callback:
            progress_callback(i + 1, total_students, msg)
        else:
            print(msg)
        
        # Analyze using Heuristics
        scores = analyze_student_heuristic(student)
        
        # Extract Keyword Tags
        extra_tags = extract_keyword_tags(student)
        
        # Merge scores and tags into student data
        student.update(scores)
        student['extra_tags'] = extra_tags
        processed_students.append(student)
        
        # No sleep needed for local processing

    # Construct Final Output
    final_output = {
        "config": {
            "tags": TAG_CONFIG
        },
        "students": processed_students,
        "universities": universities
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, ensure_ascii=False, indent=2)
    
    return final_output

if __name__ == "__main__":
    # Check API Key
    api_key = os.environ.get("GOOGLE_API_KEY")
    process_data(api_key)
    print("Done!")
