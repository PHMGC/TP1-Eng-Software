from flask import Blueprint, jsonify, request, g
from models import db, Game, Review
from utils.auth import login_required

reviews_bp = Blueprint('reviews', __name__, url_prefix='/api/reviews')


@reviews_bp.route('', methods=['GET'])
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


@reviews_bp.route('', methods=['POST'])
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


@reviews_bp.route('/<int:review_id>', methods=['PUT'])
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


@reviews_bp.route('/<int:review_id>', methods=['DELETE'])
@login_required
def delete_review(review_id):
    """Delete a review."""
    review = Review.query.get_or_404(review_id)

    if review.user_id != g.current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    db.session.delete(review)
    db.session.commit()
    return jsonify({'status': 'deleted', 'id': review_id})


@reviews_bp.route('/games/<int:game_id>/user-review', methods=['GET'])
@login_required
def get_user_review_for_game(game_id):
    """Get current user's review for a specific game."""
    user_id = g.current_user.id

    review = Review.query.filter_by(user_id=user_id, game_id=game_id).first()
    if not review:
        return jsonify({'message': 'No review found'}), 404

    return jsonify(review.to_dict())
