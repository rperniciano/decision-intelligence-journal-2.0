import sqlite3

conn = sqlite3.connect('features.db')
c = conn.cursor()
c.execute('SELECT * FROM features WHERE id = 254')
row = c.fetchone()
cols = [d[0] for d in c.description]
result = dict(zip(cols, row))
for k, v in result.items():
    print(f"{k}: {v}")
conn.close()
