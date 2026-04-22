#!/usr/bin/env python3
"""
Migration script to add Review table to the existing database.
Run this after updating models.py to add the Review model.
"""

from flask import Flask
from models import db, Review
import os

app = Flask(__name__)

# Use the same database configuration as app.py
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'games.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

if __name__ == '__main__':
    with app.app_context():
        print("Creating Review table...")
        db.create_all()
        print("Review table created successfully!")
        print("Migration completed!")