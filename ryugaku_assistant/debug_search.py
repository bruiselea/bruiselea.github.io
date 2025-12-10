from data_loader import load_data
from agent_logic import search_students

def debug():
    print("=== Debugging Data Loader ===")
    file_path = '留学アンケート_ダミーデータ.xlsx'
    try:
        students = load_data(file_path)
        print(f"Loaded {len(students)} students.")
        
        if not students:
            print("ERROR: No students loaded!")
            return

        print(f"First student keys: {list(students[0].keys())}")
        print(f"First student sample value (Country): {students[0].get('国・地域')}")
        
    except Exception as e:
        print(f"ERROR loading data: {e}")
        return

    print("\n=== Debugging Search Logic ===")
    test_queries = ["アメリカ", "奨学金", "学生", "2025"]
    
    for q in test_queries:
        print(f"Query: '{q}'")
        results = search_students(students, q)
        print(f"  Found {len(results)} matches.")
        if results:
            print(f"  First match ID: {results[0].get('ID', 'Unknown')}")
            print(f"  First match Country: {results[0].get('国・地域', 'Unknown')}")

if __name__ == "__main__":
    debug()
