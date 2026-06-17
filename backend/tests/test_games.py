"""Integration tests for routes/games.py."""
from datetime import date, timedelta


def test_status(client):
    resp = client.get('/api/status')
    assert resp.status_code == 200
    assert resp.get_json()['status'] == 'success'


class TestListGames:
    def test_empty(self, client):
        body = client.get('/api/games').get_json()
        assert body['data'] == [] and body['total'] == 0

    def test_returns_games(self, client, make_game):
        make_game(name='Alpha')
        make_game(name='Beta')
        body = client.get('/api/games').get_json()
        assert body['total'] == 2

    def test_search_filter(self, client, make_game):
        make_game(name='Zelda')
        make_game(name='Mario')
        body = client.get('/api/games?search=zel').get_json()
        assert [g['name'] for g in body['data']] == ['Zelda']

    def test_genre_filter(self, client, make_game):
        make_game(name='RPG Game', genres=['RPG'])
        make_game(name='Race Game', genres=['Racing'])
        body = client.get('/api/games?genre=rpg').get_json()
        assert [g['name'] for g in body['data']] == ['RPG Game']

    def test_rating_and_playtime_filters(self, client, make_game):
        make_game(name='Low', rating=2.0, playtime=5)
        make_game(name='High', rating=4.8, playtime=60)
        names = [g['name'] for g in client.get('/api/games?minRating=4').get_json()['data']]
        assert names == ['High']
        names = [g['name'] for g in client.get('/api/games?minPlaytime=40').get_json()['data']]
        assert names == ['High']

    def test_sorting_variants(self, client, make_game):
        make_game(name='Bbb', rating=3.0, playtime=10)
        make_game(name='Aaa', rating=5.0, playtime=50)
        for sort in ['rating_desc', 'rating_asc', 'name_asc', 'name_desc',
                     'playtime_desc', 'playtime_asc', 'wasted_score', 'trending', 'top_rated']:
            assert client.get(f'/api/games?sort={sort}').status_code == 200
        top = client.get('/api/games?sort=rating_desc').get_json()['data']
        assert top[0]['name'] == 'Aaa'

    def test_pagination(self, client, make_game):
        for i in range(3):
            make_game(name=f'Game{i}')
        body = client.get('/api/games?limit=2&page=1').get_json()
        assert len(body['data']) == 2 and body['pages'] == 2

    def test_invalid_numeric_params_do_not_500(self, client, make_game):
        make_game(name='X')
        assert client.get('/api/games?page=abc&limit=xyz&offset=foo').status_code == 200


class TestSearchAndFilterEndpoints:
    def test_search_requires_query(self, client):
        assert client.get('/api/games/search').status_code == 400

    def test_search_endpoint(self, client, make_game):
        make_game(name='Halo')
        assert client.get('/api/games/search?query=hal').get_json()['total'] == 1

    def test_filter_endpoint(self, client, make_game):
        make_game(name='G', genres=['Indie'])
        assert client.get('/api/games/filter?genre=indie').status_code == 200
        assert client.get('/api/games/filter?platform=pc&minPlaytime=1').status_code == 200

    def test_top_rated(self, client, make_game):
        make_game(name='G', rating=4.0)
        assert client.get('/api/games/top-rated').status_code == 200

    def test_trending(self, client, make_game):
        make_game(name='Recent', rating=4.0, released=date.today() - timedelta(days=10))
        assert client.get('/api/games/trending').status_code == 200


class TestTopKByPeriod:
    def test_valid(self, client, make_game):
        make_game(name='Old', rating=4.0, released=date(2018, 6, 1))
        resp = client.get('/api/games/top-k-by-period'
                          '?k=5&start_year=2018&start_month=1&end_year=2018&end_month=12')
        assert resp.status_code == 200
        assert resp.get_json()['returned'] == 1

    def test_missing_params(self, client):
        assert client.get('/api/games/top-k-by-period?k=5').status_code == 400

    def test_invalid_month(self, client):
        assert client.get('/api/games/top-k-by-period'
                          '?start_year=2018&start_month=13&end_year=2018&end_month=12'
                          ).status_code == 400

    def test_k_below_one(self, client):
        assert client.get('/api/games/top-k-by-period'
                          '?k=0&start_year=2018&start_month=1&end_year=2018&end_month=2'
                          ).status_code == 400

    def test_non_numeric_k_falls_back(self, client):
        resp = client.get('/api/games/top-k-by-period'
                          '?k=abc&start_year=2018&start_month=1&end_year=2018&end_month=12')
        assert resp.status_code == 200


class TestGenresAndDetail:
    def test_genres(self, client, make_game):
        make_game(name='G', genres=['RPG'])
        assert client.get('/api/genres').status_code == 200

    def test_get_game(self, client, make_game):
        game = make_game(name='Detail')
        assert client.get(f'/api/games/{game.id}').get_json()['name'] == 'Detail'

    def test_get_missing_game(self, client):
        assert client.get('/api/games/999999').status_code == 404


class TestCreateUpdateDelete:
    def test_create_requires_auth(self, client):
        assert client.post('/api/games', json={'slug': 's', 'name': 'n'}).status_code == 401

    def test_create_success_with_full_payload(self, client, auth):
        h = auth()['headers']
        resp = client.post('/api/games', json={
            'slug': 'full', 'name': 'Full Game', 'rating': 4.2, 'playtime': 12,
            'released': '2020-01-01', 'updated': '2020-02-02T00:00:00',
            'genres': [{'name': 'Indie', 'slug': 'indie'}],
            'platforms': [{'name': 'PC', 'slug': 'pc'}],
            'tags': [{'name': 'Co-op', 'slug': 'co-op', 'language': 'eng'}],
            'screenshots': [{'image_url': 'http://img/1.jpg'}],
        }, headers=h)
        assert resp.status_code == 201
        body = resp.get_json()
        assert body['genres'][0]['name'] == 'Indie'
        assert body['screenshots'][0]['image_url'] == 'http://img/1.jpg'

    def test_create_missing_fields(self, client, auth):
        h = auth()['headers']
        assert client.post('/api/games', json={'slug': 'x'}, headers=h).status_code == 400

    def test_create_duplicate_slug(self, client, auth, make_game):
        make_game(name='Existing', slug='dup-slug')
        h = auth()['headers']
        resp = client.post('/api/games', json={'slug': 'dup-slug', 'name': 'n'}, headers=h)
        assert resp.status_code == 409

    def test_update_requires_auth(self, client, make_game):
        game = make_game()
        assert client.put(f'/api/games/{game.id}', json={'name': 'x'}).status_code == 401

    def test_update_success(self, client, auth, make_game):
        game = make_game(name='Before')
        h = auth()['headers']
        resp = client.put(f'/api/games/{game.id}', json={'name': 'After'}, headers=h)
        assert resp.status_code == 200 and resp.get_json()['name'] == 'After'

    def test_update_missing_game(self, client, auth):
        h = auth()['headers']
        assert client.put('/api/games/999999', json={'name': 'x'}, headers=h).status_code == 404

    def test_update_slug_conflict(self, client, auth, make_game):
        make_game(name='A', slug='slug-a')
        game_b = make_game(name='B', slug='slug-b')
        h = auth()['headers']
        resp = client.put(f'/api/games/{game_b.id}', json={'slug': 'slug-a'}, headers=h)
        assert resp.status_code == 409

    def test_delete_requires_auth(self, client, make_game):
        game = make_game()
        assert client.delete(f'/api/games/{game.id}').status_code == 401

    def test_delete_success(self, client, auth, make_game):
        game = make_game()
        h = auth()['headers']
        assert client.delete(f'/api/games/{game.id}', headers=h).status_code == 200
        assert client.get(f'/api/games/{game.id}').status_code == 404

    def test_delete_missing_game(self, client, auth):
        h = auth()['headers']
        assert client.delete('/api/games/999999', headers=h).status_code == 404
