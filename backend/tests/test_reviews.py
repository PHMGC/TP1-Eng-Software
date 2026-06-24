"""Integration tests for routes/reviews.py."""


class TestListReviews:
    def test_empty(self, client):
        assert client.get('/api/reviews').get_json() == []

    def test_filters_by_game_and_user(self, client, auth, make_game):
        info = auth()
        game = make_game()
        client.post('/api/reviews',
                    json={'game_id': game.id, 'rating': 7}, headers=info['headers'])
        by_game = client.get(f'/api/reviews?game_id={game.id}').get_json()
        assert len(by_game) == 1
        by_user = client.get(f"/api/reviews?user_id={info['user']['id']}").get_json()
        assert len(by_user) == 1


class TestCreateReview:
    def test_requires_auth(self, client, make_game):
        game = make_game()
        assert client.post('/api/reviews', json={'game_id': game.id, 'rating': 5}).status_code == 401

    def test_requires_json_body(self, client, auth):
        assert client.post('/api/reviews', headers=auth()['headers']).status_code == 400

    def test_missing_required_fields(self, client, auth):
        h = auth()['headers']
        assert client.post('/api/reviews', json={'game_id': 1}, headers=h).status_code == 400

    def test_rating_out_of_range(self, client, auth, make_game):
        h = auth()['headers']
        game = make_game()
        assert client.post('/api/reviews',
                           json={'game_id': game.id, 'rating': 11}, headers=h).status_code == 400

    def test_non_numeric_rating(self, client, auth, make_game):
        """Regression: a non-numeric rating returns 400, not 500."""
        h = auth()['headers']
        game = make_game()
        resp = client.post('/api/reviews',
                           json={'game_id': game.id, 'rating': 'great'}, headers=h)
        assert resp.status_code == 400

    def test_game_not_found(self, client, auth):
        h = auth()['headers']
        assert client.post('/api/reviews',
                           json={'game_id': 999999, 'rating': 5}, headers=h).status_code == 404

    def test_create_then_update_existing(self, client, auth, make_game):
        h = auth()['headers']
        game = make_game()
        created = client.post('/api/reviews', json={
            'game_id': game.id, 'rating': 6, 'playtime_hours': 5, 'review_text': 'ok',
        }, headers=h)
        assert created.status_code == 201
        # Posting again for the same game updates the existing review (200, same id).
        updated = client.post('/api/reviews',
                              json={'game_id': game.id, 'rating': 9}, headers=h)
        assert updated.status_code == 200
        assert updated.get_json()['id'] == created.get_json()['id']
        assert updated.get_json()['rating'] == 9


class TestUpdateReview:
    def _create(self, client, headers, game_id):
        return client.post('/api/reviews',
                           json={'game_id': game_id, 'rating': 5}, headers=headers).get_json()

    def test_requires_auth(self, client, auth, make_game):
        review = self._create(client, auth()['headers'], make_game().id)
        assert client.put(f"/api/reviews/{review['id']}", json={'rating': 8}).status_code == 401

    def test_owner_can_update(self, client, auth, make_game):
        h = auth()['headers']
        review = self._create(client, h, make_game().id)
        resp = client.put(f"/api/reviews/{review['id']}",
                          json={'rating': 8, 'playtime_hours': 3, 'review_text': 'nice'},
                          headers=h)
        assert resp.status_code == 200 and resp.get_json()['rating'] == 8

    def test_non_owner_forbidden(self, client, auth, make_game):
        owner = auth(username='owner', email='owner@a.com')
        review = self._create(client, owner['headers'], make_game().id)
        other = auth(username='intruder', email='intruder@a.com')
        resp = client.put(f"/api/reviews/{review['id']}",
                          json={'rating': 1}, headers=other['headers'])
        assert resp.status_code == 403

    def test_invalid_rating(self, client, auth, make_game):
        h = auth()['headers']
        review = self._create(client, h, make_game().id)
        assert client.put(f"/api/reviews/{review['id']}",
                          json={'rating': 99}, headers=h).status_code == 400

    def test_missing_review(self, client, auth):
        assert client.put('/api/reviews/999999',
                          json={'rating': 5}, headers=auth()['headers']).status_code == 404


class TestDeleteReview:
    def _create(self, client, headers, game_id):
        return client.post('/api/reviews',
                           json={'game_id': game_id, 'rating': 5}, headers=headers).get_json()

    def test_owner_can_delete(self, client, auth, make_game):
        h = auth()['headers']
        review = self._create(client, h, make_game().id)
        assert client.delete(f"/api/reviews/{review['id']}", headers=h).status_code == 200

    def test_non_owner_forbidden(self, client, auth, make_game):
        owner = auth(username='o2', email='o2@a.com')
        review = self._create(client, owner['headers'], make_game().id)
        other = auth(username='i2', email='i2@a.com')
        assert client.delete(f"/api/reviews/{review['id']}",
                             headers=other['headers']).status_code == 403

    def test_missing_review(self, client, auth):
        assert client.delete('/api/reviews/999999', headers=auth()['headers']).status_code == 404


class TestUserReviewForGame:
    def test_requires_auth(self, client, make_game):
        assert client.get(f'/api/reviews/games/{make_game().id}/user-review').status_code == 401

    def test_not_found_when_no_review(self, client, auth, make_game):
        h = auth()['headers']
        assert client.get(f'/api/reviews/games/{make_game().id}/user-review',
                          headers=h).status_code == 404

    def test_returns_user_review(self, client, auth, make_game):
        """Regression for the GameDetails user-review endpoint URL."""
        h = auth()['headers']
        game = make_game()
        client.post('/api/reviews', json={'game_id': game.id, 'rating': 7}, headers=h)
        resp = client.get(f'/api/reviews/games/{game.id}/user-review', headers=h)
        assert resp.status_code == 200 and resp.get_json()['rating'] == 7


class TestReviewLike:
    def _create(self, client, headers, game_id):
        return client.post('/api/reviews',
                           json={'game_id': game_id, 'rating': 5}, headers=headers).get_json()

    def test_like_requires_auth(self, client, auth, make_game):
        review = self._create(client, auth()['headers'], make_game().id)
        assert client.post(f"/api/reviews/{review['id']}/like").status_code == 401

    def test_can_like_and_unlike_review(self, client, auth, make_game):
        owner = auth(username='r_owner', email='ro@a.com')
        review = self._create(client, owner['headers'], make_game().id)
        
        liker = auth(username='liker', email='liker@a.com')
        h = liker['headers']
        
        # Like
        resp = client.post(f"/api/reviews/{review['id']}/like", headers=h)
        assert resp.status_code == 200
        assert resp.get_json()['likes_count'] == 1
        
        # Like again
        resp2 = client.post(f"/api/reviews/{review['id']}/like", headers=h)
        assert resp2.status_code == 400
        
        # Unlike
        resp3 = client.delete(f"/api/reviews/{review['id']}/like", headers=h)
        assert resp3.status_code == 200
        assert resp3.get_json()['likes_count'] == 0
