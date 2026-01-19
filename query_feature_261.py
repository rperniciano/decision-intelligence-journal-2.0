import sqlite3

conn = sqlite3.connect('features.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()
cursor.execute('SELECT * FROM features WHERE id = 261')
row = cursor.fetchone()
if row:
    for key in row.keys():
        print(f"{key}: {row[key]}")
conn.close()
