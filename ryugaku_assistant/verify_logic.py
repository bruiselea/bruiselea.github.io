import json
from agent_logic import calculate_match_score
from data_loader import load_data

DATA_PATH = 'processed_students.json'

def verify_logic():
    print("Loading data...")
    try:
        students, config = load_data(DATA_PATH)
        print(f"Loaded {len(students)} students.")
        print(f"Config tags: {[t['id'] for t in config.get('tags', [])]}")
    except Exception as e:
        print(f"Failed to load data: {e}")
        return

    # Test Case 1: High Language Focus
    print("\n--- Test Case 1: Language Focus = 5 ---")
    prefs = {
        "language_focus": 5,
        "research_focus": 1,
        "social_focus": 1,
        "cost_performance": 1,
        "safety_rating": 1
    }
    ranked = calculate_match_score(students, prefs, config.get('tags'))
    top = ranked[0]
    print(f"Top Match: {top.get('大学名（留学先機関）')} ({top.get('国・地域')})")
    print(f"Score: {top.get('match_rate')}%")
    print(f"Tags: Lang={top.get('language_focus')}, Res={top.get('research_focus')}")

    # Test Case 2: High Cost Performance
    print("\n--- Test Case 2: Cost Performance = 5 ---")
    prefs = {
        "language_focus": 1,
        "research_focus": 1,
        "social_focus": 1,
        "cost_performance": 5,
        "safety_rating": 1
    }
    ranked = calculate_match_score(students, prefs, config.get('tags'))
    top = ranked[0]
    print(f"Top Match: {top.get('大学名（留学先機関）')} ({top.get('国・地域')})")
    print(f"Score: {top.get('match_rate')}%")
    print(f"Tags: Cost={top.get('cost_performance')}")

if __name__ == "__main__":
    verify_logic()
