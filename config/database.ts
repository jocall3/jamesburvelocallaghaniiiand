import { DataSource } from 'typeorm';

// Define your database connection configuration
const AppDataSource = new DataSource({
  type: 'postgres', // Or 'mysql', 'sqlite', 'mongodb', etc.
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'app_subscriptions',
  synchronize: process.env.NODE_ENV !== 'production', // Set to false in production
  logging: process.env.NODE_ENV !== 'production', // Log queries in development
  entities: [__dirname + '/../modules/**/*.entity.{js,ts}'], // Path to your entities
  migrations: [__dirname + '/../database/migrations/**/*.{js,ts}'], // Path to your migrations
  cli: {
    entitiesDir: 'src/modules',
    migrationsDir: 'src/database/migrations',
  },
});

// Initialize the data source
AppDataSource.initialize()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch((error) => {
    console.error('Error during database initialization:', error);
    process.exit(1); // Exit if database connection fails
  });

export default AppDataSource;