from flask import Flask, jsonify, request
from flask_cors import CORS
from models import db, Game, Genre, Platform, Tag, Screenshot
from datetime import datetime, date, timedelta
import json
import math
import os

app = Flask(__name__)

# Configuração do Banco de Dados SQLite
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'games.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializa o banco de dados e CORS
db.init_app(app)
CORS(app)

# Cria as tabelas no banco de dados, caso não existam
with app.app_context():
    db.create_all()

@app.route('/api/status', methods=['GET'])
def get_status():
    """Check API health and database connection status."""
    return jsonify({
        "status": "success",
        "message": "A API Flask está rodando corretamente!",
        "database": "SQLite conectado"
    })


def get_total_ratings(game):
    if not game.ratings_distribution: return 0
    try:
        dist = game.ratings_distribution
        if isinstance(dist, str):
            dist = json.loads(dist)
        return sum(r.get('count', 0) for r in dist)
    except:
        return 0

def imdb_score(game):
    v = get_total_ratings(game)
    R = game.rating or 0
    if v == 0:
        return R * 0.1
    C = 3.5
    m = 500
    return (v / (v + m)) * R + (m / (v + m)) * C

@app.route('/api/games', methods=['GET'])
def get_games():
    """List, search, or sort games. Params: page, limit, offset, search, sort."""
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))
    search = request.args.get('search', '').strip()
    sort = request.args.get('sort', '').strip().lower()

    if search:
        games = Game.query.filter(Game.name.ilike(f'%{search}%')).all()
    elif sort == 'trending':
        six_months_ago = date.today() - timedelta(days=183)
        games = Game.query.filter(
            Game.released.isnot(None),
            Game.released >= six_months_ago
        ).all()
        if len(games) < limit + offset:
            games = Game.query.filter(Game.released.isnot(None)).order_by(Game.released.desc()).all()
    elif sort == 'top_rated':
        games = Game.query.filter(Game.rating.isnot(None)).order_by(Game.rating.desc()).all()
    else:
        games = Game.query.all()

    if sort != 'top_rated':
        games.sort(key=imdb_score, reverse=True)

    start = ((page - 1) * limit) + offset
    end = start + limit
    paginated = games[start:end]

    return jsonify({
        'data': [game.to_dict() for game in paginated],
        'total': len(games),
        'page': page,
        'pages': math.ceil((len(games) - offset) / limit) if limit > 0 else 1,
        'filters': {
            'search': search or None,
            'sort': sort or None
        }
    })

@app.route('/api/games/search', methods=['GET'])
def search_games():
    """Search games by name. Params: query or search (required), limit, offset."""
    query = request.args.get('query', '').strip() or request.args.get('search', '').strip()
    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))

    if not query:
        return jsonify({'error': 'query parameter is required'}), 400

    games = Game.query.filter(Game.name.ilike(f'%{query}%')).all()
    games.sort(key=imdb_score, reverse=True)
    paginated = games[offset:offset + limit]

    return jsonify({
        'data': [game.to_dict() for game in paginated],
        'total': len(games),
        'limit': limit,
        'offset': offset
    })


@app.route('/api/games/filter', methods=['GET'])
def filter_games():
    """Filter games by genre, platform, and rating. Params: genre, platform, rating_min, rating_max, limit, offset."""
    genre_name = request.args.get('genre', '').strip().lower()
    platform_name = request.args.get('platform', '').strip().lower()
    rating_min = request.args.get('rating_min', type=float)
    rating_max = request.args.get('rating_max', type=float)
    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))
    
    games = Game.query.all()
    
    if genre_name:
        games = [g for g in games if any(genre_name in gen.name.lower() for gen in g.genres)]
    
    if platform_name:
        games = [g for g in games if any(platform_name in plat.name.lower() for plat in g.platforms)]
    
    if rating_min is not None:
        games = [g for g in games if g.rating and g.rating >= rating_min]
    
    if rating_max is not None:
        games = [g for g in games if g.rating and g.rating <= rating_max]
    
    games.sort(key=imdb_score, reverse=True)
    paginated = games[offset:offset + limit]
    
    return jsonify({
        'data': [game.to_dict() for game in paginated],
        'total': len(games),
        'limit': limit,
        'offset': offset,
        'filters': {
            'genre': genre_name or None,
            'platform': platform_name or None,
            'rating_min': rating_min,
            'rating_max': rating_max
        }
    })


@app.route('/api/games/top-rated', methods=['GET'])
def top_rated_games():
    """Get top-rated games sorted by rating. Params: limit, offset."""
    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))
    
    games = Game.query.filter(Game.rating.isnot(None)).order_by(Game.rating.desc()).all()
    paginated = games[offset:offset + limit]
    
    return jsonify({
        'data': [game.to_dict() for game in paginated],
        'total': len(games),
        'limit': limit,
        'offset': offset,
        'sort': 'top_rated'
    })


@app.route('/api/games/trending', methods=['GET'])
def trending_games():
    """Get trending games from the last 6 months sorted by IMDB score. Params: limit, offset."""
    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))
    
    six_months_ago = date.today() - timedelta(days=183)
    games = Game.query.filter(
        Game.released.isnot(None),
        Game.released >= six_months_ago
    ).all()
    
    if len(games) < limit + offset:
        games = Game.query.filter(Game.released.isnot(None)).order_by(Game.released.desc()).all()
    
    games.sort(key=imdb_score, reverse=True)
    paginated = games[offset:offset + limit]
    
    return jsonify({
        'data': [game.to_dict() for game in paginated],
        'total': len(games),
        'limit': limit,
        'offset': offset,
        'sort': 'trending'
    })


@app.route('/api/genres', methods=['GET'])
def get_genres():
    """Get all available genres."""
    genres = Genre.query.all()
    genres = [genre.to_dict() for genre in genres]

    return jsonify(genres), 200


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


@app.route('/api/games/<int:game_id>', methods=['GET'])
def get_game(game_id):
    """Get a single game by ID with all details and relationships."""
    game = Game.query.get_or_404(game_id)
    return jsonify(game.to_dict())


@app.route('/api/games', methods=['POST'])
def create_game():
    """Create a new game. Required: slug, name. Supports genres, platforms, tags, screenshots."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'JSON body required'}), 400
    if not data.get('slug') or not data.get('name'):
        return jsonify({'error': 'Fields slug and name are required'}), 400
    if Game.query.filter_by(slug=data['slug']).first():
        return jsonify({'error': 'Game with this slug already exists'}), 409

    game = Game(
        id=data.get('id'),
        slug=data['slug'],
        name=data['name']
    )
    apply_game_data(game, data)
    db.session.add(game)
    db.session.commit()
    return jsonify(game.to_dict()), 201


@app.route('/api/games/<int:game_id>', methods=['PUT'])
def update_game(game_id):
    """Update an existing game. Partial updates supported."""
    game = Game.query.get_or_404(game_id)
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'JSON body required'}), 400
    if 'slug' in data and data['slug'] != game.slug and Game.query.filter_by(slug=data['slug']).first():
        return jsonify({'error': 'Another game with this slug already exists'}), 409
    apply_game_data(game, data)
    db.session.commit()
    return jsonify(game.to_dict())


@app.route('/api/games/<int:game_id>', methods=['DELETE'])
def delete_game(game_id):
    """Delete a game by ID."""
    game = Game.query.get_or_404(game_id)
    db.session.delete(game)
    db.session.commit()
    return jsonify({'status': 'deleted', 'id': game_id})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
