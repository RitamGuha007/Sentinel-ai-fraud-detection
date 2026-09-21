
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "fraud_detection.db"


def init_db():
    """Create the predictions table if it does not already exist."""
    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            fraud_probability REAL,
            prediction INTEGER,
            result TEXT,
            risk_level TEXT
        )
    """)

    connection.commit()
    connection.close()