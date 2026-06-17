"""Unit tests for utils/helpers.py."""
from datetime import date, datetime
from types import SimpleNamespace

import pytest

from models import db, Genre, Platform
from utils.helpers import (
    wasted_score,
    parse_date,
    parse_datetime,
    find_or_create_relation,
    apply_game_data,
)


class TestWastedScore:
    def test_none_values_yield_zero(self):
        game = SimpleNamespace(rating=None, playtime=None)
        assert wasted_score(game) == 0

    def test_rating_and_playtime_bonus(self):
        game = SimpleNamespace(rating=4, playtime=20)
        # 4 * 1.5 + min(2.5, 20/20) = 6 + 1 = 7
        assert wasted_score(game) == 7

    def test_playtime_bonus_is_capped_at_2_5(self):
        game = SimpleNamespace(rating=5, playtime=10_000)
        # 5 * 1.5 + min(2.5, 500) = 7.5 + 2.5 = 10
        assert wasted_score(game) == 10


class TestParseDate:
    def test_valid_iso_date(self):
        assert parse_date('2020-01-15') == date(2020, 1, 15)

    def test_empty_and_none(self):
        assert parse_date('') is None
        assert parse_date(None) is None

    def test_invalid_string(self):
        assert parse_date('not-a-date') is None

    def test_datetime_is_reduced_to_date(self):
        assert parse_date(datetime(2021, 5, 6, 10, 30)) == date(2021, 5, 6)


class TestParseDatetime:
    @pytest.mark.parametrize('value', [
        '2020-01-15T10:30:00',
        '2020-01-15 10:30:00',
        '2020-01-15T10:30:00.500000',
    ])
    def test_supported_formats(self, value):
        assert isinstance(parse_datetime(value), datetime)

    def test_invalid_and_empty(self):
        assert parse_datetime('garbage') is None
        assert parse_datetime(None) is None

    def test_datetime_passthrough(self):
        dt = datetime(2022, 2, 2, 2, 2, 2)
        assert parse_datetime(dt) == dt


class TestFindOrCreateRelation:
    def test_invalid_payload_raises(self, app):
        with pytest.raises(ValueError):
            find_or_create_relation(Genre, None)
        with pytest.raises(ValueError):
            find_or_create_relation(Genre, 'not-a-dict')

    def test_finds_existing_by_id(self, app):
        genre = Genre(name='RPG', slug='rpg')
        db.session.add(genre)
        db.session.commit()
        found = find_or_create_relation(Genre, {'id': genre.id})
        assert found is genre

    def test_finds_existing_by_slug(self, app):
        genre = Genre(name='Action', slug='action')
        db.session.add(genre)
        db.session.commit()
        found = find_or_create_relation(Genre, {'slug': 'action'})
        assert found is genre

    def test_creates_new_when_missing(self, app):
        created = find_or_create_relation(Platform, {'name': 'PC', 'slug': 'pc'})
        db.session.commit()
        assert created.id is not None
        assert created.name == 'PC'


class TestApplyGameData:
    def test_applies_scalar_fields_and_dates(self, make_game):
        game = make_game()
        apply_game_data(game, {
            'name': 'Updated Name',
            'rating': 4.5,
            'playtime': 30,
            'released': '2019-09-09',
            'updated': '2020-01-01T00:00:00',
        })
        db.session.commit()
        assert game.name == 'Updated Name'
        assert game.rating == 4.5
        assert game.released == date(2019, 9, 9)
        assert game.updated == datetime(2020, 1, 1, 0, 0, 0)

    def test_applies_relations_and_screenshots(self, make_game):
        game = make_game()
        apply_game_data(game, {
            'genres': [{'name': 'Indie', 'slug': 'indie'}],
            'platforms': [{'name': 'PC', 'slug': 'pc'}],
            'tags': [{'name': 'Co-op', 'slug': 'co-op'}],
            'screenshots': [{'image_url': 'http://img/1.jpg'}, {'no_url': True}],
        })
        db.session.commit()
        assert [g.name for g in game.genres] == ['Indie']
        assert [p.name for p in game.platforms] == ['PC']
        assert [t.name for t in game.tags] == ['Co-op']
        # Only the screenshot that actually has an image_url is kept.
        assert [s.image_url for s in game.screenshots] == ['http://img/1.jpg']
