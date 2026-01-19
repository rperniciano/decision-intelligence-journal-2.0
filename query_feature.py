import sqlite3

conn = sqlite3.connect(r'D:\Programmi\PORTFOLIO\decision-intelligence-journal-2.0\features.db')
cursor = conn.cursor()
cursor.execute('SELECT id, priority, category, name, description, steps, passes, in_progress FROM features WHERE id = 249')
row = cursor.fetchone()

if row:
    print(f"ID: {row[0]}")
    print(f"Priority: {row[1]}")
    print(f"Category: {row[2]}")
    print(f"Name: {row[3]}")
    print(f"Description: {row[4]}")
    print(f"Steps: {row[5]}")
    print(f"Passes: {row[6]}")
    print(f"In Progress: {row[7]}")
else:
    print("Feature 249 not found")

conn.close()
