from flask import Blueprint, jsonify, request, g
from models import db, Game, Library
from utils.auth import login_required

library_bp = Blueprint('library', __name__, url_prefix='/api/library')


@library_bp.route('', methods=['GET'])
@login_required
def get_library():
    """Get authenticated user's library."""
    library_items = Library.query.filter_by(user_id=g.current_user.id).all()
    return jsonify([item.to_dict() for item in library_items])


@library_bp.route('', methods=['POST'])
@login_required
def add_to_library():
    """Add game to authenticated user's library. Body: {game_id: int}."""
    data = request.get_json(silent=True)
    if not data or 'game_id' not in data:
        return jsonify({'error': 'game_id is required'}), 400

    game_id = data['game_id']
    user_id = g.current_user.id

    game = Game.query.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    existing = Library.query.filter_by(user_id=user_id, game_id=game_id).first()
    if existing:
        return jsonify({'error': 'Game already in library'}), 409

    library_item = Library(user_id=user_id, game_id=game_id)
    db.session.add(library_item)
    db.session.commit()

    return jsonify(library_item.to_dict()), 201


@library_bp.route('/<int:game_id>', methods=['DELETE'])
@login_required
def remove_from_library(game_id):
    """Remove game from authenticated user's library."""
    user_id = g.current_user.id

    library_item = Library.query.filter_by(user_id=user_id, game_id=game_id).first()
    if not library_item:
        return jsonify({'error': 'Game not in library'}), 404

    db.session.delete(library_item)
    db.session.commit()

    return jsonify({'status': 'removed', 'game_id': game_id})
