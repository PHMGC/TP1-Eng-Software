"""Integration tests for routes/auth.py."""


class TestRegister:
    def test_success(self, client):
        resp = client.post('/api/auth/register', json={
            'username': 'newuser', 'email': 'New@Example.com', 'password': 'pw12345',
        })
        assert resp.status_code == 201
        body = resp.get_json()
        assert body['username'] == 'newuser'
        assert body['email'] == 'new@example.com'  # normalised to lowercase
        assert 'password_hash' not in body

    def test_requires_json_body(self, client):
        assert client.post('/api/auth/register').status_code == 400

    def test_missing_fields(self, client):
        resp = client.post('/api/auth/register', json={'username': 'x'})
        assert resp.status_code == 400

    def test_duplicate_username(self, client):
        payload = {'username': 'dup', 'email': 'a@a.com', 'password': 'pw12345'}
        client.post('/api/auth/register', json=payload)
        resp = client.post('/api/auth/register',
                           json={**payload, 'email': 'b@b.com'})
        assert resp.status_code == 409

    def test_duplicate_email(self, client):
        client.post('/api/auth/register',
                    json={'username': 'u1', 'email': 'same@a.com', 'password': 'pw12345'})
        resp = client.post('/api/auth/register',
                           json={'username': 'u2', 'email': 'same@a.com', 'password': 'pw12345'})
        assert resp.status_code == 409


class TestLogin:
    def test_login_by_username(self, client, auth):
        info = auth(username='loginu', email='loginu@a.com', password='pw12345')
        assert 'token' in info and info['user']['username'] == 'loginu'

    def test_login_by_email(self, client):
        client.post('/api/auth/register',
                    json={'username': 'mailu', 'email': 'mail@a.com', 'password': 'pw12345'})
        resp = client.post('/api/auth/login', json={'email': 'mail@a.com', 'password': 'pw12345'})
        assert resp.status_code == 200
        assert resp.get_json()['user']['username'] == 'mailu'

    def test_wrong_password(self, client):
        client.post('/api/auth/register',
                    json={'username': 'wp', 'email': 'wp@a.com', 'password': 'pw12345'})
        resp = client.post('/api/auth/login', json={'username': 'wp', 'password': 'nope'})
        assert resp.status_code == 401

    def test_unknown_user(self, client):
        resp = client.post('/api/auth/login', json={'username': 'ghost', 'password': 'x'})
        assert resp.status_code == 401

    def test_missing_body_and_fields(self, client):
        assert client.post('/api/auth/login').status_code == 400
        assert client.post('/api/auth/login', json={'username': 'x'}).status_code == 400


class TestCurrentUser:
    def test_me_requires_auth(self, client):
        assert client.get('/api/auth/me').status_code == 401

    def test_me_returns_user(self, client, auth):
        info = auth()
        resp = client.get('/api/auth/me', headers=info['headers'])
        assert resp.status_code == 200
        assert resp.get_json()['username'] == info['user']['username']


class TestDeleteAccount:
    def test_delete_requires_auth(self, client):
        assert client.delete('/api/auth/me').status_code == 401

    def test_delete_removes_user(self, client, auth):
        info = auth()
        assert client.delete('/api/auth/me', headers=info['headers']).status_code == 200
        # Token is still well-formed but the user no longer exists -> 401.
        assert client.get('/api/auth/me', headers=info['headers']).status_code == 401

    def test_delete_account_with_library_wishlist_and_review(self, client, auth, make_game):
        """Regression: deleting an account that has library items must succeed."""
        info = auth()
        game = make_game()
        h = info['headers']
        client.post('/api/wishlist', json={'game_id': game.id}, headers=h)
        client.post('/api/library', json={'game_id': game.id}, headers=h)
        client.post('/api/reviews', json={'game_id': game.id, 'rating': 8}, headers=h)

        resp = client.delete('/api/auth/me', headers=h)
        assert resp.status_code == 200


class TestUpdateUser:
    def test_update_requires_auth(self, client):
        assert client.put('/api/auth/me', json={'bio': 'test'}).status_code == 401

    def test_update_profile(self, client, auth):
        info = auth()
        h = info['headers']
        
        resp = client.put('/api/auth/me', json={
            'bio': 'A cool bio',
            'avatar_url': 'http://example.com/avatar.png'
        }, headers=h)
        
        assert resp.status_code == 200
        body = resp.get_json()
        assert body['bio'] == 'A cool bio'
        assert body['avatar_url'] == 'http://example.com/avatar.png'
        
        # Verify it persisted
        resp2 = client.get('/api/auth/me', headers=h)
        assert resp2.get_json()['bio'] == 'A cool bio'
