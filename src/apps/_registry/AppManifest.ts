/**
 * @file Defines the TypeScript schema for application manifests (`manifest.json`).
 *
 * This manifest file is the central piece of metadata for any application
 * intended to run within the Sovereign system. It provides the system with
 * essential information for launching, displaying, and managing the app.
 */

/**
 * Defines the primary category of the application.
 * This is used for organization and discovery in the app marketplace.
 */
export enum AppCategory {
  GAMES = 'Games',
  PRODUCTIVITY = 'Productivity',
  UTILITIES = 'Utilities',
  SOCIAL = 'Social',
  DEVELOPER_TOOLS = 'Developer Tools',
  FINANCE = 'Finance',
  BANKING = 'Banking',
  FINTECH = 'FinTech',
  REGTECH = 'RegTech',
  CREATIVITY = 'Creativity',
  SYSTEM = 'System',
  OTHER = 'Other',
}

/**
 * Defines the fundamental type of the application package.
 */
export enum AppType {
  /** A standard application with a graphical user interface. */
  WEB_APP = 'web-app',
  /** A command-line interface application. */
  CLI_APP = 'cli-app',
  /** A background process or daemon with no primary UI. */
  SERVICE = 'service',
  /** A component that extends the functionality of the host or other apps. */
  PLUGIN = 'plugin',
}

/**
 * Represents the author or organization behind an application.
 */
export interface AppAuthor {
  /** The name of the author or organization. */
  name: string;
  /** An optional contact email address. */
  email?: string;
  /** An optional URL to the author's website or profile. */
  url?: string;
}

/**
 * A flexible type for defining the permissions an application requests.
 * The keys are permission identifiers (e.g., "fs:read", "notifications"),
 * and the values can be a boolean, a string, or a configuration object
 * to specify the scope of the permission.
 *
 * @example
 * {
 *   "notifications": true,
 *   "fs:read": "/home/user/Documents",
 *   "api:http": { "allowedHosts": ["api.example.com"] }
 * }
 */
export type AppPermissions = {
  [permissionName: string]: boolean | string | Record<string, unknown>;
};

/**
 * The core schema for an application manifest (`manifest.json`).
 */
export interface AppManifest {
  /**
   * A globally unique identifier for the app, in reverse domain name notation.
   * This field is immutable once the app is published.
   * @example "com.sovereign.system-settings"
   */
  id: string;

  /**
   * The human-readable name of the application.
   * @example "System Settings"
   */
  name: string;

  /**
   * The version of the application, preferably following Semantic Versioning (SemVer).
   * @example "1.0.0"
   */
  version: string;

  /**
   * A short, one-sentence description of what the application does.
   */
  description: string;

  /**
   * The fundamental type of the application.
   */
  type: AppType;

  /**
   * The relative path to the main entry point file for the application.
   * For `web-app` types, this is typically the root HTML file.
   * @example "index.html"
   */
  entrypoint: string;

  /**
   * A relative path to the application's primary icon file from the app's root directory.
   * The icon should ideally be an SVG or a high-resolution PNG (e.g., 512x512).
   * @example "assets/icon.svg"
   */
  icon: string;

  /**
   * Information about the author or organization that created the app.
   */
  author: AppAuthor;

  /**
   * The license under which the application is distributed.
   * Must be a valid SPDX license identifier.
   * @example "MIT"
   * @see https://spdx.org/licenses/
   */
  license: string;

  /**
   * A more detailed description of the application. Can be in Markdown format.
   * Used in the app marketplace details view.
   * @optional
   */
  longDescription?: string;

  /**
   * A list of relative paths to screenshots showcasing the application.
   * @optional
   */
  screenshots?: string[];

  /**
   * The primary category the application belongs to.
   * @optional
   */
  category?: AppCategory;

  /**
   * A list of keywords or tags to aid in app discovery.
   * @optional
   * @example ["settings", "system", "configuration"]
   */
  tags?: string[];

  /**
   * A URL to the application's official homepage or documentation.
   * @optional
   */
  homepage?: string;

  /**
   * A URL to the application's source code repository.
   * @optional
   * @example "https://github.com/my-org/my-app"
   */
  repository?: string;

  /**
   * An identifier for a suite of applications that this app belongs to.
   * This helps group related applications from the same publisher or for a
   * unified ecosystem.
   * @optional
   * @example "com.citibankdemobusinessinc.open-banking-suite"
   */
  suite?: string;

  /**
   * A declaration of the permissions required by the application to function.
   * The host system will use this to create a sandboxed environment and prompt
   * the user for consent. If not specified, the app runs with the most
   * restrictive permissions (e.g., no network or file system access).
   * @optional
   */
  permissions?: AppPermissions;
}