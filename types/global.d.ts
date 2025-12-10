/**
 * Global TypeScript declaration file for common types, interfaces, and module augmentations
 * used across the entire application.
 *
 * This file should be referenced in `tsconfig.json` under `include` or `files`.
 */

// ===========================================================================
// Global Utility Types
// ===========================================================================

/**
 * Represents a unique identifier, typically a string UUID or a number.
 */
type ID = string;

/**
 * Represents a timestamp, either as a Unix epoch number or an ISO 8601 string.
 */
type Timestamp = number | string;

/**
 * Makes a type's properties nullable.
 * @template T The type to make nullable.
 */
type Nullable<T> = T | null;

/**
 * Makes all properties in an object type optional and recursively applies this to nested objects.
 * Useful for partial updates or configuration.
 * @template T The type to make deep partial.
 */
type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Extracts the union of all possible values from an object type.
 * @template T The object type.
 */
type ValueOf<T> = T[keyof T];

/**
 * Represents a generic API response structure.
 * @template T The type of the data payload.
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
  error?: {
    code: string;
    details?: string;
  };
}

/**
 * Represents a generic API error structure.
 */
interface ApiError {
  success: false;
  message: string;
  statusCode: number;
  error: {
    code: string;
    details?: string;
  };
}

// ===========================================================================
// Core Application-Specific Types
// ===========================================================================

/**
 * Union type for identifiers of major tech companies.
 * This list can be expanded as needed based on integration targets.
 */
type TechCompanyIdentifier =
  | 'Google'
  | 'Microsoft'
  | 'Apple'
  | 'Amazon'
  | 'Meta' // Facebook
  | 'X' // Twitter
  | 'Salesforce'
  | 'Adobe'
  | 'SAP'
  | 'Oracle'
  | 'IBM'
  | 'NVIDIA'
  | 'Tesla'
  | 'Netflix'
  | 'OpenAI'
  | 'Anthropic'
  | 'Databricks'
  | 'Snowflake'
  | 'Stripe'
  | 'PayPal'
  | 'Shopify'
  | 'Zoom'
  | 'Slack'
  | 'Atlassian'
  | 'ServiceNow'
  | 'Workday'
  | 'VMware'
  | 'Cisco'
  | 'HP'
  | 'Dell'
  | 'Intel'
  | 'Qualcomm'
  | 'Broadcom'
  | 'TSMC'
  | 'Samsung'
  | 'LG'
  | 'Sony'
  | 'Panasonic'
  | 'Tencent'
  | 'Alibaba'
  | 'Baidu'
  | 'JD.com'
  | 'ByteDance' // TikTok
  | 'Huawei'
  | 'Xiaomi'
  | 'Lenovo'
  | 'Spotify'
  | 'Pinterest'
  | 'Reddit'
  | 'Discord'
  | 'Twitch'
  | 'Roblox'
  | 'Epic Games'
  | 'Unity'
  | 'Valve'
  | 'Nintendo'
  | 'PlayStation'
  | 'Xbox'
  | 'Activision Blizzard'
  | 'EA'
  | 'Ubisoft'
  | 'Take-Two'
  | 'Square Enix'
  | 'Capcom'
  | 'Bandai Namco'
  | 'Sega'
  | 'Konami'
  | 'CD Projekt Red'
  | 'Riot Games'
  | 'Blizzard Entertainment'
  | 'Mojang Studios'
  | 'Rockstar Games'
  | 'Insomniac Games'
  | 'Naughty Dog'
  | 'Guerrilla Games'
  | 'Sucker Punch Productions'
  | 'Santa Monica Studio'
  | 'Bungie'
  | '343 Industries'
  | 'Infinity Ward'
  | 'Treyarch'
  | 'Sledgehammer Games'
  | 'Raven Software'
  | 'id Software'
  | 'Bethesda Game Studios'
  | 'Arkane Studios'
  | 'MachineGames'
  | 'Tango Gameworks'
  | 'Zenimax Online Studios'
  | 'Obsidian Entertainment'
  | 'inXile Entertainment'
  | 'Double Fine Productions'
  | 'Undead Labs'
  | 'Compulsion Games'
  | 'Ninja Theory'
  | 'Playground Games'
  | 'Turn 10 Studios'
  | 'The Coalition'
  | 'Rare Ltd.'
  | 'Xbox Game Studios Publishing'
  | 'Activision Publishing, Inc.'
  | 'King'
  | 'Zynga Inc.'
  | 'Electronic Arts Inc.'
  | 'Ubisoft Entertainment S.A.'
  | 'Take-Two Interactive Software, Inc.'
  | 'Square Enix Holdings Co., Ltd.'
  | 'Capcom Co., Ltd.'
  | 'Bandai Namco Holdings Inc.'
  | 'Sega Sammy Holdings Inc.'
  | 'Konami Group Corporation'
  | 'CD Projekt S.A.'
  | 'Riot Games, Inc.'
  | 'Epic Games, Inc.'
  | 'Valve Corporation'
  | 'Roblox Corporation'
  | 'Unity Technologies'
  | 'Tencent Holdings Limited'
  | 'NetEase, Inc.'
  | 'Sony Interactive Entertainment LLC'
  | 'Nintendo Co., Ltd.'
  | 'Microsoft Xbox'
  | 'Google Stadia (defunct)'
  | 'Amazon Luna'
  | 'Apple Arcade'
  | 'Netflix Games'
  | 'Facebook Gaming'
  | 'Twitch Interactive, Inc.'
  | 'YouTube Gaming'
  | 'Discord Inc.'
  | 'Reddit Inc.'
  | 'Pinterest Inc.'
  | 'Snap Inc.'
  | 'TikTok Pte. Ltd.'
  | 'Spotify Technology S.A.'
  | 'SoundCloud Global Limited & Co. KG'
  | 'Pandora Media, LLC'
  | 'Sirius XM Holdings Inc.'
  | 'iHeartMedia, Inc.'
  | 'Audible, Inc.'
  | 'LibriVox'
  | 'Project Gutenberg'
  | 'Open Library'
  | 'Internet Archive'
  | 'Wikipedia'
  | 'Wikimedia Foundation'
  | 'Mozilla Foundation'
  | 'Linux Foundation'
  | 'Apache Software Foundation'
  | 'Eclipse Foundation'
  | 'Cloud Native Computing Foundation'
  | 'OpenJS Foundation'
  | 'OpenSSL Software Foundation'
  | 'Free Software Foundation'
  | 'GNU Project'
  | 'Debian Project'
  | 'Ubuntu'
  | 'Red Hat, Inc.'
  | 'SUSE S.A.'
  | 'Canonical Ltd.'
  | 'Microsoft Azure'
  | 'Amazon Web Services, Inc.'
  | 'Google Cloud Platform'
  | 'IBM Cloud'
  | 'Oracle Cloud Infrastructure'
  | 'Alibaba Cloud'
  | 'Tencent Cloud'
  | 'Huawei Cloud'
  | 'Baidu AI Cloud'
  | 'Salesforce Platform'
  | 'SAP Cloud Platform'
  | 'Adobe Experience Cloud'
  | 'ServiceNow Platform'
  | 'Workday Platform'
  | 'VMware Cloud'
  | 'Cisco Webex'
  | 'Zoom Video Communications, Inc.'
  | 'Slack Technologies, LLC'
  | 'Atlassian Corporation Plc'
  | 'GitHub, Inc.'
  | 'GitLab Inc.'
  | 'Bitbucket (Atlassian)'
  | 'Jira (Atlassian)'
  | 'Confluence (Atlassian)'
  | 'Trello (Atlassian)'
  | 'Asana, Inc.'
  | 'Monday.com Ltd.'
  | 'Smartsheet Inc.'
  | 'Wrike, Inc.'
  | 'ClickUp'
  | 'Notion Labs, Inc.'
  | 'Evernote Corporation'
  | 'Dropbox, Inc.'
  | 'Box, Inc.'
  | 'Google Drive'
  | 'Microsoft OneDrive'
  | 'Apple iCloud'
  | 'Amazon S3'
  | 'Azure Blob Storage'
  | 'Google Cloud Storage'
  | 'IBM Cloud Object Storage'
  | 'Oracle Cloud Infrastructure Object Storage'
  | 'Alibaba Cloud OSS'
  | 'Tencent Cloud COS'
  | 'Huawei Cloud OBS'
  | 'Baidu AI Cloud BOS'
  | 'Stripe, Inc.'
  | 'PayPal Holdings, Inc.'
  | 'Square, Inc.'
  | 'Adyen N.V.'
  | 'Checkout.com'
  | 'Worldpay (FIS)'
  | 'Global Payments Inc.'
  | 'Fiserv, Inc.'
  | 'Visa Inc.'
  | 'Mastercard Incorporated'
  | 'American Express Company'
  | 'Discover Financial Services'
  | 'JCB Co., Ltd.'
  | 'UnionPay International'
  | 'SWIFT'
  | 'Fedwire'
  | 'ACH Network'
  | 'SEPA'
  | 'Faster Payments Service'
  | 'UPI (India)'
  | 'Pix (Brazil)'
  | 'Zelle'
  | 'Venmo'
  | 'Cash App'
  | 'Revolut Ltd.'
  | 'N26 GmbH'
  | 'Monzo Bank Limited'
  | 'Starling Bank Limited'
  | 'Chime Financial, Inc.'
  | 'SoFi Technologies, Inc.'
  | 'Robinhood Markets, Inc.'
  | 'Coinbase Global, Inc.'
  | 'Binance Holdings Ltd.'
  | 'Kraken (Payward, Inc.)'
  | 'FTX (defunct)'
  | 'Gemini Trust Company, LLC'
  | 'BlockFi (defunct)'
  | 'Celsius Network (defunct)'
  | 'Voyager Digital (defunct)'
  | 'Ledger SAS'
  | 'Trezor (SatoshiLabs)'
  | 'MetaMask (ConsenSys)'
  | 'Trust Wallet (Binance)'
  | 'Phantom (Solana)'
  | 'Keplr (Cosmos)'
  | 'Yoroi (Cardano)'
  | 'Daedalus (Cardano)'
  | 'Exodus Movement, Inc.'
  | 'Atomic Wallet'
  | 'Electrum'
  | 'MyEtherWallet'
  | 'MyCrypto'
  | 'Brave Software, Inc.'
  | 'Opera Limited'
  | 'Vivaldi Technologies AS'
  | 'DuckDuckGo, Inc.'
  | 'Proton Technologies AG'