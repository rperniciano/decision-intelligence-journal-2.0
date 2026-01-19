import sqlite3
import json

conn = sqlite3.connect('features.db')
cursor = conn.cursor()
cursor.execute('SELECT * FROM features WHERE id = 265')
row = cursor.fetchone()
if row:
    columns = [desc[0] for desc in cursor.description]
    print(json.dumps(dict(zip(columns, row)), indent=2))
conn.close()
