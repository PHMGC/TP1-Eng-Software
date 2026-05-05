from flask import Flask
from flask_cors import CORS
import os
from models import db
from routes.games import games_bp
from routes.auth import auth_bp
from routes.wishlist import wishlist_bp
from routes.library import library_bp
from routes.reviews import reviews_bp


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'super-secret-key-for-dev')
    app.config['JWT_EXPIRATION_DELTA'] = int(os.environ.get('JWT_EXPIRATION_DELTA', 86400))

    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'games.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    CORS(app)

    with app.app_context():
        db.create_all()

    app.register_blueprint(games_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(wishlist_bp)
    app.register_blueprint(library_bp)
    app.register_blueprint(reviews_bp)

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
