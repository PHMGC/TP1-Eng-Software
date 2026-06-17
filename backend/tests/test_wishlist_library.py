"""Integration tests for routes/wishlist.py and routes/library.py.

Both blueprints share the same shape, so they are parametrised over the
base path.
"""
import pytest


@pytest.fixture(params=['/api/wishlist', '/api/library'])
def base(request):
    return request.param


class TestCollection:
    def test_get_requires_auth(self, client, base):
        assert client.get(base).status_code == 401

    def test_get_empty(self, client, auth, base):
        assert client.get(base, headers=auth()['headers']).get_json() == []

    def test_add_requires_auth(self, client, base, make_game):
        assert client.post(base, json={'game_id': make_game().id}).status_code == 401

    def test_add_requires_game_id(self, client, auth, base):
        assert client.post(base, json={}, headers=auth()['headers']).status_code == 400

    def test_add_game_not_found(self, client, auth, base):
        resp = client.post(base, json={'game_id': 999999}, headers=auth()['headers'])
        assert resp.status_code == 404

    def test_add_success_and_listed(self, client, auth, base, make_game):
        h = auth()['headers']
        game = make_game(name='Wanted')
        resp = client.post(base, json={'game_id': game.id}, headers=h)
        assert resp.status_code == 201
        listing = client.get(base, headers=h).get_json()
        assert len(listing) == 1
        assert listing[0]['game']['name'] == 'Wanted'

    def test_add_duplicate_conflict(self, client, auth, base, make_game):
        h = auth()['headers']
        game = make_game()
        client.post(base, json={'game_id': game.id}, headers=h)
        dup = client.post(base, json={'game_id': game.id}, headers=h)
        assert dup.status_code == 409

    def test_remove_missing_entry(self, client, auth, base, make_game):
        h = auth()['headers']
        assert client.delete(f'{base}/{make_game().id}', headers=h).status_code == 404

    def test_remove_success(self, client, auth, base, make_game):
        h = auth()['headers']
        game = make_game()
        client.post(base, json={'game_id': game.id}, headers=h)
        assert client.delete(f'{base}/{game.id}', headers=h).status_code == 200
        assert client.get(base, headers=h).get_json() == []
