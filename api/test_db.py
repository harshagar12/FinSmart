from database import engine, Base
from models import User, Holding, Transaction

try:
    Base.metadata.create_all(bind=engine)
    print("SUCCESS: Tables created or verified.")
except Exception as e:
    print(f"ERROR: {e}")
