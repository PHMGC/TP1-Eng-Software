from flask import Flask, jsonify
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

@app.route('/api/games', methods=['GET'])
def get_games():
    # Retorna os jogos armazenados no nosso banco de dados local
    games = Game.query.order_by(Game.rating.desc()).limit(50).all() # Retorna os 50 melhores como exemplo
    return jsonify([game.to_dict() for game in games])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
