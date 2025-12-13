import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const APP_COUNT = 500;
const APP_TEMPLATE_DIR = 'app-template';
const APPS_DIR = 'apps';

async function buildAll() {
  console.log('Building all components for production...');

  // 1. Build Backend
  console.log('Building backend...');
  execSync('npm run build --workspace backend', { stdio: 'inherit' });
  console.log('Backend build complete.');

  // 2. Build Frontend
  console.log('Building frontend...');
  execSync('npm run build --workspace frontend', { stdio: 'inherit' });
  console.log('Frontend build complete.');

  // 3. Create and Build App Templates
  console.log('Creating and building app templates...');

  // Ensure apps directory exists
  if (!fs.existsSync(APPS_DIR)) {
    fs.mkdirSync(APPS_DIR);
  }

  for (let i = 1; i <= APP_COUNT; i++) {
    const appDir = path.join(APPS_DIR, `app-${i}`);
    const appName = `app-${i}`;

    // Create app directory if it doesn't exist
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir);
    }

    // Copy template files
    copyDirectory(APP_TEMPLATE_DIR, appDir);

    // Customize app (e.g., update package.json)
    customizeApp(appDir, appName);

    // Install dependencies and build the app
    console.log(`Building app: ${appName}...`);
    execSync('npm install', { cwd: appDir, stdio: 'inherit' });
    execSync('npm run build', { cwd: appDir, stdio: 'inherit' });
    console.log(`App ${appName} build complete.`);
  }

  console.log('All app templates created and built.');

  console.log('Build process complete.');
}

function copyDirectory(sourceDir: string, destDir: string) {
  fs.cpSync(sourceDir, destDir, { recursive: true });
}

function customizeApp(appDir: string, appName: string) {
  const packageJsonPath = path.join(appDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  packageJson.name = appName;
  packageJson.version = '1.0.0'; // Reset version for each app
  packageJson.description = `Subscription app ${appName}`;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // Example: Update a config file (if needed)
  const configFilePath = path.join(appDir, 'src', 'config.ts');
  if (fs.existsSync(configFilePath)) {
    let configFileContent = fs.readFileSync(configFilePath, 'utf-8');
    configFileContent = configFileContent.replace(/APP_NAME/g, appName); // Replace placeholder
    fs.writeFileSync(configFilePath, configFileContent);
  }
}

buildAll().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});