from flask import Blueprint, jsonify
from models import User, Review

users_bp = Blueprint('users', __name__, url_prefix='/api/users')


@users_bp.route('/<int:user_id>', methods=['GET'])
def get_public_profile(user_id):
    """Public profile for a user: public fields + their reviews. No email exposed."""
    user = User.query.get_or_404(user_id)

    reviews = (Review.query
               .filter_by(user_id=user_id)
               .order_by(Review.created_at.desc())
               .all())

    return jsonify({
        'id': user.id,
        'username': user.username,
        'bio': user.bio,
        'avatar_url': user.avatar_url,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'reviews': [review.to_dict() for review in reviews],
    })
