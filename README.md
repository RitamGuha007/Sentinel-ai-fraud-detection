
# Sentinel AI - Fraud Detection & Transaction Risk Analytics

Sentinel AI is a full-stack machine learning application that analyzes financial transactions and predicts potential fraudulent activity using a Random Forest classification model.

The platform provides real-time transaction analysis, risk classification, CSV batch prediction, and a dashboard for viewing prediction results.

## Features

- Machine learning-based fraud detection
- Random Forest classification model with 100 trees
- Real-time transaction prediction through a FastAPI backend
- Fraud probability and risk-level classification
- CSV upload for batch transaction analysis
- Low, Medium, and High risk categorization
- SQLite database for storing prediction records
- React-based interactive frontend
- REST API integration between frontend and backend
- Model evaluation using precision, recall, F1-score, and confusion matrix

## Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- CSS

### Backend
- Python
- FastAPI
- Uvicorn
- SQLite

### Machine Learning
- Scikit-learn
- Pandas
- NumPy
- Random Forest Classifier
- Joblib

## Machine Learning Model

The model is trained using the Credit Card Fraud Detection dataset.

The dataset contains anonymized transaction features, including:

- Time
- V1 to V28 principal components
- Amount
- Class (target variable)

The model uses 30 input features to predict whether a transaction is potentially fraudulent.

### Evaluation Metrics

The model is evaluated using:

- Precision
- Recall
- F1-score
- Confusion matrix

The fraud detection model is designed for experimentation and educational purposes using an anonymized dataset.

## Application Workflow

1. A user selects a transaction scenario or uploads a CSV file.
2. The frontend sends transaction data to the FastAPI backend.
3. The backend processes the input using the trained machine learning model.
4. The model generates a fraud probability.
5. The application assigns a risk classification.
6. The prediction result is displayed on the frontend.
7. Prediction records can be stored in the SQLite database.

## Project Structure

```text
AI Fraud Detection Platform/
│
├── backend/
│   ├── main.py
│   └── database.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   └── package.json
│
├── model/
│   ├── creditcard.csv
│   ├── train_model.py
│   ├── create_test_csv.py
│   ├── fraud_detection_model.pkl
│   └── mixed_test_transactions.csv
│
├── tests/
├── requirements.txt
├── fraud_detection.db
└── README.md
```

## How to Run the Project

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd "AI Fraud Detection Platform"
```

### 2. Activate the virtual environment

On Windows:

```bash
venv\Scripts\activate
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the backend

```bash
uvicorn backend.main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

### 5. Start the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at the local URL provided by Vite.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check backend status |
| POST | `/predict` | Predict fraud risk for one transaction |
| POST | `/predict-csv` | Analyze transactions from a CSV file |
| GET | `/predictions` | Retrieve stored prediction records |

Interactive API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

## Important Note

This project uses anonymized credit card transaction data and is intended for learning, experimentation, and portfolio demonstration.

It is not connected to a real bank, payment gateway, or live financial transaction system. The displayed risk classifications are machine learning predictions and should not be treated as confirmed fraud decisions.

## Future Improvements

- Add authentication and user management
- Improve fraud detection for imbalanced datasets
- Add model monitoring and performance tracking
- Deploy the application using AWS
- Implement CI/CD pipelines
- Add explainable AI for model predictions
- Support more understandable transaction features
- Add automated testing and security improvements

## Author

Ritam Guha

B.Tech - Computer Science and Engineering (AI & ML)