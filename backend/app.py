from flask import Flask, jsonify
from flask_cors import CORS
from models import db, Game
import math
import json
import os

app = Flask(__name__)

# Configuração do Banco de Dados SQLite
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'games.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializa o banco de dados e CORS
db.init_app(app)
CORS(app)

# Cria as tabelas no banco de dados, caso não existam
with app.app_context():
    db.create_all()

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        "status": "success",
        "message": "A API Flask está rodando corretamente!",
        "database": "SQLite conectado"
    })

<<<<<<< Updated upstream
=======

def get_total_ratings(game):
    if not game.ratings_distribution: return 0
    try:
        dist = game.ratings_distribution
        if isinstance(dist, str):
            dist = json.loads(dist)
        return sum(r.get('count', 0) for r in dist)
    except:
        return 0

def imdb_score(game):
    v = get_total_ratings(game)
    R = game.rating or 0
    if v == 0:
        return R * 0.1
    C = 3.5
    m = 500
    return (v / (v + m)) * R + (m / (v + m)) * C

>>>>>>> Stashed changes
@app.route('/api/games', methods=['GET'])
def get_games():
    # Retorna os jogos armazenados no nosso banco de dados local
    games = Game.query.order_by(Game.rating.desc()).limit(50).all() # Retorna os 50 melhores como exemplo
    return jsonify([game.to_dict() for game in games])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
