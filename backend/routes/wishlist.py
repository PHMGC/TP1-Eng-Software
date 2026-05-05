from flask import Blueprint, jsonify, request, g
from models import db, Game, Wishlist
from utils.auth import login_required

wishlist_bp = Blueprint('wishlist', __name__, url_prefix='/api/wishlist')


@wishlist_bp.route('', methods=['GET'])
@login_required
def get_wishlist():
    """Get authenticated user's wishlist."""
    wishlist_items = Wishlist.query.filter_by(user_id=g.current_user.id).all()
    return jsonify([item.to_dict() for item in wishlist_items])


@wishlist_bp.route('', methods=['POST'])
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


@wishlist_bp.route('/<int:game_id>', methods=['DELETE'])
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
