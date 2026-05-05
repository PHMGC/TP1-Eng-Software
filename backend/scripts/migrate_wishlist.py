"""Migration script to add User and Wishlist tables to the existing database."""
from app import create_app
from models import db, User

app = create_app()


def create_sample_user():
    existing_user = User.query.filter_by(username='demo_user').first()
    if existing_user:
        print("Sample user 'demo_user' already exists.")
        return existing_user

    sample_user = User(
        username='demo_user',
        email='demo@wastedhours.com',
        password_hash='demo_hash'
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
        create_sample_user()
        print("Migration completed!")
