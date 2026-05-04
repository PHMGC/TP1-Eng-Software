import os
import urllib.request
import json
import time
import subprocess
from datetime import datetime
from app import app
from models import db, Game, Genre, Platform, Tag, Screenshot

RAWG_API_KEY = os.getenv('RAWG_API_KEY')

def fetch_json(url):
	# try:
	req = urllib.request.Request(url, headers={'User-Agent': 'curl/7.81.0', 'Accept': '*/*'})
	with urllib.request.urlopen(req, timeout=15) as response:
		return json.loads(response.read().decode('utf-8'))
	# except Exception:
	# 	result = subprocess.run(['curl', '-s', '-4', url], capture_output=True, text=True, timeout=15)
	# 	if result.returncode == 0:
	# 		try:
	# 			return json.loads(result.stdout)
	# 		except:
	# 			pass
	# # return None

# Simple in-memory cache to avoid redundant DB queries
cache = {
	'genres': {},
	'platforms': {},
	'tags': {}
}

def load_caches():
	print("Pre-loading caches...")
	cache['genres'] = {obj.id: obj for obj in Genre.query.all()}
	cache['platforms'] = {obj.id: obj for obj in Platform.query.all()}
	cache['tags'] = {obj.id: obj for obj in Tag.query.all()}

def get_cached_or_create(model, category, **kwargs):
	obj_id = kwargs.get('id')
	if obj_id in cache[category]:
		return cache[category][obj_id]
	
	instance = model(**kwargs)
	db.session.add(instance)
	cache[category][obj_id] = instance
	return instance

def populate():
	with app.app_context():
		load_caches()
		games_count = Game.query.count()
		page = 1
		
		while games_count < 5000:
			url = f"https://api.rawg.io/api/games?key={RAWG_API_KEY}&ordering=-rating&page_size=40&page={page}"
			print(f"\n[Page {page}] Fetching data...")
			data = fetch_json(url)
			
			if not data or not data.get('results'):
				break
				
			results = data['results']
			new_entries_in_page = 0
			
			for g in results:
				# Quick check for existing game using identity map or simple query
				if db.session.get(Game, g['id']):
					continue
				
				released_str = g.get('released')
				released_date = datetime.strptime(released_str, '%Y-%m-%d').date() if released_str else None
				esrb = g.get('esrb_rating')

				game_obj = Game(
					id=g.get('id'),
					slug=g.get('slug'),
					name=g.get('name'),
					released=released_date,
					tba=g.get('tba', False),
					background_image=g.get('background_image'),
					rating=g.get('rating'),
					rating_top=g.get('rating_top'),
					metacritic=g.get('metacritic'),
					playtime=g.get('playtime'),
					updated=datetime.fromisoformat(g.get('updated').replace('Z', '+00:00')) if g.get('updated') else None,
					esrb_rating=esrb.get('name') if esrb else None,
					ratings_distribution=g.get('ratings'),
					added_by_status=g.get('added_by_status')
				)

				# Relationships using cache
				if 'genres' in g:
					for item in g['genres']:
						game_obj.genres.append(get_cached_or_create(Genre, 'genres', id=item['id'], name=item['name'], slug=item['slug']))
				
				if 'platforms' in g:
					for item in g['platforms']:
						p = item.get('platform', {})
						game_obj.platforms.append(get_cached_or_create(Platform, 'platforms', id=p['id'], name=p['name'], slug=p['slug']))

				if 'tags' in g:
					for item in g['tags']:
						game_obj.tags.append(get_cached_or_create(Tag, 'tags', id=item['id'], name=item['name'], slug=item['slug']))

				if 'short_screenshots' in g:
					for ss in g['short_screenshots']:
						game_obj.screenshots.append(Screenshot(id=ss['id'] if ss['id'] != -1 else None, image_url=ss['image']))

				db.session.add(game_obj)
				new_entries_in_page += 1
				games_count += 1

			# Commit once per page (40 games at once)
			try:
				db.session.commit()
				print(f"Page {page} committed: {new_entries_in_page} new games.")
			except Exception as e:
				db.session.rollback()
				print(f"Error committing page {page}: {e}")
				
			page += 1
			# Tiny sleep just to avoid aggressive rate limiting from RAWG
			time.sleep(0.1)

if __name__ == '__main__':
	populate()