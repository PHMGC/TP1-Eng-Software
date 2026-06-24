import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'games.db')

def migrate():
    print(f"Connecting to {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # 1. Add columns to users table
        print("Adding 'bio' and 'avatar_url' to 'users' table...")
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN bio TEXT;")
            print(" - Column 'bio' added successfully.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(" - Column 'bio' already exists. Skipping.")
            else:
                raise e

        try:
            cursor.execute("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);")
            print(" - Column 'avatar_url' added successfully.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(" - Column 'avatar_url' already exists. Skipping.")
            else:
                raise e

        # 2. Create review_likes table
        print("Creating 'review_likes' table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS review_likes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                review_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (review_id) REFERENCES reviews (id) ON DELETE CASCADE,
                UNIQUE(user_id, review_id)
            );
        """)
        print(" - Table 'review_likes' created/verified.")

        conn.commit()
        print("Migration completed successfully.")

    except Exception as e:
        conn.rollback()
        print(f"Error during migration: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
