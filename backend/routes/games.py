from flask import Blueprint, jsonify, request
from datetime import date, timedelta
import math
from models import db, Game, Genre
from utils.helpers import wasted_score, apply_game_data

games_bp = Blueprint('games', __name__, url_prefix='/api')


@games_bp.route('/status', methods=['GET'])
def get_status():
    """Check API health and database connection status."""
    return jsonify({
        "status": "success",
        "message": "A API Flask está rodando corretamente!",
        "database": "SQLite conectado"
    })


@games_bp.route('/games', methods=['GET'])
def get_games():
    """List, search, filter or sort games. Params: page, limit, offset, search, genre, sort, minRating, maxRating, minPlaytime, maxPlaytime."""
    page = max(1, int(request.args.get('page', 1)))
    limit = max(1, int(request.args.get('limit', 20)))
    offset = max(0, int(request.args.get('offset', 0)))
    search = request.args.get('search', '').strip().lower()
    genre = request.args.get('genre', '').strip().lower()
    sort_by = request.args.get('sort', '').strip().lower()
    min_rating = request.args.get('minRating')
    max_rating = request.args.get('maxRating')
    min_playtime = request.args.get('minPlaytime')
    max_playtime = request.args.get('maxPlaytime')

    def parse_numeric(value):
        if value is None or value == '':
            return None
        try:
            return float(value)
        except ValueError:
            return None

    min_rating = parse_numeric(min_rating)
    max_rating = parse_numeric(max_rating)
    min_playtime = parse_numeric(min_playtime)
    max_playtime = parse_numeric(max_playtime)

    query = Game.query

    if search:
        query = query.filter(Game.name.ilike(f'%{search}%'))

    games = query.all()

    if genre:
        games = [
            g for g in games
            if any(
                genre in gen.name.lower() or (gen.slug and genre in gen.slug.lower())
                for gen in g.genres
            )
        ]

    if min_rating is not None:
        games = [g for g in games if (g.rating or 0) >= min_rating]
    if max_rating is not None:
        games = [g for g in games if (g.rating or 0) <= max_rating]

    if min_playtime is not None or max_playtime is not None or sort_by in ['playtime_asc', 'playtime_desc']:
        games = [g for g in games if g.playtime and g.playtime > 0]

    if min_playtime is not None:
        games = [g for g in games if g.playtime >= min_playtime]
    if max_playtime is not None:
        games = [g for g in games if g.playtime <= max_playtime]

    if sort_by == 'trending':
        six_months_ago = date.today() - timedelta(days=183)
        recent = [g for g in games if g.released and g.released >= six_months_ago]
        if len(recent) < limit + offset:
            recent = sorted([g for g in games if g.released], key=lambda x: x.released, reverse=True)[:100]
        games = recent
        games.sort(key=wasted_score, reverse=True)
    elif sort_by == 'top_rated' or sort_by == 'rating_desc':
        games.sort(key=lambda g: g.rating or 0, reverse=True)
    elif sort_by == 'rating_asc':
        games.sort(key=lambda g: g.rating or 0)
    elif sort_by == 'playtime_desc':
        games.sort(key=lambda g: (g.playtime or 0, g.id), reverse=True)
    elif sort_by == 'playtime_asc':
        games.sort(key=lambda g: (g.playtime or 0, g.id))
    elif sort_by == 'name_asc':
        games.sort(key=lambda g: ((g.name or '').lower(), g.id))
    elif sort_by == 'name_desc':
        games.sort(key=lambda g: ((g.name or '').lower(), g.id), reverse=True)
    elif sort_by == 'wasted_score':
        games.sort(key=lambda g: (wasted_score(g), g.id), reverse=True)
    else:
        games.sort(key=lambda g: (wasted_score(g), g.id), reverse=True)

    start = ((page - 1) * limit) + offset
    end = start + limit
    paginated = games[start:end]

    total_count = len(games)
    total_pages = math.ceil(total_count / limit) if limit > 0 else 1

    return jsonify({
        'data': [game.to_dict() for game in paginated],
        'total': total_count,
        'page': page,
        'pages': total_pages,
        'filters': {
            'search': search or None,
            'sort': sort_by or None
        }
    })


@games_bp.route('/games/search', methods=['GET'])
def search_games():
    """Search games by name. Params: query or search (required), limit, offset."""
    query = request.args.get('query', '').strip() or request.args.get('search', '').strip()
    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))

    if not query:
        return jsonify({'error': 'query parameter is required'}), 400

    games = Game.query.filter(Game.name.ilike(f'%{query}%')).all()
    games.sort(key=wasted_score, reverse=True)
    paginated = games[offset:offset + limit]

    return jsonify({
        'data': [game.to_dict() for game in paginated],
        'total': len(games),
        'limit': limit,
        'offset': offset
    })


@games_bp.route('/games/filter', methods=['GET'])
def filter_games():
    """Filter games by genre, platform, and rating. Params: genre, platform, rating_min, rating_max, limit, offset."""
    genre_name = request.args.get('genre', '').strip().lower()
    platform_name = request.args.get('platform', '').strip().lower()
    rating_min = request.args.get('rating_min', type=float)
    rating_max = request.args.get('rating_max', type=float)
    min_playtime = request.args.get('minPlaytime', type=int)
    max_playtime = request.args.get('maxPlaytime', type=int)
    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))

    games = Game.query.all()

    if genre_name:
        games = [g for g in games if any(
            genre_name in gen.name.lower() or genre_name in gen.slug.lower()
            for gen in g.genres
        )]

    if platform_name:
        games = [g for g in games if any(
            platform_name in plat.name.lower() or platform_name in plat.slug.lower()
            for plat in g.platforms
        )]

    if rating_min is not None:
        games = [g for g in games if g.rating and g.rating >= rating_min]

    if rating_max is not None:
        games = [g for g in games if g.rating and g.rating <= rating_max]

    if request.args.get('minPlaytime') or request.args.get('maxPlaytime'):
        games = [g for g in games if g.playtime and g.playtime > 0]

    if min_playtime is not None:
        games = [g for g in games if g.playtime >= min_playtime]
    if max_playtime is not None:
        games = [g for g in games if g.playtime <= max_playtime]

    games.sort(key=wasted_score, reverse=True)
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


@games_bp.route('/games/top-rated', methods=['GET'])
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


@games_bp.route('/games/trending', methods=['GET'])
def trending_games():
    """Get trending games from the last 6 months sorted by Wasted score. Params: limit, offset."""
    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))

    six_months_ago = date.today() - timedelta(days=183)
    games = Game.query.filter(
        Game.released.isnot(None),
        Game.released >= six_months_ago
    ).all()

    if len(games) < limit + offset:
        games = Game.query.filter(Game.released.isnot(None)).order_by(Game.released.desc()).limit(100).all()

    games.sort(key=wasted_score, reverse=True)
    paginated = games[offset:offset + limit]

    return jsonify({
        'data': [game.to_dict() for game in paginated],
        'total': len(games),
        'limit': limit,
        'offset': offset,
        'sort': 'trending'
    })


@games_bp.route('/games/top-k-by-period', methods=['GET'])
def top_k_games_by_period():
    """Get top k games by rating released in a specific period.
    Params: k (limit, default 10), start_year, start_month, end_year, end_month (all required)."""
    k = int(request.args.get('k', 10))
    start_year = request.args.get('start_year')
    start_month = request.args.get('start_month')
    end_year = request.args.get('end_year')
    end_month = request.args.get('end_month')

    if k < 1:
        return jsonify({'error': 'k must be at least 1'}), 400

    if not all([start_year, start_month, end_year, end_month]):
        return jsonify({'error': 'Parameters required: start_year, start_month, end_year, end_month'}), 400

    try:
        from datetime import date
        start_year = int(start_year)
        start_month = int(start_month)
        end_year = int(end_year)
        end_month = int(end_month)

        if not (1 <= start_month <= 12 and 1 <= end_month <= 12):
            raise ValueError()

        start_date = date(start_year, start_month, 1)

        if end_month == 12:
            end_date = date(end_year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(end_year, end_month + 1, 1) - timedelta(days=1)
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid parameters. Years must be valid integers, months must be 1-12'}), 400

    games = Game.query.filter(
        Game.released.isnot(None),
        Game.released >= start_date,
        Game.released <= end_date,
        Game.rating.isnot(None)
    ).all()

    games.sort(key=lambda g: g.rating, reverse=True)
    top_k = games[:k]

    return jsonify({
        'data': [game.to_dict() for game in top_k],
        'total': len(games),
        'k': k,
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),
        'returned': len(top_k)
    })


@games_bp.route('/genres', methods=['GET'])
def get_genres():
    """Get all available genres."""
    genres = Genre.query.all()
    genres = [genre.to_dict() for genre in genres]
    return jsonify(genres), 200


@games_bp.route('/games/<int:game_id>', methods=['GET'])
def get_game(game_id):
    """Get a single game by ID with all details and relationships."""
    game = Game.query.get_or_404(game_id)
    return jsonify(game.to_dict())


@games_bp.route('/games', methods=['POST'])
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


@games_bp.route('/games/<int:game_id>', methods=['PUT'])
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


@games_bp.route('/games/<int:game_id>', methods=['DELETE'])
def delete_game(game_id):
    """Delete a game by ID."""
    game = Game.query.get_or_404(game_id)
    db.session.delete(game)
    db.session.commit()
    return jsonify({'status': 'deleted', 'id': game_id})
