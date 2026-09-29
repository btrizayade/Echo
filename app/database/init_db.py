from app.database.database import Base, engine
from app.models.capture import Capture


def init_db():
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Echo database initialized.")