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

	# New Details Fields
	description = db.Column(db.Text, nullable=True)
	description_raw = db.Column(db.Text, nullable=True)
	developers = db.Column(db.JSON, nullable=True)
	publishers = db.Column(db.JSON, nullable=True)

	# Relationships
	platforms = db.relationship('Platform', secondary=game_platforms, backref='games')
	genres = db.relationship('Genre', secondary=game_genres, backref='games')
	tags = db.relationship('Tag', secondary=game_tags, backref='games')
	screenshots = db.relationship('Screenshot', backref='game', lazy=True)

	def to_dict(self):
		return {
			'id': self.id,
			'slug': self.slug,
			'name': self.name,
			'released': self.released.isoformat() if self.released else None,
			'tba': self.tba,
			'background_image': self.background_image,
			'rating': self.rating,
			'rating_top': self.rating_top,
			'metacritic': self.metacritic,
			'playtime': self.playtime,
			'updated': self.updated.isoformat() if self.updated else None,
			'esrb_rating': self.esrb_rating,
			'ratings_distribution': self.ratings_distribution,
			'added_by_status': self.added_by_status,
			'platforms': [platform.to_dict() for platform in self.platforms],
			'genres': [genre.to_dict() for genre in self.genres],
			'tags': [tag.to_dict() for tag in self.tags],
			'screenshots': [screenshot.to_dict() for screenshot in self.screenshots],
			'description': self.description,
			'description_raw': self.description_raw,
			'developers': self.developers,
			'publishers': self.publishers
		}

class Platform(db.Model):
	__tablename__ = 'platforms'
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(100), nullable=False)
	slug = db.Column(db.String(100), nullable=False)

	def to_dict(self):
		return {
			'id': self.id,
			'name': self.name,
			'slug': self.slug
		}

class Genre(db.Model):
	__tablename__ = 'genres'
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(100), nullable=False)
	slug = db.Column(db.String(100), nullable=False)

	def to_dict(self):
		return {
			'id': self.id,
			'name': self.name,
			'slug': self.slug
		}

class Tag(db.Model):
	__tablename__ = 'tags'
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(100), nullable=False)
	slug = db.Column(db.String(100), nullable=False)
	language = db.Column(db.String(10))

	def to_dict(self):
		return {
			'id': self.id,
			'name': self.name,
			'slug': self.slug,
			'language': self.language
		}

class Screenshot(db.Model):
	__tablename__ = 'screenshots'
	id = db.Column(db.Integer, primary_key=True) # Can be internal or RAWG ID
	game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
	image_url = db.Column(db.String(500), nullable=False)

	def to_dict(self):
		return {
			'id': self.id,
			'game_id': self.game_id,
			'image_url': self.image_url
		}

class User(db.Model):
	__tablename__ = 'users'
	id = db.Column(db.Integer, primary_key=True)
	username = db.Column(db.String(100), unique=True, nullable=False)
	email = db.Column(db.String(255), unique=True, nullable=False)
	password_hash = db.Column(db.String(255), nullable=False)
	created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

	# Relationships
	wishlist_items = db.relationship('Wishlist', backref='user', lazy=True)
	library_items = db.relationship('Library', backref='user', lazy=True)

	def to_dict(self):
		return {
			'id': self.id,
			'username': self.username,
			'email': self.email,
			'created_at': self.created_at.isoformat() if self.created_at else None
		}

class Wishlist(db.Model):
	__tablename__ = 'wishlist'
	id = db.Column(db.Integer, primary_key=True)
	user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
	game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
	added_at = db.Column(db.DateTime, default=db.func.current_timestamp())

	# Relationships
	game = db.relationship('Game', backref='wishlist_entries')

	def to_dict(self):
		return {
			'id': self.id,
			'user_id': self.user_id,
			'game_id': self.game_id,
			'added_at': self.added_at.isoformat() if self.added_at else None,
			'game': self.game.to_dict() if self.game else None
		}

class Library(db.Model):
	__tablename__ = 'library'
	id = db.Column(db.Integer, primary_key=True)
	user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
	game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
	added_at = db.Column(db.DateTime, default=db.func.current_timestamp())

	# Relationships
	game = db.relationship('Game', backref='library_entries')

	def to_dict(self):
		return {
			'id': self.id,
			'user_id': self.user_id,
			'game_id': self.game_id,
			'added_at': self.added_at.isoformat() if self.added_at else None,
			'game': self.game.to_dict() if self.game else None
		}

class Review(db.Model):
	__tablename__ = 'reviews'
	id = db.Column(db.Integer, primary_key=True)
	user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
	game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
	rating = db.Column(db.Float, nullable=False)  # 1-10 scale
	playtime_hours = db.Column(db.Integer, nullable=True)
	review_text = db.Column(db.Text, nullable=True)
	created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
	updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

	# Relationships
	user = db.relationship('User', backref='reviews')
	game = db.relationship('Game', backref='reviews')

	def to_dict(self):
		return {
			'id': self.id,
			'user_id': self.user_id,
			'game_id': self.game_id,
			'rating': self.rating,
			'playtime_hours': self.playtime_hours,
			'review_text': self.review_text,
			'created_at': self.created_at.isoformat() if self.created_at else None,
			'updated_at': self.updated_at.isoformat() if self.updated_at else None,
			'user': {
				'id': self.user.id,
				'username': self.user.username
			} if self.user else None
		}