from datetime import datetime, timedelta
from functools import wraps
import jwt
from flask import request, g, jsonify, current_app
from models import User


def generate_token(user):
    payload = {
        'sub': str(user.id),
        'id': str(user.id),
        'username': user.username,
        'exp': datetime.utcnow() + timedelta(seconds=current_app.config['JWT_EXPIRATION_DELTA'])
    }
    token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')
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
            current_app.config['SECRET_KEY'],
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
