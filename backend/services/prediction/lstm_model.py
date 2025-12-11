import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split

class LSTMModel:
    def __init__(self, input_shape, output_dim=1, lookback=60, dropout_rate=0.2, lstm_units=[50, 50]):
        """
        Initializes the LSTMModel.

        Args:
            input_shape (tuple): The shape of the input data (timesteps, features).
            output_dim (int): The number of output features to predict. Defaults to 1.
            lookback (int): The number of previous time steps to use for prediction.
            dropout_rate (float): The dropout rate for regularization.
            lstm_units (list): A list of integers specifying the number of units in each LSTM layer.
        """
        self.input_shape = input_shape
        self.output_dim = output_dim
        self.lookback = lookback
        self.dropout_rate = dropout_rate
        self.lstm_units = lstm_units
        self.model = self._build_model()
        self.scaler = MinMaxScaler(feature_range=(0, 1)) # For scaling data

    def _build_model(self):
        """
        Builds the LSTM model architecture.
        """
        model = Sequential()

        # Add LSTM layers
        for i, units in enumerate(self.lstm_units):
            if i == 0:
                model.add(LSTM(units=units, return_sequences=True, input_shape=self.input_shape))
            elif i == len(self.lstm_units) - 1:
                model.add(LSTM(units=units, return_sequences=False))
            else:
                model.add(LSTM(units=units, return_sequences=True))
            model.add(Dropout(self.dropout_rate))

        # Add output layer
        model.add(Dense(units=self.output_dim))

        # Compile the model
        model.compile(optimizer='adam', loss='mean_squared_error')
        return model

    def prepare_data(self, data, target_column):
        """
        Prepares the data for LSTM training. This involves scaling and creating sequences.

        Args:
            data (pd.DataFrame): DataFrame containing historical financial data.
            target_column (str): The name of the column to predict.

        Returns:
            tuple: A tuple containing (X, y, scaler_y) where:
                   X is the feature data, y is the target data, and scaler_y is the scaler used for y.
        """
        # Ensure data is sorted by date
        data = data.sort_values('Date') # Assuming 'Date' is a column

        # Scale the data
        # We scale the target column separately to invert the transformation later
        scaled_data = self.scaler.fit_transform(data[[target_column]])
        data_features = data.drop(columns=[target_column]).values # Other features are not scaled here. Consider scaling them if they are numerical.

        # Create sequences
        X, y = [], []
        for i in range(self.lookback, len(scaled_data)):
            X.append(scaled_data[i-self.lookback:i, 0])
            y.append(scaled_data[i, 0])

        X = np.array(X)
        y = np.array(y)

        # Reshape X to be [samples, time steps, features]
        # For simplicity, we are assuming only the target column is used for sequence creation.
        # If you have multiple features, you'll need to adjust this.
        # Assuming input_shape is (lookback, 1) for now if only using target column for sequences.
        if self.input_shape[1] == 1:
            X = np.reshape(X, (X.shape[0], X.shape[1], 1))
        else:
            # If you use multiple features in your sequences, adjust data preparation
            # For example, scale all numerical features and then form sequences.
            # This part needs careful implementation based on your actual dataset structure.
            print("Warning: Multi-feature sequence preparation not fully implemented. Assuming single feature for now.")
            X = np.reshape(X, (X.shape[0], X.shape[1], 1))


        return X, y, self.scaler # Return the fitted scaler for the target column

    def train(self, X_train, y_train, epochs=50, batch_size=32, validation_split=0.1):
        """
        Trains the LSTM model.

        Args:
            X_train (np.array): Training input data.
            y_train (np.array): Training target data.
            epochs (int): Number of training epochs.
            batch_size (int): Batch size for training.
            validation_split (float): Fraction of the training data to be used as validation data.
        """
        print("Starting model training...")
        history = self.model.fit(X_train, y_train, epochs=epochs, batch_size=batch_size, validation_split=validation_split, verbose=1)
        print("Model training finished.")
        return history

    def predict(self, X_predict, scaler_y):
        """
        Makes predictions using the trained LSTM model.

        Args:
            X_predict (np.array): Input data for prediction.
            scaler_y (MinMaxScaler): The scaler used for the target variable during training.

        Returns:
            np.array: The unscaled predictions.
        """
        print("Making predictions...")
        predictions_scaled = self.model.predict(X_predict)
        predictions = scaler_y.inverse_transform(predictions_scaled)
        print("Predictions complete.")
        return predictions

    def save_model(self, filepath):
        """
        Saves the trained model to a file.

        Args:
            filepath (str): The path to save the model.
        """
        self.model.save(filepath)
        print(f"Model saved to {filepath}")

    def load_model(self, filepath):
        """
        Loads a pre-trained model from a file.

        Args:
            filepath (str): The path to load the model from.
        """
        self.model = tf.keras.models.load_model(filepath)
        print(f"Model loaded from {filepath}")

    def evaluate(self, X_test, y_test, scaler_y):
        """
        Evaluates the model on test data.

        Args:
            X_test (np.array): Test input data.
            y_test (np.array): Test target data.
            scaler_y (MinMaxScaler): The scaler used for the target variable during training.

        Returns:
            dict: A dictionary containing evaluation metrics (e.g., 'loss').
        """
        print("Evaluating model...")
        loss = self.model.evaluate(X_test, y_test, verbose=0)
        print(f"Test Loss: {loss}")
        return {'loss': loss}

# Example Usage (demonstration purposes - would typically be in a separate script)
if __name__ == '__main__':
    # Create dummy data
    dates = pd.date_range(start='2020-01-01', periods=1000, freq='D')
    data = pd.DataFrame({
        'Date': dates,
        'Close': np.random.rand(1000) * 100 + 50, # Simulate stock prices
        'Volume': np.random.randint(10000, 500000, 1000)
    })

    # Add some trend and noise
    data['Close'] = data['Close'].cumsum() + np.random.randn(1000) * 5

    # Define model parameters
    LOOKBACK = 60
    TARGET_COLUMN = 'Close'
    INPUT_SHAPE = (LOOKBACK, 1) # Assuming we are only using the 'Close' price for sequence generation for simplicity

    # Instantiate the model
    model_instance = LSTMModel(input_shape=INPUT_SHAPE, lookback=LOOKBACK, lstm_units=[100, 100], dropout_rate=0.3)

    # Prepare data
    X, y, scaler_y = model_instance.prepare_data(data.copy(), TARGET_COLUMN) # Use copy to avoid modifying original df

    # Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, shuffle=False)

    # Train the model
    history = model_instance.train(X_train, y_train, epochs=10, batch_size=32, validation_split=0.1)

    # Make predictions
    predictions = model_instance.predict(X_test, scaler_y)

    # Evaluate the model
    evaluation_metrics = model_instance.evaluate(X_test, y_test, scaler_y)

    # Print some results
    print("\nSample Predictions vs Actual:")
    for i in range(5):
        print(f"Predicted: {predictions[i][0]:.2f}, Actual: {scaler_y.inverse_transform([[y_test[i]]])[0][0]:.2f}")

    # Save and load the model (optional)
    # model_instance.save_model('lstm_financial_model.h5')
    # loaded_model = LSTMModel(input_shape=INPUT_SHAPE, lookback=LOOKBACK) # Re-initialize model to load weights
    # loaded_model.load_model('lstm_financial_model.h5')
    # print("\nModel reloaded and prediction with loaded model:")
    # loaded_predictions = loaded_model.predict(X_test, scaler_y)
    # print(f"First loaded prediction: {loaded_predictions[0][0]:.2f}")

```