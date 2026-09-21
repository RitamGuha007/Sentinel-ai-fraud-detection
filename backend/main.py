
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import io
import joblib
import pandas as pd

from backend.database import init_db, DB_PATH
import sqlite3


# ==========================================
# Create FastAPI application
# ==========================================

app = FastAPI(title="AI Fraud Detection API")


# ==========================================
# Enable CORS for frontend integration
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# Project paths
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "model" / "fraud_detection_model.pkl"


# ==========================================
# Initialize database on startup
# ==========================================

@app.on_event("startup")
def on_startup():
    init_db()


# ==========================================
# Load the trained Random Forest model
# ==========================================

model = joblib.load(MODEL_PATH)


# ==========================================
# Feature names used by the dataset
# ==========================================

FEATURE_NAMES = [
    "Time",
    "V1",
    "V2",
    "V3",
    "V4",
    "V5",
    "V6",
    "V7",
    "V8",
    "V9",
    "V10",
    "V11",
    "V12",
    "V13",
    "V14",
    "V15",
    "V16",
    "V17",
    "V18",
    "V19",
    "V20",
    "V21",
    "V22",
    "V23",
    "V24",
    "V25",
    "V26",
    "V27",
    "V28",
    "Amount",
]


# ==========================================
# Request data format
# ==========================================

class TransactionData(BaseModel):
    features: list[float]


# ==========================================
# Save prediction to SQLite database
# ==========================================

def save_prediction(fraud_probability, prediction, result, risk_level):
    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO predictions (
            fraud_probability,
            prediction,
            result,
            risk_level
        )
        VALUES (?, ?, ?, ?)
    """, (
        fraud_probability,
        prediction,
        result,
        risk_level
    ))

    connection.commit()
    connection.close()


# ==========================================
# Home endpoint
# ==========================================

@app.get("/")
def home():
    return {
        "message": "AI Fraud Detection API is running!",
        "status": "online",
        "version": "1.0.0"
    }

# Get saved predictions from the database
@app.get("/predictions")
def get_predictions():

    connection = sqlite3.connect(DB_PATH)

    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            id,
            fraud_probability,
            prediction,
            result,
            risk_level
        FROM predictions
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    connection.close()

    predictions = []

    for row in rows:
        predictions.append({
            "id": row[0],
            "fraud_probability": row[1],
            "prediction": row[2],
            "result": row[3],
            "risk_level": row[4]
        })

    return {
        "total_predictions": len(predictions),
        "predictions": predictions
    }    


# ==========================================
# Fraud prediction endpoint
# ==========================================

@app.post("/predict")
def predict_fraud(transaction: TransactionData):

    # Check that exactly 30 features are provided
    if len(transaction.features) != 30:
        raise HTTPException(
            status_code=400,
            detail="Transaction must contain exactly 30 features."
        )

    # Convert input into a DataFrame with original feature names
    input_data = pd.DataFrame(
        [transaction.features],
        columns=FEATURE_NAMES
    )

    # Get fraud probability
    fraud_probability = model.predict_proba(input_data)[0][1]

    # Selected classification threshold
    threshold = 0.60

    # Make prediction
    prediction = int(fraud_probability >= threshold)

    # Determine risk level
    if fraud_probability >= 0.60:
        risk_level = "High"
    elif fraud_probability >= 0.30:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # Determine the result
    result = "Fraudulent" if prediction == 1 else "Legitimate"

    # Save prediction to SQLite database
    try:
        save_prediction(
            float(fraud_probability),
            prediction,
            result,
            risk_level
        )
    except Exception as e:
        # Log but don't crash the API if DB save fails
        print(f"Warning: Could not save to DB: {e}")

    # Return prediction results
    return {
        "fraud_probability": round(float(fraud_probability), 4),
        "prediction": prediction,
        "result": result,
        "risk_level": risk_level
    }
@app.post("/predict-csv")
async def predict_csv(file: UploadFile = File(...)):
    # Read uploaded CSV file
    contents = await file.read()
    data = pd.read_csv(io.BytesIO(contents))
    data = data.head(100)

    # Check whether all required features exist
    missing_columns = [
        feature for feature in FEATURE_NAMES
        if feature not in data.columns
    ]

    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=f"Missing columns: {missing_columns}"
        )

    # Select only the required model features
    input_data = data[FEATURE_NAMES]

    # Generate fraud probabilities
    probabilities = model.predict_proba(input_data)[:, 1]

    results = []

    for probability in probabilities:
        if probability >= 0.60:
            risk_level = "High"
        elif probability >= 0.30:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        results.append({
            "fraud_probability": round(float(probability), 4),
            "risk_level": risk_level
        })

    return {
        "total_transactions": len(results),
        "results": results
    }    