from datetime import datetime, date
from models import db


def wasted_score(game):
    rating = game.rating or 0
    base = rating * 1.5
    playtime_bonus = min(2.5, (game.playtime or 0) / 20)
    return base + playtime_bonus


def parse_date(value):
    if not value:
        return None
    if isinstance(value, str):
        try:
            return datetime.strptime(value, '%Y-%m-%d').date()
        except ValueError:
            return None
    if isinstance(value, datetime):
        return value.date()
    return None


def parse_datetime(value):
    if not value:
        return None
    if isinstance(value, str):
        for fmt in ('%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S.%f', '%Y-%m-%d %H:%M:%S.%f'):
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
        return None
    if isinstance(value, datetime):
        return value
    return None


def find_or_create_relation(model, payload):
    if not payload or not isinstance(payload, dict):
        raise ValueError('Invalid relation payload')
    obj = None
    if payload.get('id') is not None:
        obj = model.query.get(payload['id'])
    if obj is None and payload.get('slug'):
        obj = model.query.filter_by(slug=payload['slug']).first()
    if obj is None:
        obj = model(**payload)
        db.session.add(obj)
    return obj


def apply_game_data(game, data):
    from models import Genre, Platform, Tag, Screenshot

    fields = [
        'slug', 'name', 'tba', 'background_image', 'rating', 'rating_top',
        'metacritic', 'playtime', 'esrb_rating', 'ratings_distribution', 'added_by_status'
    ]
    for field in fields:
        if field in data:
            setattr(game, field, data[field])

    if 'released' in data:
        game.released = parse_date(data['released'])
    if 'updated' in data:
        game.updated = parse_datetime(data['updated'])

    if 'genres' in data:
        game.genres = [find_or_create_relation(Genre, item) for item in data['genres'] if isinstance(item, dict)]
    if 'platforms' in data:
        game.platforms = [find_or_create_relation(Platform, item) for item in data['platforms'] if isinstance(item, dict)]
    if 'tags' in data:
        game.tags = [find_or_create_relation(Tag, item) for item in data['tags'] if isinstance(item, dict)]
    if 'screenshots' in data:
        game.screenshots = [Screenshot(game=game, image_url=item.get('image_url')) for item in data['screenshots'] if isinstance(item, dict) and item.get('image_url')]

    return game
