import app from './app';
import dotenv from 'dotenv';
import { connectDB } from './config/database'; // Assuming a database connection utility

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 3000;

/**
 * Initializes and starts the Node.js server.
 * This function performs the following steps:
 * 1. Connects to the database (if configured).
 * 2. Starts the Express application to listen for incoming HTTP requests.
 * 3. Logs server status and potential errors.
 */
const startServer = async () => {
  try {
    // Attempt to connect to the database.
    // This is crucial for many of the described APIs which would likely
    // store configuration, cached data, or processed results.
    await connectDB();
    console.log('Database connected successfully.');

    // Start the Express application, listening on the specified port.
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Access API at http://localhost:${PORT}/api/v1`); // Assuming a common API base path
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    // Exit the process with a non-zero status code to indicate an error
    process.exit(1);
  }
};

// Execute the server startup function
startServer();