import sqlite3

conn = sqlite3.connect('features.db')
c = conn.cursor()
c.execute('SELECT id, category, name, description, steps FROM features WHERE id = 253')
r = c.fetchone()

print(f'ID: {r[0]}')
print(f'Category: {r[1]}')
print(f'Name: {r[2]}')
print(f'Description: {r[3]}')
print(f'Steps: {r[4]}')

conn.close()
