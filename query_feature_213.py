import sqlite3
import json

db_path = 'features.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute('''
    SELECT id, priority, category, name, description, steps, passes, in_progress, dependencies
    FROM features
    WHERE id = 213
''')

row = cursor.fetchone()
if row:
    result = {
        'id': row[0],
        'priority': row[1],
        'category': row[2],
        'name': row[3],
        'description': row[4],
        'steps': row[5],
        'passes': row[6],
        'in_progress': row[7],
        'dependencies': row[8]
    }
    print(json.dumps(result, indent=2))
else:
    print('Feature #213 not found')

conn.close()
