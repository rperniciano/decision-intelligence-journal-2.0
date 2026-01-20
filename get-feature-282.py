import sqlite3
import json

conn = sqlite3.connect('features.db')
cursor = conn.cursor()
cursor.execute("SELECT * FROM features WHERE id = 282")
row = cursor.fetchone()

if row:
    columns = [desc[0] for desc in cursor.description]
    result = dict(zip(columns, row))
    print(json.dumps(result, indent=2))
else:
    print('Feature #282 not found')

conn.close()
