import sqlite3
import json
import os

db_path = os.path.join(os.path.dirname(__file__), 'features.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT * FROM features WHERE id = 15")
row = cursor.fetchone()

if row:
    columns = [desc[0] for desc in cursor.description]
    feature = dict(zip(columns, row))
    print(json.dumps(feature, indent=2))
else:
    print('Feature #15 not found')

conn.close()
