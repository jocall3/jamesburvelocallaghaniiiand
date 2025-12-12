import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, roc_curve
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import logging
import os
import json

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Constants
MODEL_NAME = "fraud_detection_model.joblib"
METRICS_FILE = "metrics.json"
ARTIFACTS_DIR = "artifacts" # Directory to store model and metrics
DATA_FILE = "data/fraud_detection_data.csv" # Path to the training data

# Ensure artifacts directory exists
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

def load_data(file_path):
    """Loads data from a CSV file."""
    try:
        df = pd.read_csv(file_path)
        logging.info(f"Data loaded successfully from {file_path}")
        return df
    except FileNotFoundError:
        logging.error(f"File not found: {file_path}")
        raise
    except Exception as e:
        logging.error(f"Error loading data: {e}")
        raise

def preprocess_data(df):
    """Preprocesses the data: handles missing values, encodes categorical features, etc."""
    try:
        # Handle missing values (example: fill with mean)
        for col in df.columns:
            if df[col].isnull().any():
                if pd.api.types.is_numeric_dtype(df[col]):
                    df[col].fillna(df[col].mean(), inplace=True)
                    logging.info(f"Filled missing values in column '{col}' with mean.")
                else:
                    df[col].fillna(df[col].mode()[0], inplace=True) # Fill with mode for categorical
                    logging.info(f"Filled missing values in column '{col}' with mode.")

        # Encode categorical features (example: one-hot encoding)
        categorical_cols = [col for col in df.columns if df[col].dtype == 'object']
        df = pd.get_dummies(df, columns=categorical_cols, dummy_na=False) # dummy_na=False to avoid creating extra columns for NaN
        logging.info(f"Encoded categorical columns: {categorical_cols}")

        return df
    except Exception as e:
        logging.error(f"Error preprocessing data: {e}")
        raise

def split_data(df, target_column, test_size=0.2, random_state=42):
    """Splits the data into training and testing sets."""
    try:
        X = df.drop(target_column, axis=1)
        y = df[target_column]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=random_state)
        logging.info(f"Data split into training and testing sets (test_size={test_size}, random_state={random_state})")
        return X_train, X_test, y_train, y_test
    except KeyError:
        logging.error(f"Target column '{target_column}' not found in DataFrame.")
        raise
    except Exception as e:
        logging.error(f"Error splitting data: {e}")
        raise

def train_model(X_train, y_train, n_estimators=100, random_state=42):
    """Trains the Random Forest model."""
    try:
        model = RandomForestClassifier(n_estimators=n_estimators, random_state=random_state)
        model.fit(X_train, y_train)
        logging.info(f"Model trained successfully (n_estimators={n_estimators}, random_state={random_state})")
        return model
    except Exception as e:
        logging.error(f"Error training model: {e}")
        raise

def evaluate_model(model, X_test, y_test):
    """Evaluates the model and generates metrics."""
    try:
        y_pred = model.predict(X_test)
        y_proba = model.predict_proba(X_test)[:, 1]  # Probabilities for the positive class

        # Calculate metrics
        confusion = confusion_matrix(y_test, y_pred)
        classification_rep = classification_report(y_test, y_pred, output_dict=True)
        roc_auc = roc_auc_score(y_test, y_proba)

        logging.info("Model evaluation completed.")

        return confusion, classification_rep, roc_auc
    except Exception as e:
        logging.error(f"Error evaluating model: {e}")
        raise

def plot_roc_curve(model, X_test, y_test, file_path):
    """Plots the ROC curve and saves it to a file."""
    try:
        y_proba = model.predict_proba(X_test)[:, 1]
        fpr, tpr, thresholds = roc_curve(y_test, y_proba)

        plt.figure(figsize=(8, 6))
        plt.plot(fpr, tpr, label=f'ROC curve (AUC = {roc_auc_score(y_test, y_proba):.2f})')
        plt.plot([0, 1], [0, 1], 'k--')
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title('Receiver Operating Characteristic (ROC) Curve')
        plt.legend()
        plt.savefig(file_path)
        plt.close() # Close the plot to free memory
        logging.info(f"ROC curve plot saved to {file_path}")
    except Exception as e:
        logging.error(f"Error plotting ROC curve: {e}")
        raise

def save_model(model, file_path):
    """Saves the trained model to a file."""
    try:
        joblib.dump(model, file_path)
        logging.info(f"Model saved to {file_path}")
    except Exception as e:
        logging.error(f"Error saving model: {e}")
        raise

def save_metrics(confusion, classification_rep, roc_auc, file_path):
    """Saves the evaluation metrics to a JSON file."""
    try:
        metrics = {
            "confusion_matrix": confusion.tolist(),  # Convert to list for JSON serialization
            "classification_report": classification_rep,
            "roc_auc": roc_auc
        }
        with open(file_path, 'w') as f:
            json.dump(metrics, f, indent=4)
        logging.info(f"Metrics saved to {file_path}")
    except Exception as e:
        logging.error(f"Error saving metrics: {e}")
        raise

def main():
    """Main function to train, evaluate, and save the model."""
    try:
        # Load data
        df = load_data(DATA_FILE)

        # Preprocess data
        df = preprocess_data(df)

        # Split data
        X_train, X_test, y_train, y_test = split_data(df, target_column='isFraud')

        # Train model
        model = train_model(X_train, y_train)

        # Evaluate model
        confusion, classification_rep, roc_auc = evaluate_model(model, X_test, y_test)

        # Save model
        model_path = os.path.join(ARTIFACTS_DIR, MODEL_NAME)
        save_model(model, model_path)

        # Save metrics
        metrics_path = os.path.join(ARTIFACTS_DIR, METRICS_FILE)
        save_metrics(confusion, classification_rep, roc_auc, metrics_path)

        # Plot and save ROC curve
        roc_curve_path = os.path.join(ARTIFACTS_DIR, "roc_curve.png")
        plot_roc_curve(model, X_test, y_test, roc_curve_path)

        logging.info("Training process completed successfully.")

    except Exception as e:
        logging.error(f"An error occurred during the training process: {e}")

if __name__ == "__main__":
    main()