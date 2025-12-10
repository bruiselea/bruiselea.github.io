import os
import google.generativeai as genai
from typing import List, Dict

# Configure API Key (will be set from UI or Env)
def configure_genai(api_key):
    genai.configure(api_key=api_key)

def search_students(students: List[Dict], query: str) -> List[Dict]:
    """
    Searches for students based on a keyword query.
    Simple implementation: checks if query exists in any of the student's values.
    
    Args:
        students: List of student dictionaries.
        query: Search keyword (e.g., "アメリカ", "奨学金").
        
    Returns:
        List of matching student dictionaries.
    """
    if not query:
        return students
    
    query = query.lower()
    matches = []
    
    for student in students:
        # Convert all values to string and check for query
        # We prioritize specific fields if needed, but global search is good for MVP
        values = [str(v).lower() for v in student.values() if v is not None]
        if any(query in v for v in values):
            matches.append(student)
            
    return matches

def calculate_match_score(students: List[Dict], preferences: Dict, tag_config: List[Dict] = None) -> List[Dict]:
    """
    Calculates a match score for each student based on user preferences.
    
    Args:
        students: List of student dictionaries.
        preferences: Dict of user preferences (e.g., {'language_focus': 5}).
        tag_config: List of tag definitions from config (optional).
        
    Returns:
        List of students sorted by match score (descending).
    """
    scored_students = []
    
    # Create a weight map from config if available
    weights = {}
    if tag_config:
        for tag in tag_config:
            weights[tag['id']] = tag.get('weight', 1.0)
    
    for student in students:
        score = 0
        max_score = 0
        
        # If student doesn't have tags (e.g. raw excel data), we skip scoring or give default
        # We check if at least one preference key exists in student data
        if not any(k in student for k in preferences.keys()):
            continue
            
        for category, user_val in preferences.items():
            if user_val > 0: # Only consider categories the user cares about
                student_val = student.get(category, 3)
                weight = weights.get(category, 1.0)
                
                # Simple distance: 5 - |user - student|
                dist = abs(user_val - student_val)
                score += (5 - dist) * weight
                max_score += 5 * weight
        
        # Normalize to percentage
        match_rate = 0
        if max_score > 0:
            match_rate = int((score / max_score) * 100)
            
        student['match_rate'] = match_rate
        scored_students.append(student)
        
    # Sort by match rate
    return sorted(scored_students, key=lambda x: x.get('match_rate', 0), reverse=True)

def generate_response(students: List[Dict], user_query: str) -> str:
    """
    Generates a response using Gemini based on the retrieved student data.
    """
    if not students:
        return "申し訳ありません。その条件に合う留学経験者は見つかりませんでした。"
    
    # Limit context to avoid token limits (e.g., top 5 relevant students)
    # For MVP, we take the first 3-5 matches
    context_students = students[:5]
    
    context_text = ""
    for i, s in enumerate(context_students):
        context_text += f"--- Student {i+1} ---\n"
        # Select key fields to save tokens, or dump all if small
        for k, v in s.items():
            if v:
                context_text += f"{k}: {v}\n"
        context_text += "\n"
        
    prompt = f"""
    You are a helpful Study Abroad Advisor.
    Based on the following student experiences, answer the user's question.
    
    User Question: {user_query}
    
    Student Experiences:
    {context_text}
    
    Instructions:
    - Answer in Japanese.
    - Summarize the relevant information.
    - Cite specific students (e.g., "A student who went to X said...") if applicable.
    - Be encouraging and helpful.
    - If the information is not in the context, say so.
    """
    
    try:
        # Use newer model
        model_name = 'gemini-2.0-flash-exp'
        try:
            model = genai.GenerativeModel(model_name)
        except:
            model = genai.GenerativeModel('gemini-1.5-flash-002')
            
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating response: {e}"
