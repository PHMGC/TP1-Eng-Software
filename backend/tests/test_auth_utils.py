"""Unit tests for utils/auth.py (token generation and authentication)."""
import jwt
from werkzeug.security import generate_password_hash

from models import db, User
from utils.auth import generate_token, get_authenticated_user


def _user(username='bob'):
    user = User(
        username=username,
        email=f'{username}@example.com',
        password_hash=generate_password_hash('pw'),
    )
    db.session.add(user)
    db.session.commit()
    return user


def test_generate_token_roundtrip(app):
    user = _user()
    token = generate_token(user)
    payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
    assert payload['sub'] == str(user.id)
    assert payload['username'] == 'bob'


def test_no_authorization_header(app):
    with app.test_request_context('/'):
        assert get_authenticated_user() is None


def test_wrong_auth_scheme(app):
    with app.test_request_context('/', headers={'Authorization': 'Token abc'}):
        assert get_authenticated_user() is None


def test_valid_token_returns_user(app):
    user = _user()
    token = generate_token(user)
    with app.test_request_context('/', headers={'Authorization': f'Bearer {token}'}):
        assert get_authenticated_user().id == user.id


def test_expired_token_returns_none(app, expired_token):
    with app.test_request_context('/', headers={'Authorization': f'Bearer {expired_token}'}):
        assert get_authenticated_user() is None


def test_malformed_token_returns_none(app):
    with app.test_request_context('/', headers={'Authorization': 'Bearer not.a.jwt'}):
        assert get_authenticated_user() is None


def test_token_without_subject_returns_none(app):
    token = jwt.encode({'username': 'x'}, app.config['SECRET_KEY'], algorithm='HS256')
    with app.test_request_context('/', headers={'Authorization': f'Bearer {token}'}):
        assert get_authenticated_user() is None


def test_integer_subject_is_accepted(app):
    """sub may already be an int (not a str): the isdigit() branch is skipped."""
    user = _user()
    token = jwt.encode({'sub': user.id}, app.config['SECRET_KEY'], algorithm='HS256')
    with app.test_request_context('/', headers={'Authorization': f'Bearer {token}'}):
        assert get_authenticated_user().id == user.id
