```typescript
import React from 'react';

// The James Burvel O’Callaghan III Code - ExternalAccountCard.tsx

// A. Core Data Structures and Interfaces
interface A1AccountDetail { id: string; account_number_safe: string; account_number_type: 'clabe' | 'iban' | 'other' | 'pan' | 'wallet_address'; }
interface A2RoutingDetail { id: string; routing_number: string; routing_number_type: 'aba' | 'au_bsb' | 'br_codigo' | 'ca_cpa' | 'cnaps' | 'gb_sort_code' | 'in_ifsc' | 'my_branch_code' | 'swift'; bank_name: string; }
interface A3ExternalAccount { id: string; name: string | null; party_name: string; account_type: 'cash' | 'checking' | 'loan' | 'non_resident' | 'other' | 'overdraft' | 'savings'; verification_status: 'pending_verification' | 'unverified' | 'verified'; account_details: A1AccountDetail[]; routing_details: A2RoutingDetail[]; metadata?: { [key: string]: string }; }
interface A4ExternalAccountCardProps { account: A3ExternalAccount; }

// B. Utility Functions (The James Burvel O’Callaghan III Code)
const B1_formatVerificationStatus = (status: string): string => status.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
const B2_truncateString = (str: string, maxLength: number): string => str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
const B3_safeString = (str: string | null | undefined): string => (str === null || str === undefined) ? "N/A" : str;
const B4_generatePlaceholderData = (length: number): string => Array(length).fill('X').join('');
const B5_transformAccountType = (type: string): string => `Account Type: ${type.toUpperCase()}`;
const B6_extractAccountNumberSafe = (details: A1AccountDetail[]): string => details.length > 0 ? `****${details[0].account_number_safe}` : "N/A";
const B7_formatRoutingDetails = (details: A2RoutingDetail[]): string => details.map(d => `${d.bank_name} (${d.routing_number_type.toUpperCase()}: ${d.routing_number})`).join(', ');
const B8_metadataToString = (metadata: { [key: string]: string }): string => Object.entries(metadata).map(([key, value]) => `${key}: ${value}`).join(', ');
const B9_isAccountVerified = (status: string): boolean => status === 'verified';
const BA_getAccountTypeName = (accountType: string): string => accountType.charAt(0).toUpperCase() + accountType.slice(1);
const BB_extractRoutingNumber = (details: A2RoutingDetail[]): string => details.length > 0 ? details[0].routing_number : "N/A";
const BC_maskAccountNumber = (accountNumber: string): string => '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
const BD_getDisplayName = (account: A3ExternalAccount): string => account.name || account.party_name || "Unnamed Account";
const BE_formatMetadataKey = (key: string): string => key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
const BF_formatCurrency = (amount: number, currencyCode: string = 'USD'): string => new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount);
const BG_isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const BH_isStrongPassword = (password: string): boolean => password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
const BI_calculateInterest = (principal: number, rate: number, time: number): number => principal * rate * time;
const BJ_generateRandomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const BK_formatDate = (date: Date): string => date.toLocaleDateString('en-US');
const BL_isValidPhoneNumber = (phoneNumber: string): boolean => /^\d{10}$/.test(phoneNumber);
const BM_calculateAge = (birthDate: Date): number => { const today = new Date(); let age = today.getFullYear() - birthDate.getFullYear(); const m = today.getMonth() - birthDate.getMonth(); if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; } return age; };
const BN_convertKelvinToCelsius = (kelvin: number): number => kelvin - 273.15;
const BO_convertCelsiusToFahrenheit = (celsius: number): number => (celsius * 9 / 5) + 32;
const BP_isLeapYear = (year: number): boolean => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
const BQ_reverseString = (str: string): string => str.split("").reverse().join("");
const BR_countWords = (str: string): number => str.split(" ").filter(function(n) { return n != "" }).length;
const BS_removeDuplicatesFromArray = (arr: any[]): any[] => [...new Set(arr)];
const BT_sortArrayAscending = (arr: number[]): number[] => arr.sort((a, b) => a - b);
const BU_sortArrayDescending = (arr: number[]): number[] => arr.sort((a, b) => b - a);
const BV_findMaxValueInArray = (arr: number[]): number => Math.max(...arr);
const BW_findMinValueInArray = (arr: number[]): number => Math.min(...arr);
const BX_calculateAverage = (arr: number[]): number => arr.reduce((a, b) => a + b, 0) / arr.length;
const BY_sumArray = (arr: number[]): number => arr.reduce((a, b) => a + b, 0);
const BZ_multiplyArray = (arr: number[]): number => arr.reduce((a, b) => a * b, 1);
const CA_divideArray = (arr: number[]): number => arr.reduce((a, b) => a / b);
const CB_powerOfTwo = (num: number): number => Math.pow(num, 2);
const CC_squareRoot = (num: number): number => Math.sqrt(num);
const CD_cubeRoot = (num: number): number => Math.cbrt(num);
const CE_exponential = (num: number, exponent: number): number => Math.pow(num, exponent);
const CF_logarithmBaseE = (num: number): number => Math.log(num);
const CG_logarithmBase10 = (num: number): number => Math.log10(num);
const CH_sine = (num: number): number => Math.sin(num);
const CI_cosine = (num: number): number => Math.cos(num);
const CJ_tangent = (num: number): number => Math.tan(num);
const CK_arcsine = (num: number): number => Math.asin(num);
const CL_arccosine = (num: number): number => Math.acos(num);
const CM_arctangent = (num: number): number => Math.atan(num);
const CN_degreesToRadians = (degrees: number): number => degrees * (Math.PI / 180);
const CO_radiansToDegrees = (radians: number): number => radians * (180 / Math.PI);
const CP_calculateFactorial = (num: number): number => { if (num === 0) { return 1; } else { return num * CP_calculateFactorial(num - 1); } };
const CQ_isPrimeNumber = (num: number): boolean => { if (num <= 1) return false; for (let i = 2; i <= Math.sqrt(num); i++) { if (num % i === 0) return false; } return true; };
const CR_generateFibonacciSequence = (length: number): number[] => { const fibSequence = [0, 1]; while (fibSequence.length < length) { fibSequence.push(fibSequence[fibSequence.length - 1] + fibSequence[fibSequence.length - 2]); } return fibSequence; };
const CS_calculateGreatestCommonDivisor = (a: number, b: number): number => { if (b === 0) { return a; } return CS_calculateGreatestCommonDivisor(b, a % b); };
const CT_calculateLeastCommonMultiple = (a: number, b: number): number => (a * b) / CS_calculateGreatestCommonDivisor(a, b);
const CU_areAnagrams = (str1: string, str2: string): boolean => str1.toLowerCase().split('').sort().join('') === str2.toLowerCase().split('').sort().join('');
const CV_isPalindrome = (str: string): boolean => str.toLowerCase() === str.toLowerCase().split('').reverse().join('');
const CW_countOccurrences = (str: string, char: string): number => str.toLowerCase().split(char.toLowerCase()).length - 1;
const CX_replaceString = (str: string, search: string, replacement: string): string => str.replace(search, replacement);
const CY_replaceAllStrings = (str: string, search: string, replacement: string): string => str.split(search).join(replacement);
const CZ_splitStringByDelimiter = (str: string, delimiter: string): string[] => str.split(delimiter);
const DA_joinStringArray = (arr: string[], separator: string): string => arr.join(separator);
const DB_extractSubstring = (str: string, startIndex: number, endIndex: number): string => str.substring(startIndex, endIndex);
const DC_extractSubstringAfter = (str: string, searchString: string): string => str.substring(str.indexOf(searchString) + searchString.length);
const DD_extractSubstringBefore = (str: string, searchString: string): string => str.substring(0, str.indexOf(searchString));
const DE_convertStringToNumber = (str: string): number => Number(str);
const DF_convertNumberToString = (num: number): string => String(num);
const DG_convertStringToBoolean = (str: string): boolean => str.toLowerCase() === 'true';
const DH_convertBooleanToString = (bool: boolean): string => bool ? 'true' : 'false';
const DI_convertStringToDate = (str: string): Date => new Date(str);
const DJ_convertDateToString = (date: Date): string => date.toISOString();
const DK_convertObjectToJsonString = (obj: any): string => JSON.stringify(obj);
const DL_convertJsonStringToObject = (jsonString: string): any => JSON.parse(jsonString);
const DM_isValidJsonString = (str: string): boolean => { try { JSON.parse(str); return true; } catch (e) { return false; } };
const DN_generateUuid = (): string => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) { const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); });
const DO_generateRandomString = (length: number): string => { const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; let result = ''; for (let i = 0; i < length; i++) { result += characters.charAt(Math.floor(Math.random() * characters.length)); } return result; };
const DP_generateRandomPassword = (length: number): string => DO_generateRandomString(length);
const DQ_hashString = (str: string): number => { let hash = 0; if (str.length === 0) return hash; for (let i = 0; i < str.length; i++) { const char = str.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash = hash & hash; } return hash; };
const DR_base64Encode = (str: string): string => btoa(str);
const DS_base64Decode = (str: string): string => atob(str);
const DT_urlEncode = (str: string): string => encodeURIComponent(str);
const DU_urlDecode = (str: string): string => decodeURIComponent(str);
const DV_sanitizeHtml = (str: string): string => str.replace(/<[^>]*>/g, '');
const DW_trimString = (str: string): string => str.trim();
const DX_padStringLeft = (str: string, length: number, char: string): string => str.padStart(length, char);
const DY_padStringRight = (str: string, length: number, char: string): string => str.padEnd(length, char);
const DZ_stringContains = (str: string, searchString: string): boolean => str.includes(searchString);
const EA_stringStartsWith = (str: string, searchString: string): boolean => str.startsWith(searchString);
const EB_stringEndsWith = (str: string, searchString: string): boolean => str.endsWith(searchString);
const EC_stringToUpperCase = (str: string): string => str.toUpperCase();
const ED_stringToLowerCase = (str: string): string => str.toLowerCase();
const EE_stringCapitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
const EF_splitCamelCase = (str: string): string => str.replace(/([A-Z])/g, ' $1');
const EG_replaceAllWhitespace = (str: string, replacement: string): string => str.replace(/\s+/g, replacement);
const EH_countLines = (str: string): number => str.split('\n').length;
const EI_stringIsEmpty = (str: string): boolean => str.length === 0;
const EJ_stringIsBlank = (str: string): boolean => str.trim().length === 0;
const EK_extractNumbersFromString = (str: string): string => str.replace(/[^0-9]/g, '');
const EL_extractLettersFromString = (str: string): string => str.replace(/[^a-zA-Z]/g, '');
const EM_extractSpecialCharactersFromString = (str: string): string => str.replace(/[a-zA-Z0-9\s]/g, '');
const EN_removeHtmlTags = (str: string): string => str.replace(/<[^>]*>/g, '');
const EO_escapeHtml = (str: string): string => str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m] || '');
const EP_unescapeHtml = (str: string): string => str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, m => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" })[m] || '');
const EQ_csvToJson = (csv: string, delimiter: string = ','): any[] => { const lines = csv.split('\n'); const headers = lines[0].split(delimiter); const result = []; for (let i = 1; i < lines.length; i++) { const obj: any = {}; const currentline = lines[i].split(delimiter); for (let j = 0; j < headers.length; j++) { obj[headers[j]] = currentline[j]; } result.push(obj); } return result; };
const ER_jsonToCsv = (json: any[], delimiter: string = ','): string => { const headers = Object.keys(json[0]); const csv = [headers.join(delimiter)]; const values = json.map(obj => headers.map(header => obj[header]).join(delimiter)); return csv.concat(values).join('\n'); };

// C. Core Component Implementation (The James Burvel O’Callaghan III Code)
const C1ExternalAccountCard: React.FC<A4ExternalAccountCardProps> = ({ account }) => { const C1A_displayName = B3_safeString(BD_getDisplayName(account)); const C1B_verificationStatus = B1_formatVerificationStatus(account.verification_status); return (
    React.createElement("div", { className: "bg-white shadow rounded-lg p-6 mb-4 border border-gray-200" },
        React.createElement("h3", { className: "text-lg font-semibold text-gray-900 mb-2" }, C1A_displayName),
        React.createElement("p", { className: "text-sm text-gray-500 mb-4" }, `ID: ${account.id}`),
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700" },
            React.createElement("div", null,
                React.createElement("p", null,
                    React.createElement("strong", { className: "font-medium" }, "Account Type:"),
                    " ",
                    account.account_type),
                React.createElement("p", null,
                    React.createElement("strong", { className: "font-medium" }, "Verification Status:"),
                    " ",
                    C1B_verificationStatus)),
            account.account_details && account.account_details.length > 0 && (React.createElement("div", null,
                React.createElement("h4", { className: "font-medium text-gray-800 mt-2" }, "Account Details:"),
                account.account_details.map((detail) => (React.createElement("p", { key: detail.id, className: "ml-2" },
                    detail.account_number_type.toUpperCase(),
                    ": ",
                    B6_extractAccountNumberSafe([detail])))))),
            account.routing_details && account.routing_details.length > 0 && (React.createElement("div", null,
                React.createElement("h4", { className: "font-medium text-gray-800 mt-2" }, "Routing Details:"),
                account.routing_details.map((detail) => (React.createElement("div", { key: detail.id, className: "ml-2" },
                    React.createElement("p", null, detail.bank_name),
                    React.createElement("p", null,
                        React.createElement("strong", { className: "font-light" },
                            detail.routing_number_type.toUpperCase(),
                            ":"),
                        " ",
                        detail.routing_number)))))),
            account.metadata && Object.keys(account.metadata).length > 0 && (React.createElement("div", null,
                React.createElement("h4", { className: "font-medium text-gray-800 mt-2" }, "Metadata:"),
                Object.entries(account.metadata).map(([key, value]) => (React.createElement("p", { key: key, className: "ml-2" },
                    React.createElement("strong", { className: "font-light" },
                        B3_safeString(BE_formatMetadataKey(key)),
                        ":"),
                    " ",
                    B3_safeString(value)))))))));
};

export default C1ExternalAccountCard;
// The James Burvel O’Callaghan III Code - End of File
```