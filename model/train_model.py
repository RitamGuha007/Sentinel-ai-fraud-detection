import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score
)

# Load dataset
data = pd.read_csv("model/creditcard.csv")

# Separate features and target
X = data.drop("Class", axis=1)
y = data["Class"]

# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("Training samples:", len(X_train))
print("Testing samples:", len(X_test))

print("\nTraining fraud cases:", y_train.sum())
print("Testing fraud cases:", y_test.sum())

# Create the Random Forest model
model = RandomForestClassifier(
    n_estimators=100,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)
# Train the model
print("\nTraining the model...")
model.fit(X_train, y_train)

print("Model training completed!")
# Save the trained model
joblib.dump(model, "model/fraud_detection_model.pkl")

print("Model saved successfully!")

# Get fraud probabilities
y_prob = model.predict_proba(X_test)[:, 1]

threshold = 0.6

# Convert probabilities into predictions
y_pred = (y_prob >= threshold).astype(int)

print(f"\nResults for threshold: {threshold}")

# Display classification report
print("\nClassification Report:")
print(classification_report(
    y_test,
    y_pred,
    zero_division=0
))

# Display confusion matrix
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# Calculate fraud-class metrics
precision = precision_score(y_test, y_pred, zero_division=0)
recall = recall_score(y_test, y_pred, zero_division=0)
f1 = f1_score(y_test, y_pred, zero_division=0)

print(f"Fraud Precision: {precision:.4f}")
print(f"Fraud Recall: {recall:.4f}")
print(f"Fraud F1-score: {f1:.4f}")