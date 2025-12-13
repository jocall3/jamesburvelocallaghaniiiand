import { execSync } from 'child_process';
import { join } from 'path';

const projectRoot = process.cwd();
const backendDir = join(projectRoot, 'backend');
const frontendDir = join(projectRoot, 'frontend');
const dbDir = join(projectRoot, 'database');

console.log('Starting development services...');

try {
  // Start Backend
  console.log('Starting backend...');
  execSync('npm run dev', { cwd: backendDir, stdio: 'inherit' });
  console.log('Backend started.');

  // Start Frontend
  console.log('Starting frontend...');
  execSync('npm run dev', { cwd: frontendDir, stdio: 'inherit' });
  console.log('Frontend started.');

  // Start Database (assuming a simple setup, adjust if more complex)
  // This might involve starting a Docker container or a local DB instance.
  // For demonstration, we'll assume a command to start a local DB.
  // Replace with your actual database startup command.
  console.log('Starting database...');
  // Example: execSync('docker-compose up -d db', { cwd: dbDir, stdio: 'inherit' });
  // Or if you have a local script: execSync('npm run start:db', { cwd: dbDir, stdio: 'inherit' });
  console.log('Database startup command executed. Please ensure your database is running.');

  console.log('All development services are running.');
} catch (error) {
  console.error('Error starting development services:', error);
  process.exit(1);
}