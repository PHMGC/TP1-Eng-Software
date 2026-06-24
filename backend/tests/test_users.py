"""Integration tests for routes/users.py (public user profile)."""


class TestPublicUserProfile:
    def test_returns_public_fields(self, client, auth):
        info = auth(username='alice', email='alice@a.com')
        user_id = info['user']['id']

        body = client.get(f'/api/users/{user_id}').get_json()
        assert body['id'] == user_id
        assert body['username'] == 'alice'
        assert 'bio' in body
        assert 'avatar_url' in body
        assert 'created_at' in body

    def test_does_not_expose_email(self, client, auth):
        """The public profile must never leak the user's email."""
        info = auth(username='private', email='private@a.com')
        body = client.get(f"/api/users/{info['user']['id']}").get_json()
        assert 'email' not in body

    def test_includes_user_reviews(self, client, auth, make_game):
        info = auth(username='reviewer', email='reviewer@a.com')
        game = make_game()
        client.post('/api/reviews',
                    json={'game_id': game.id, 'rating': 8}, headers=info['headers'])

        body = client.get(f"/api/users/{info['user']['id']}").get_json()
        assert len(body['reviews']) == 1
        assert body['reviews'][0]['rating'] == 8

    def test_no_reviews_returns_empty_list(self, client, auth):
        info = auth(username='lurker', email='lurker@a.com')
        body = client.get(f"/api/users/{info['user']['id']}").get_json()
        assert body['reviews'] == []

    def test_missing_user_returns_404(self, client):
        assert client.get('/api/users/999999').status_code == 404
