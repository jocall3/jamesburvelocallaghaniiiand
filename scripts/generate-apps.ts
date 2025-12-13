import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const NUMBER_OF_APPS = 500;
const APP_TEMPLATE_DIR = path.join(__dirname, '../app-template');
const APPS_DIR = path.join(__dirname, '../apps');

async function generateApp(appId: string) {
  const appDir = path.join(APPS_DIR, appId);

  // Copy the app template to the new app directory
  await fs.copy(APP_TEMPLATE_DIR, appDir);

  // Generate a unique app configuration
  const appConfig = {
    appId: appId,
    appName: `App ${appId}`,
    description: `A unique app instance with ID ${appId}.`,
    subscriptionPrice: Math.floor(Math.random() * 100) + 1, // Random price between 1 and 100
    apiKey: uuidv4(),
  };

  // Write the app configuration to a file
  const configFilePath = path.join(appDir, 'config.json');
  await fs.writeFile(configFilePath, JSON.stringify(appConfig, null, 2));

  // Update package.json with the new app name and ID
  const packageJsonPath = path.join(appDir, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);
  packageJson.name = `app-${appId}`;
  packageJson.description = appConfig.description;
  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

  console.log(`Generated app: ${appId}`);
}

async function main() {
  // Ensure the apps directory exists
  await fs.ensureDir(APPS_DIR);

  // Generate the apps
  for (let i = 0; i < NUMBER_OF_APPS; i++) {
    const appId = uuidv4();
    await generateApp(appId);
  }

  console.log(`Generated ${NUMBER_OF_APPS} apps in ${APPS_DIR}`);
}

main().catch(console.error);