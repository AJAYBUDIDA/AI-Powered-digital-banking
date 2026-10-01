import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

MODEL_PATH = os.path.join(os.path.dirname(__file__), "fraud_model.joblib")

def generate_synthetic_data(num_samples=5000):
    """
    Generates synthetic transaction data for training the fraud detection model.
    Features:
    - amount: float (0.5 to 10000)
    - distance: float (0.1 to 1000) in km from home
    - hour: int (0 to 23) hour of day
    - frequency: int (1 to 20) number of transactions in last 24h
    """
    np.random.seed(42)
    
    # Generate normal transactions
    normal_samples = int(num_samples * 0.92)
    normal_amount = np.random.exponential(scale=80, size=normal_samples) + 1
    normal_distance = np.random.exponential(scale=15, size=normal_samples) + 0.1
    normal_hour = np.random.choice(range(24), size=normal_samples, p=[
        0.02, 0.01, 0.01, 0.01, 0.01, 0.02, 0.04, 0.06, 0.08, 0.08,
        0.07, 0.06, 0.06, 0.05, 0.05, 0.06, 0.07, 0.07, 0.06, 0.05,
        0.04, 0.04, 0.03, 0.02
    ]) # Normal distribution favoring waking hours
    normal_frequency = np.random.poisson(lam=3, size=normal_samples) + 1
    
    # Generate fraudulent transactions
    fraud_samples = num_samples - normal_samples
    fraud_amount = np.random.uniform(low=200, high=8000, size=fraud_samples)
    fraud_distance = np.random.uniform(low=80, high=900, size=fraud_samples)
    fraud_hour = np.random.choice([0, 1, 2, 3, 4, 5, 22, 23], size=fraud_samples) # nocturnal hours
    fraud_frequency = np.random.uniform(low=8, high=25, size=fraud_samples).astype(int)
    
    # Combine into lists
    amount = np.concatenate([normal_amount, fraud_amount])
    distance = np.concatenate([normal_distance, fraud_distance])
    hour = np.concatenate([normal_hour, fraud_hour])
    frequency = np.concatenate([normal_frequency, fraud_frequency])
    
    # Labels (0 = Normal, 1 = Fraud)
    is_fraud = np.concatenate([np.zeros(normal_samples), np.ones(fraud_samples)])
    
    # Create DataFrame and shuffle
    df = pd.DataFrame({
        'amount': amount,
        'distance': distance,
        'hour': hour,
        'frequency': frequency,
        'is_fraud': is_fraud
    })
    
    return df.sample(frac=1).reset_index(drop=True)

def train_and_save_model():
    """
    Trains a Random Forest model on synthetic data and saves it using joblib.
    """
    print("Generating synthetic data...")
    df = generate_synthetic_data(8000)
    
    X = df[['amount', 'distance', 'hour', 'frequency']]
    y = df['is_fraud']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    train_acc = model.score(X_train, y_train)
    test_acc = model.score(X_test, y_test)
    print(f"Model trained. Train Accuracy: {train_acc:.4f}, Test Accuracy: {test_acc:.4f}")
    
    # Save the model
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")
    return model

def load_model():
    """
    Loads the model if it exists, otherwise trains a new one.
    """
    if os.path.exists(MODEL_PATH):
        try:
            return joblib.load(MODEL_PATH)
        except Exception as e:
            print(f"Error loading model: {e}. Retraining...")
            return train_and_save_model()
    else:
        return train_and_save_model()

# Global Model Instance
model = None

def predict_fraud_risk(amount, distance, hour, frequency):
    """
    Predicts the risk of fraud for a transaction.
    Returns:
        risk_score (float): A value between 0.0 and 1.0 representing the fraud probability.
    """
    global model
    if model is None:
        model = load_model()
        
    features = pd.DataFrame([[amount, distance, hour, frequency]], 
                            columns=['amount', 'distance', 'hour', 'frequency'])
    
    # Get probability of class 1 (Fraud)
    probabilities = model.predict_proba(features)
    risk_score = float(probabilities[0][1])
    
    return risk_score

if __name__ == "__main__":
    # If run directly, train the model
    train_and_save_model()
