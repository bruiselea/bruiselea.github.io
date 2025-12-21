import streamlit as st
import os
from data_loader import load_data
from agent_logic import search_students, generate_response, configure_genai, calculate_match_score

# Page Config
st.set_page_config(page_title="Study Abroad Assistant", page_icon="✈️")

# Title
st.title("✈️ 留学アシスタント")
st.caption("あなたの希望に合わせて、最適な先輩の体験談をマッチングします。")

# Sidebar for Settings
with st.sidebar:
    st.header("設定")
    
    # Mode Switcher
    mode = st.radio("検索モード", ["マッチ度診断", "タグ検索"], index=0)
    st.markdown("---")
    
    api_key_input = st.text_input("Google Gemini API Key", type="password")
    
    if api_key_input:
        st.session_state["api_key"] = api_key_input
        configure_genai(api_key_input)
        os.environ["GOOGLE_API_KEY"] = api_key_input
        st.success("API Keyが設定されました！")
    
    st.markdown("---")
    st.markdown("### データ情報")
    
    # Load Data (Expects processed JSON)
    DATA_PATH = 'processed_students.json'
    
    tag_config = []
    students = []
    
    if os.path.exists(DATA_PATH):
        students, config = load_data(DATA_PATH)
        tag_config = config.get('tags', [])
        st.success(f"{len(students)}件の体験談をロードしました。")
        
        if st.button("データを再生成する"):
            if "api_key" not in st.session_state:
                st.error("APIキーを設定してください。")
            else:
                st.error("この機能は現在無効化されています。`preprocess_tags.py`スクリプトを直接実行してデータを再生成してください。")

    else:
        st.error("データファイル (processed_students.json) が見つかりません。")
        st.info("※ 開発者の方へ: `preprocess_tags.py` を実行してデータを生成してください。")


# Main Content based on Mode
ranked_students = []

if mode == "マッチ度診断":
    st.header("どんな留学にしたい？")
    st.caption("スライダーを動かして、あなたの希望に近い先輩を探します。")

    preferences = {}
    if tag_config:
        # Dynamic Sliders from Config
        cols = st.columns(2)
        for i, tag in enumerate(tag_config):
            col = cols[i % 2]
            with col:
                val = st.slider(
                    f"{tag['label']} ({tag.get('description', '')})", 
                    1, 5, 3, 
                    key=tag['id']
                )
                preferences[tag['id']] = val
    else:
        st.info("設定ファイルが読み込まれていません。")

    # Calculate Match
    if students and preferences:
        ranked_students = calculate_match_score(students, preferences, tag_config)

elif mode == "タグ検索":
    st.header("条件で絞り込む")
    st.caption("国や特徴を選んで、先輩の体験談を検索します。")
    
    # Extract unique values
    countries = sorted(list(set([s.get('国・地域') for s in students if s.get('国・地域')])))
    types = sorted(list(set([s.get('留学タイプ') for s in students if s.get('留学タイプ')])))
    
    # Extract Faculties (First part of '所属・学年')
    # e.g. "文学部 英文学科" -> "文学部"
    faculties = set()
    for s in students:
        affiliation = s.get('所属・学年', '')
        if affiliation:
            # Split by space and take the first part
            parts = affiliation.split()
            if parts:
                faculties.add(parts[0])
    sorted_faculties = sorted(list(faculties))
    
    # Extract Keyword Tags
    all_tags = set()
    for s in students:
        tags = s.get('extra_tags', [])
        for t in tags:
            all_tags.add(t)
    sorted_tags = sorted(list(all_tags))
    
    # Derived Tags (Score >= 4)
    # We map the config IDs to readable labels for the filter
    feature_tags = {tag['id']: tag['label'] + "重視" for tag in tag_config}
    
    # Filters
    c1, c2, c3 = st.columns(3)
    with c1:
        selected_countries = st.multiselect("国・地域", countries)
    with c2:
        selected_types = st.multiselect("留学タイプ", types)
    with c3:
        selected_faculties = st.multiselect("学部・研究科", sorted_faculties)
        
    c4, c5 = st.columns(2)
    with c4:
        selected_features = st.multiselect("特徴 (スコア4以上)", list(feature_tags.values()))
    with c5:
        selected_keywords = st.multiselect("キーワード", sorted_tags)
    
    # Filter Logic
    ranked_students = students
    
    if selected_countries:
        ranked_students = [s for s in ranked_students if s.get('国・地域') in selected_countries]
    
    if selected_types:
        ranked_students = [s for s in ranked_students if s.get('留学タイプ') in selected_types]
        
    if selected_faculties:
        # Filter if student's affiliation starts with any of the selected faculties
        ranked_students = [
            s for s in ranked_students 
            if any(s.get('所属・学年', '').startswith(f) for f in selected_faculties)
        ]
        
    if selected_features:
        # Reverse map label to ID
        label_to_id = {v: k for k, v in feature_tags.items()}
        target_ids = [label_to_id[label] for label in selected_features]
        
        # Filter: Student must match ALL selected feature tags (Score >= 4)
        for tid in target_ids:
            ranked_students = [s for s in ranked_students if s.get(tid, 0) >= 4]

    if selected_keywords:
        # Filter: Student must have ALL selected keywords
        for kw in selected_keywords:
            ranked_students = [s for s in ranked_students if kw in s.get('extra_tags', [])]

# Display Results
st.markdown("---")
st.subheader(f"検索結果 ({len(ranked_students)}件)")

for i, student in enumerate(ranked_students):
    # Match rate is only relevant in Match Mode, but we can show it if it exists
    match_rate = student.get('match_rate', 0)
    
    # Title format depends on mode
    if mode == "マッチ度診断":
        color = "red" if match_rate >= 90 else "orange" if match_rate >= 70 else "blue"
        title = f"#{i+1} 【マッチ度: :{color}[{match_rate}%]】 {student.get('国・地域')} - {student.get('大学名（留学先機関）')}"
    else:
        title = f"【{student.get('国・地域')}】 {student.get('大学名（留学先機関）')} ({student.get('氏名（仮名）')})"
    
    with st.expander(title):
        # Tags Display
        tag_display = " | ".join([f"{tag['label']}: {student.get(tag['id'], '-')}" for tag in tag_config])
        
        # Add Keyword Tags to display
        extra_tags = student.get('extra_tags', [])
        if extra_tags:
            tag_display += " | " + " ".join([f":blue-background[{t}]" for t in extra_tags])
            
        st.caption(tag_display)
        st.info(f"💡 {student.get('one_line_summary', '要約なし')}")
            
            # Basic Info
        # Basic Info
        c1, c2 = st.columns(2)
        with c1:
            st.markdown(f"**留学タイプ:** {student.get('留学タイプ')}")
            st.markdown(f"**期間:** {student.get('留学期間（年月〜年月）')}")
        with c2:
            st.markdown(f"**専攻:** {student.get('所属（英語）/専攻')}")
            st.markdown(f"**費用:** {student.get('生活費（月額）-合計')}円/月")
            
        st.markdown("---")
        st.markdown(f"**Q. 大学を選んだ理由は？**\n{student.get('〔留学前〕大学を選んだ理由')}")
        st.markdown(f"**Q. 後輩へのアドバイス**\n{student.get('後輩へのアドバイス')}")
        
        if st.checkbox("全ての項目を表示", key=student.get('ID', str(student))):
            st.json(student)




# LLM Summary Section (Optional)
st.markdown("---")
st.subheader("🤖 AIにまとめてもらう")
if filtered_students and api_key_input:
    user_question = st.text_input("このリストの先輩たちに聞きたいことは？", placeholder="例：治安はどうでしたか？")
    if user_question and st.button("AIに聞く"):
        with st.spinner("回答を生成中..."):
            response = generate_response(filtered_students, user_question)
            st.info(response)
elif not api_key_input:
    st.caption("※ AI機能を使うにはサイドバーでAPIキーを設定してください。")
elif not filtered_students:
    st.caption("※ 検索結果が0件のためAI機能は使えません。")
