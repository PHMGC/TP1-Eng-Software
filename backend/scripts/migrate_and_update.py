import sqlite3
import os
import urllib.request
import json
import time
from app import create_app
from models import db, Game

RAWG_API_KEY = os.getenv('RAWG_API_KEY')

app = create_app()


def fetch_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'curl/7.81.0', 'Accept': '*/*'})
    with urllib.request.urlopen(req, timeout=15) as response:
        return json.loads(response.read().decode('utf-8'))


def alter_table():
    basedir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    db_path = os.path.join(basedir, 'games.db')

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE games ADD COLUMN description TEXT;")
        cursor.execute("ALTER TABLE games ADD COLUMN description_raw TEXT;")
        cursor.execute("ALTER TABLE games ADD COLUMN developers JSON;")
        cursor.execute("ALTER TABLE games ADD COLUMN publishers JSON;")
        conn.commit()
        print("Columns added successfully.")
    except sqlite3.OperationalError as e:
        print("Alter table skipped/error:", e)
    finally:
        conn.close()


def update_top_games():
    with app.app_context():
        games = Game.query.order_by(Game.rating.desc()).limit(1000).all()
        print(f"Updating details for {len(games)} games...")

        for g in games:
            if g.description:
                continue

            url = f"https://api.rawg.io/api/games/{g.id}?key={RAWG_API_KEY}"
            try:
                data = fetch_json(url)
                if data:
                    g.description = data.get('description')
                    g.description_raw = data.get('description_raw')

                    devs = data.get('developers', [])
                    g.developers = [d['name'] for d in devs] if devs else []

                    pubs = data.get('publishers', [])
                    g.publishers = [p['name'] for p in pubs] if pubs else []

                    print(f"Updated: {g.name}")
            except Exception as e:
                print(f"Failed to fetch {g.name}: {e}")

            time.sleep(0.1)

        db.session.commit()
        print("Database updated!")


if __name__ == '__main__':
    alter_table()
    update_top_games()
