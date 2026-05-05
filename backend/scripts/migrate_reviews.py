"""Migration script to add Review table to the existing database."""
from app import create_app
from models import db

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        print("Creating Review table...")
        db.create_all()
        print("Migration completed!")
