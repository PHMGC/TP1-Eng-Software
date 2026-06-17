"""Shared pytest fixtures for the backend test suite.

Each test runs against a fresh in-memory SQLite database (StaticPool keeps a
single connection alive so the schema persists for the duration of the test),
so tests never touch the real games.db.
"""
import os
import sys

# Make the backend package importable (so `import app`, `from models import ...`
# resolve the same way they do when running `python app.py`).
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import jwt
import pytest
from sqlalchemy.pool import StaticPool
from werkzeug.security import generate_password_hash

from app import create_app
from models import db, Game, Genre, User


TEST_CONFIG = {
    'SQLALCHEMY_DATABASE_URI': 'sqlite://',  # in-memory
    'SQLALCHEMY_ENGINE_OPTIONS': {
        'connect_args': {'check_same_thread': False},
        'poolclass': StaticPool,
    },
    'TESTING': True,
    'SECRET_KEY': 'test-secret',
    'JWT_EXPIRATION_DELTA': 3600,
}


@pytest.fixture
def app():
    application = create_app(TEST_CONFIG)
    with application.app_context():
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def make_game(app):
    """Factory that persists a Game (optionally with genres) and returns it."""
    def _make(name='The Game', slug=None, genres=None, **kwargs):
        if slug is None:
            slug = name.lower().replace(' ', '-')
        game = Game(slug=slug, name=name, **kwargs)
        if genres:
            game.genres = [Genre(name=g, slug=g.lower()) for g in genres]
        db.session.add(game)
        db.session.commit()
        return game
    return _make


@pytest.fixture
def make_user(app):
    """Factory that persists a User directly in the DB."""
    def _make(username='alice', email='alice@example.com', password='secret123'):
        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
        )
        db.session.add(user)
        db.session.commit()
        return user
    return _make


@pytest.fixture
def auth(client):
    """Register + log a user in through the API.

    Returns a dict with the auth `headers`, the `user` payload and the `token`.
    """
    def _auth(username='tester', email='tester@example.com', password='secret123'):
        client.post(
            '/api/auth/register',
            json={'username': username, 'email': email, 'password': password},
        )
        resp = client.post(
            '/api/auth/login',
            json={'username': username, 'password': password},
        )
        body = resp.get_json()
        token = body['token']
        return {
            'headers': {'Authorization': f'Bearer {token}'},
            'user': body['user'],
            'token': token,
        }
    return _auth


@pytest.fixture
def expired_token(app):
    """A syntactically valid JWT whose expiry is in the past."""
    from datetime import datetime, timedelta
    payload = {
        'sub': '1',
        'id': '1',
        'username': 'ghost',
        'exp': datetime.utcnow() - timedelta(hours=1),
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
