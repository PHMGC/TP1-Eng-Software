from datetime import date, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from models import db, Game
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

import math
import json
from flask import request

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

@app.route('/api/games', methods=['GET'])
def get_games():
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))
    search = request.args.get('search', '').lower()
    sort_by = request.args.get('sort', 'top')
    
    games = Game.query.all()
    if search:
        games = [g for g in games if search in g.name.lower()]
        
    if sort_by == 'trending':
        six_months_ago = date.today() - timedelta(days=183)
        recent = [g for g in games if g.released and g.released >= six_months_ago]
        
        # Fallback to absolute recent releases sorted by date just in case DB doesn't have enough 6-months games
        if len(recent) < limit + offset:  
            recent = sorted([g for g in games if g.released], key=lambda x: x.released, reverse=True)[:limit+offset]
            
        games = recent
        
    games.sort(key=imdb_score, reverse=True)
    
    start = ((page - 1) * limit) + offset
    end = start + limit
    paginated = games[start:end]
    
    return jsonify({
        'data': [game.to_dict() for game in paginated],
        'total': len(games),
        'page': page,
        'pages': math.ceil((len(games) - offset) / limit) if limit > 0 else 1
    })

@app.route('/api/games/<int:game_id>', methods=['GET'])
def get_game(game_id):
    game = db.session.get(Game, game_id)
    if not game:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(game.to_dict())

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
