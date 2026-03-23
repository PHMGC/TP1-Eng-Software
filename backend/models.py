from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSON # Use generic JSON if not using Postgres

db = SQLAlchemy()

# Association Tables for Many-to-Many relationships
game_platforms = db.Table('game_platforms',
	db.Column('game_id', db.Integer, db.ForeignKey('games.id'), primary_key=True),
	db.Column('platform_id', db.Integer, db.ForeignKey('platforms.id'), primary_key=True)
)

game_genres = db.Table('game_genres',
	db.Column('game_id', db.Integer, db.ForeignKey('games.id'), primary_key=True),
	db.Column('genre_id', db.Integer, db.ForeignKey('genres.id'), primary_key=True)
)

game_tags = db.Table('game_tags',
	db.Column('game_id', db.Integer, db.ForeignKey('games.id'), primary_key=True),
	db.Column('tag_id', db.Integer, db.ForeignKey('tags.id'), primary_key=True)
)

class Game(db.Model):
	__tablename__ = 'games'

	id = db.Column(db.Integer, primary_key=True) # RAWG ID
	slug = db.Column(db.String(255), unique=True, nullable=False)
	name = db.Column(db.String(255), nullable=False)
	released = db.Column(db.Date, nullable=True)
	tba = db.Column(db.Boolean, default=False)
	background_image = db.Column(db.String(500))
	rating = db.Column(db.Float)
	rating_top = db.Column(db.Integer)
	metacritic = db.Column(db.Integer, nullable=True)
	playtime = db.Column(db.Integer) # in hours
	updated = db.Column(db.DateTime)
	
	# Complex data stored as JSON
	ratings_distribution = db.Column(db.JSON) # Stores the list of rating counts/percents
	added_by_status = db.Column(db.JSON) # Stores yet, owned, beaten, etc.
	
	# ESRB Rating (Flat relationship as it's usually one per game)
	esrb_rating = db.Column(db.String(50), nullable=True)

	# Relationships
	platforms = db.relationship('Platform', secondary=game_platforms, backref='games')
	genres = db.relationship('Genre', secondary=game_genres, backref='games')
	tags = db.relationship('Tag', secondary=game_tags, backref='games')
	screenshots = db.relationship('Screenshot', backref='game', lazy=True)

class Platform(db.Model):
	__tablename__ = 'platforms'
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(100), nullable=False)
	slug = db.Column(db.String(100), nullable=False)

class Genre(db.Model):
	__tablename__ = 'genres'
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(100), nullable=False)
	slug = db.Column(db.String(100), nullable=False)

class Tag(db.Model):
	__tablename__ = 'tags'
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(100), nullable=False)
	slug = db.Column(db.String(100), nullable=False)
	language = db.Column(db.String(10))

class Screenshot(db.Model):
	__tablename__ = 'screenshots'
	id = db.Column(db.Integer, primary_key=True) # Can be internal or RAWG ID
	game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
	image_url = db.Column(db.String(500), nullable=False)