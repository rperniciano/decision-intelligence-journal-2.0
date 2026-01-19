import sqlite3

conn = sqlite3.connect('features.db')
cursor = conn.execute('SELECT * FROM features WHERE id = 250')
row = cursor.fetchone()
cols = [d[0] for d in cursor.description]
if row:
    result = dict(zip(cols, row))
    for k, v in result.items():
        print(f"{k}: {v}")
else:
    print("Not found")
conn.close()
