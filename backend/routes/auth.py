from flask import Blueprint, jsonify, request, g
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User
from utils.auth import generate_token, login_required, get_authenticated_user

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/register', methods=['POST'])
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


@auth_bp.route('/login', methods=['POST'])
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


@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    return jsonify(g.current_user.to_dict())


@auth_bp.route('/me', methods=['DELETE'])
@login_required
def delete_current_user():
    """Delete the current authenticated user account."""
    try:
        from models import Review, Wishlist

        Review.query.filter_by(user_id=g.current_user.id).delete()
        Wishlist.query.filter_by(user_id=g.current_user.id).delete()

        db.session.delete(g.current_user)
        db.session.commit()

        return jsonify({'message': 'Account deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete account'}), 500
