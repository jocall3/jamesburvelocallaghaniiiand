export type PreferenceType = 'PRIMARY' | 'SECONDARY';

export type PhoneType = 'HOME' | 'BUSINESS' | 'CELL' | 'MOBILE';

export interface Email {
  /**
   * Mandatory.
   * Email address of the customer
   */
  emailAddress: string;
  /**
   * Mandatory.
   * email preference
   */
  preferenceType: PreferenceType;
}

export interface Address {
  /** address ID. */
  addressId?: string;
  /** Address line1 */
  addressLine1?: string;
  /** Address line2 */
  addressLine2?: string;
  /** Address line3 */
  addressLine3?: string;
  /** address type */
  addressType?: string;
  /** Customer city */
  city?: string;
  /**
   * Mandatory.
   * Customer country code
   */
  countryCode: string;
  /**
   * Mandatory.
   * Customer postal code
   */
  postalCode: string;
  /** Customer state code */
  state?: string;
}

export interface Phone {
  /** area code of the phone number */
  areaCode?: string;
  /** country code of the phone number */
  countryCallingCode?: string;
  /** phone exchange number */
  exchangeNumber?: string;
  /** extension for the phone */
  extension?: string;
  /** Complete phone number */
  fullPhoneNumber?: string;
  /** land line number */
  localNumber?: string;
  /**
   * Mandatory.
   * Type of the phone (Mobile, Office or Other).
   */
  phoneType: PhoneType;
  /**
   * Mandatory.
   * Denotes primary or secondary
   */
  preferenceType: PreferenceType;
}

export interface CustomerProfileResponse {
  /** Customer full name. */
  fullName?: string;
  /**
   * Mandatory.
   * Customer first name.
   */
  firstName: string;
  /**
   * Mandatory.
   * Customer last name.
   */
  lastName: string;
  /** Customer middle name. */
  middleName?: string;
  /** Customer's local name. */
  localName?: string;
  /** The prefix of the customer's name. */
  title?: string;
  /** The suffix of the customer's name. */
  suffix?: string;
  /** Customer's maternal surname. */
  maidenName?: string;
  /** customer's company name. */
  companyName?: string;
  emails?: Email[];
  addressList?: Address[];
  phones?: Phone[];
}