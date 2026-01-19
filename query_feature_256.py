import sqlite3

conn = sqlite3.connect('features.db')
cur = conn.cursor()
cur.execute('SELECT id, name, description, steps, passes, in_progress FROM features WHERE id = 256')
row = cur.fetchone()

print('ID:', row[0])
print('Name:', row[1])
print('Description:', row[2])
print('Steps:', row[3])
print('Passes:', row[4])
print('In Progress:', row[5])

conn.close()
