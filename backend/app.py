from flask import Flask, jsonify, request, g
from flask_cors import CORS
from models import db, Game, Genre, Platform, Tag, Screenshot, User, Wishlist, Review
from datetime import datetime, date, timedelta
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import json
import math
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'super-secret-key-for-dev')
app.config['JWT_EXPIRATION_DELTA'] = int(os.environ.get('JWT_EXPIRATION_DELTA', 86400))

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


def generate_token(user):
    payload = {
        'sub': str(user.id),
        'id': str(user.id),
        'username': user.username,
        'exp': datetime.utcnow() + timedelta(seconds=app.config['JWT_EXPIRATION_DELTA'])
    }
    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    return token


def get_authenticated_user():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None

    token = auth_header.split(' ', 1)[1].strip()
    try:
        payload = jwt.decode(
            token,
            app.config['SECRET_KEY'],
            algorithms=['HS256'],
            options={'verify_sub': False}
        )
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

    user_id = payload.get('sub') or payload.get('id')
    if not user_id:
        return None

    if isinstance(user_id, str) and user_id.isdigit():
        user_id = int(user_id)

    return User.query.get(user_id)


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_authenticated_user()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        g.current_user = user
        return f(*args, **kwargs)
    return decorated_function


def wasted_score(game):
    rating = game.rating or 0
    base = rating * 1.5
    playtime_bonus = min(2.5, (game.playtime or 0) / 20)
    return base + playtime_bonus

@app.route('/api/games', methods=['GET'])
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

    # Initial query
    query = Game.query

    # Database level filtering for search if provided (efficiency)
    if search:
        query = query.filter(Game.name.ilike(f'%{search}%'))

    games = query.all()

    # In-memory filtering for more complex relations or conditions
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

    # Apply strict playtime filtering if any playtime filter is present or sorting by playtime
    if min_playtime is not None or max_playtime is not None or sort_by in ['playtime_asc', 'playtime_desc']:
        games = [g for g in games if g.playtime and g.playtime > 0]

    if min_playtime is not None:
        games = [g for g in games if g.playtime >= min_playtime]
    if max_playtime is not None:
        games = [g for g in games if g.playtime <= max_playtime]

    # Sorting logic
    if sort_by == 'trending':
        six_months_ago = date.today() - timedelta(days=183)
        recent = [g for g in games if g.released and g.released >= six_months_ago]
        if len(recent) < limit + offset:
            # Fallback: Get the 100 most recent games if the 6-month pool is too small
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
        # Default ranking using Wasted Hours Score (Purple -> Blue -> Gray)
        games.sort(key=lambda g: (wasted_score(g), g.id), reverse=True)

    start = ((page - 1) * limit) + offset
    end = start + limit
    paginated = games[start:end]

    total_count = len(games)
    # Correct pages calculation: we use total_count which is already the size of the filtered pool
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

@app.route('/api/games/search', methods=['GET'])
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


@app.route('/api/games/filter', methods=['GET'])
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
        # More robust genre matching - check both name and slug
        games = [g for g in games if any(
            genre_name in gen.name.lower() or genre_name in gen.slug.lower()
            for gen in g.genres
        )]

    if platform_name:
        # More robust platform matching - check both name and slug
        games = [g for g in games if any(
            platform_name in plat.name.lower() or platform_name in plat.slug.lower()
            for plat in g.platforms
        )]

    if rating_min is not None:
        games = [g for g in games if g.rating and g.rating >= rating_min]

    if rating_max is not None:
        games = [g for g in games if g.rating and g.rating <= rating_max]

    # Apply strict playtime filtering if any playtime filter is present
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
    """Get trending games from the last 6 months sorted by Wasted score. Params: limit, offset."""
    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))
    
    six_months_ago = date.today() - timedelta(days=183)
    games = Game.query.filter(
        Game.released.isnot(None),
        Game.released >= six_months_ago
    ).all()
    
    if len(games) < limit + offset:
        # Fallback: Get the 100 most recent games if the 6-month pool is too small
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


@app.route('/api/auth/register', methods=['POST'])
def register_user():
    """Register a new user with username, email and password."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'JSON body required'}), 400

    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({'error': 'username, email and password are required'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 409

    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password)
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate a user and return a JWT token."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'JSON body required'}), 400

    identifier = data.get('username') or data.get('email')
    password = data.get('password', '')
    if not identifier or not password:
        return jsonify({'error': 'username/email and password are required'}), 400

    user = User.query.filter_by(username=identifier).first()
    if user is None:
        user = User.query.filter_by(email=identifier.lower()).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = generate_token(user)
    return jsonify({'token': token, 'user': user.to_dict()})


@app.route('/api/auth/me', methods=['GET'])
@login_required
def get_current_user():
    return jsonify(g.current_user.to_dict())


@app.route('/api/auth/me', methods=['DELETE'])
@login_required
def delete_current_user():
    """Delete the current authenticated user account."""
    try:
        # Delete user's reviews
        Review.query.filter_by(user_id=g.current_user.id).delete()

        # Delete user's wishlist items
        Wishlist.query.filter_by(user_id=g.current_user.id).delete()

        # Delete the user
        db.session.delete(g.current_user)
        db.session.commit()

        return jsonify({'message': 'Account deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete account'}), 500


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


# Wishlist endpoints
@app.route('/api/wishlist', methods=['GET'])
@login_required
def get_wishlist():
    """Get authenticated user's wishlist."""
    wishlist_items = Wishlist.query.filter_by(user_id=g.current_user.id).all()
    return jsonify([item.to_dict() for item in wishlist_items])


@app.route('/api/wishlist', methods=['POST'])
@login_required
def add_to_wishlist():
    """Add game to authenticated user's wishlist. Body: {game_id: int}."""
    data = request.get_json(silent=True)
    if not data or 'game_id' not in data:
        return jsonify({'error': 'game_id is required'}), 400

    game_id = data['game_id']
    user_id = g.current_user.id

    game = Game.query.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    existing = Wishlist.query.filter_by(user_id=user_id, game_id=game_id).first()
    if existing:
        return jsonify({'error': 'Game already in wishlist'}), 409

    wishlist_item = Wishlist(user_id=user_id, game_id=game_id)
    db.session.add(wishlist_item)
    db.session.commit()

    return jsonify(wishlist_item.to_dict()), 201


@app.route('/api/wishlist/<int:game_id>', methods=['DELETE'])
@login_required
def remove_from_wishlist(game_id):
    """Remove game from authenticated user's wishlist."""
    user_id = g.current_user.id

    wishlist_item = Wishlist.query.filter_by(user_id=user_id, game_id=game_id).first()
    if not wishlist_item:
        return jsonify({'error': 'Game not in wishlist'}), 404

    db.session.delete(wishlist_item)
    db.session.commit()

    return jsonify({'status': 'removed', 'game_id': game_id})


# Review endpoints
@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    """Get reviews. Params: game_id (optional), user_id (optional), limit, offset."""
    game_id = request.args.get('game_id', type=int)
    user_id = request.args.get('user_id', type=int)
    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))

    query = Review.query
    if game_id:
        query = query.filter_by(game_id=game_id)
    if user_id:
        query = query.filter_by(user_id=user_id)

    reviews = query.order_by(Review.created_at.desc()).offset(offset).limit(limit).all()
    return jsonify([review.to_dict() for review in reviews])


@app.route('/api/reviews', methods=['POST'])
@login_required
def create_review():
    """Create or update a review. Body: {game_id: int, rating: float, playtime_hours?: int, review_text?: string}."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'JSON body required'}), 400

    required_fields = ['game_id', 'rating']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    user_id = g.current_user.id
    game_id = data['game_id']
    rating = data['rating']

    if not (1 <= rating <= 10):
        return jsonify({'error': 'Rating must be between 1 and 10'}), 400

    game = Game.query.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    existing_review = Review.query.filter_by(user_id=user_id, game_id=game_id).first()

    if existing_review:
        existing_review.rating = rating
        if 'playtime_hours' in data:
            existing_review.playtime_hours = data['playtime_hours']
        if 'review_text' in data:
            existing_review.review_text = data['review_text']
        db.session.commit()
        return jsonify(existing_review.to_dict())
    else:
        review = Review(
            user_id=user_id,
            game_id=game_id,
            rating=rating,
            playtime_hours=data.get('playtime_hours'),
            review_text=data.get('review_text')
        )
        db.session.add(review)
        db.session.commit()
        return jsonify(review.to_dict()), 201


@app.route('/api/reviews/<int:review_id>', methods=['PUT'])
@login_required
def update_review(review_id):
    """Update a review. Body: {rating?: float, playtime_hours?: int, review_text?: string}."""
    review = Review.query.get_or_404(review_id)

    if review.user_id != g.current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'JSON body required'}), 400

    if 'rating' in data:
        rating = data['rating']
        if not (1 <= rating <= 10):
            return jsonify({'error': 'Rating must be between 1 and 10'}), 400
        review.rating = rating

    if 'playtime_hours' in data:
        review.playtime_hours = data['playtime_hours']

    if 'review_text' in data:
        review.review_text = data['review_text']

    db.session.commit()
    return jsonify(review.to_dict())


@app.route('/api/reviews/<int:review_id>', methods=['DELETE'])
@login_required
def delete_review(review_id):
    """Delete a review."""
    review = Review.query.get_or_404(review_id)

    if review.user_id != g.current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    db.session.delete(review)
    db.session.commit()
    return jsonify({'status': 'deleted', 'id': review_id})


@app.route('/api/games/<int:game_id>/user-review', methods=['GET'])
@login_required
def get_user_review_for_game(game_id):
    """Get current user's review for a specific game."""
    user_id = g.current_user.id

    review = Review.query.filter_by(user_id=user_id, game_id=game_id).first()
    if not review:
        return jsonify({'message': 'No review found'}), 404

    return jsonify(review.to_dict())


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
