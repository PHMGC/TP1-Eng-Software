#!/usr/bin/env python3
"""
Migration script to add User and Wishlist tables to the existing database.
Run this after updating models.py to add the new tables.
"""

from flask import Flask
from models import db, User, Wishlist
import os

app = Flask(__name__)

# Use the same database configuration as app.py
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'games.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

def create_sample_user():
    """Create a sample user for testing wishlist functionality."""
    with app.app_context():
        # Check if user already exists
        existing_user = User.query.filter_by(username='demo_user').first()
        if existing_user:
            print("Sample user 'demo_user' already exists.")
            return existing_user

        # Create sample user
        sample_user = User(
            username='demo_user',
            email='demo@wastedhours.com',
            password_hash='demo_hash'  # In a real app, this would be properly hashed
        )
        db.session.add(sample_user)
        db.session.commit()
        print("Created sample user 'demo_user' with ID:", sample_user.id)
        return sample_user

if __name__ == '__main__':
    with app.app_context():
        print("Creating User and Wishlist tables...")
        db.create_all()
        print("Tables created successfully!")

        # Create sample user
        create_sample_user()

        print("Migration completed!")