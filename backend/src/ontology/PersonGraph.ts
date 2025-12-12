/**
 * Represents a person entity and their associated relationships,
 * including demographic information, contact details, and social connections.
 */
interface Person {
    /** Unique identifier for the person. */
    id: string;
    /** The person's full name. */
    fullName?: string;
    /** The person's first name. */
    firstName?: string;
    /** The person's last name. */
    lastName?: string;
    /** The person's middle name. */
    middleName?: string;
    /** The person's gender. */
    gender?: 'Male' | 'Female' | 'Other';
    /** The person's marital status. */
    maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
    /** Additional demographic information about the person. */
    demographics?: PersonDemographics;
    /** Contact information for the person. */
    contact?: PersonContact;
    /** Social connections and relationships of the person. */
    socialConnections?: PersonSocialConnections;
}

/**
 * Represents demographic details for a person.
 */
interface PersonDemographics {
    /** The person's date of birth. */
    dateOfBirth?: Date;
    /** The person's nationality. */
    nationality?: string;
    /** Information related to the person's education. */
    education?: PersonEducation;
    /** Information related to the person's employment. */
    employment?: PersonEmployment;
}

/**
 * Represents educational details for a person.
 */
interface PersonEducation {
    /** The highest level of education attained. */
    highestLevel?: string;
    /** The institution where the person studied. */
    institution?: string;
    /** The field of study. */
    fieldOfStudy?: string;
    /** The years attended. */
    yearsAttended?: { start: Date; end: Date };
}

/**
 * Represents employment details for a person.
 */
interface PersonEmployment {
    /** The person's job title. */
    jobTitle?: string;
    /** The company or organization where the person is employed. */
    employer?: string;
    /** The industry the person works in. */
    industry?: string;
    /** The date the person started their current employment. */
    startDate?: Date;
    /** The date the person ended their employment (if applicable). */
    endDate?: Date;
}

/**
 * Represents contact information for a person.
 */
interface PersonContact {
    /** Phone numbers associated with the person. */
    phoneNumbers?: PhoneNumber[];
    /** Email addresses associated with the person. */
    emailAddresses?: EmailAddress[];
    /** Physical addresses associated with the person. */
    addresses?: Address[];
    /** Social media profiles or online handles. */
    socialMedia?: SocialMediaProfile[];
}

/**
 * Represents a phone number.
 */
interface PhoneNumber {
    /** The phone number value. */
    number: string;
    /** The type of phone number (e.g., mobile, home, work). */
    type?: 'Mobile' | 'Home' | 'Work' | 'Fax';
    /** Indicates if this is the primary phone number. */
    isPrimary?: boolean;
}

/**
 * Represents an email address.
 */
interface EmailAddress {
    /** The email address value. */
    address: string;
    /** Indicates if this is the primary email address. */
    isPrimary?: boolean;
}

/**
 * Represents a physical address.
 */
interface Address {
    /** Street name and number. */
    street?: string;
    /** House number. */
    house?: string;
    /** Building name or number. */
    building?: string;
    /** Room or apartment number. */
    room?: string;
    /** Floor number. */
    floor?: string;
    /** City. */
    city?: string;
    /** State or province. */
    stateOrProvince?: string;
    /** Postal code (e.g., ZIP code). */
    zip?: string;
    /** Country or region. */
    country?: string;
    /** Quarter or district. */
    quarter?: string;
    /** The type of address (e.g., home, work, shipping). */
    type?: 'Home' | 'Work' | 'Shipping' | 'Billing';
}

/**
 * Represents a social media profile or online handle.
 */
interface SocialMediaProfile {
    /** The platform name (e.g., Twitter, LinkedIn, GitHub). */
    platform: string;
    /** The user's handle or profile URL. */
    handleOrUrl: string;
}

/**
 * Represents social connections and relationships of a person.
 */
interface PersonSocialConnections {
    /** Other individuals directly connected to this person. */
    directConnections?: Person[];
    /** Relationships to other people (e.g., family, colleagues). */
    relationships?: Relationship[];
    /** Groups or organizations the person is associated with. */
    affiliations?: Affiliation[];
}

/**
 * Represents a relationship between two people.
 */
interface Relationship {
    /** The person on the other end of the relationship. */
    relatedPerson: Person;
    /** The type of relationship (e.g., "Family", "Colleague", "Friend"). */
    type: string;
    /** Additional details about the relationship. */
    description?: string;
}

/**
 * Represents an affiliation of a person with a group or organization.
 */
interface Affiliation {
    /** The name of the group or organization. */
    name: string;
    /** The role or position within the group/organization. */
    role?: string;
    /** The type of affiliation (e.g., "Professional", "Volunteer", "Club"). */
    type?: 'Professional' | 'Volunteer' | 'Club' | 'Community';
}

/**
 * Represents a geo-spatial point.
 */
interface GeoPoint {
    /** The latitude coordinate. */
    latitude: number;
    /** The longitude coordinate. */
    longitude: number;
    /** The altitude or Z coordinate. */
    altitude?: number;
}

/**
 * Represents a geo-spatial boundary.
 */
interface GeoBoundary {
    /** The northernmost boundary. */
    top?: number;
    /** The westernmost boundary. */
    left?: number;
    /** The southernmost boundary. */
    bottom?: number;
    /** The easternmost boundary. */
    right?: number;
    /** The frontmost boundary. */
    front?: number;
    /** The rearmost boundary. */
    rear?: number;
    /** A polygon representing the boundary. */
    polygon?: string; // SVG path data or similar representation
}

/**
 * Represents physical characteristics of an entity.
 */
interface PhysicalAttributes {
    /** The size of the entity. */
    size?: string;
    /** The color of the entity. */
    color?: string;
    /** The weight of the entity. */
    weight?: number;
    /** The height of the entity. */
    height?: number;
    /** The width of the entity. */
    width?: number;
    /** The depth of the entity. */
    depth?: number;
    /** The volume of the entity. */
    volume?: number;
    /** The density of the entity. */
    density?: number;
}

/**
 * Represents a currency and its exchange rate.
 */
interface CurrencyExchange {
    /** The source currency. */
    sourceCurrency: string;
    /** The destination currency. */
    destinationCurrency: string;
    /** The exchange rate. */
    rate: number;
    /** The type of rate (e.g., 'buy', 'sell', 'mid'). */
    rateType?: string;
    /** The date and time of the exchange rate. */
    timestamp: Date;
}

/**
 * Represents a date range.
 */
interface DateRange {
    /** The start date. */
    startDate: Date;
    /** The end date. */
    endDate: Date;
}

/**
 * Represents formatting properties.
 */
interface Formatting {
    /** The color used for formatting. */
    color?: string;
    /** The order of formatting application. */
    order?: number;
    /** Font details for text formatting. */
    font?: FontDetails;
    /** Font effects (e.g., bold, italic, underline). */
    fontEffects?: string[];
    /** Font size. */
    fontSize?: string;
    /** Indicates if this formatting is a subtotal. */
    isSubtotal?: boolean;
}

/**
 * Represents font details.
 */
interface FontDetails {
    /** The name of the font. */
    fontFamily?: string;
    /** Font style (e.g., 'normal', 'italic'). */
    fontStyle?: string;
    /** Font weight (e.g., 'normal', 'bold'). */
    fontWeight?: string;
}

/**
 * Represents a unique identifier with an optional primary key flag.
 */
interface Identifier {
    /** The unique value of the identifier. */
    value: string;
    /** Indicates if this identifier is the primary key. */
    isPrimaryKey?: boolean;
}

/**
 * Represents a foreign key relationship.
 */
interface ForeignKey {
    /** The identifier of the related entity. */
    key: string;
    /** The name of the related entity or table. */
    relatedEntity: string;
}

/**
 * Represents an organizational unit or department.
 */
interface OrganizationalUnit {
    /** The name of the organizational unit. */
    name: string;
    /** The unique code or ID of the organizational unit. */
    code?: string;
    /** The title of the organization. */
    organizationalTitle?: string;
    /** A short caption or name for the unit. */
    shortCaption?: string;
    /** A detailed description of the unit. */
    description?: string;
    /** An abbreviation for the unit. */
    abbreviation?: string;
}

/**
 * Represents a bill of materials (BOM) resource.
 */
interface BomResource {
    /** The name of the BOM resource. */
    name: string;
    /** The identifier of the BOM resource. */
    id: string;
    /** Quantitative information related to the resource. */
    quantitative?: string;
}

/**
 * Represents a scenario.
 */
interface Scenario {
    /** The name of the scenario. */
    name: string;
    /** A description of the scenario. */
    description?: string;
}

/**
 * Represents a utility.
 */
interface Utility {
    /** The name of the utility. */
    name: string;
    /** A description of the utility. */
    description?: string;
}

/**
 * Represents a product group.
 */
interface ProductGroup {
    /** The name of the product group. */
    name: string;
    /** A description of the product group. */
    description?: string;
}

/**
 * Represents a product category.
 */
interface ProductCategory {
    /** The name of the product category. */
    name: string;
    /** A description of the product category. */
    description?: string;
}

/**
 * Represents a product brand.
 */
interface ProductBrand {
    /** The name of the product brand. */
    name: string;
    /** A description of the product brand. */
    description?: string;
}

/**
 * Represents a Stock Keeping Unit (SKU) for a product.
 */
interface ProductSku {
    /** The SKU identifier. */
    sku: string;
    /** A description of the product associated with the SKU. */
    productDescription?: string;
}

/**
 * Represents customer information.
 */
interface Customer {
    /** Unique identifier for the customer. */
    id: string;
    /** The customer's name. */
    name: string;
    /** The customer group the customer belongs to. */
    customerGroup?: CustomerGroup;
    /** Information about the customer's household. */
    customerHousehold?: CustomerHousehold;
}

/**
 * Represents a group of customers.
 */
interface CustomerGroup {
    /** The name of the customer group. */
    name: string;
    /** A description of the customer group. */
    description?: string;
}

/**
 * Represents a customer's household.
 */
interface CustomerHousehold {
    /** The unique identifier for the household. */
    id: string;
    /** The name of the household. */
    name?: string;
    /** Members of the household. */
    members?: Person[];
}

/**
 * Represents a product.
 */
interface Product {
    /** Unique identifier for the product. */
    id: string;
    /** The name of the product. */
    name: string;
    /** The product's SKU. */
    sku?: ProductSku;
    /** The product's brand. */
    brand?: ProductBrand;
    /** The product's category. */
    category?: ProductCategory;
    /** The product group it belongs to. */
    productGroup?: ProductGroup;
}

/**
 * Represents a date-related feature.
 */
interface DateFeature {
    /** The start date. */
    startDate?: Date;
    /** The end date. */
    endDate?: Date;
    /** The date of cancellation. */
    canceledDate?: Date;
    /** The date of modification. */
    modifiedDate?: Date;
    /** The duration related to the date. */
    duration?: string; // e.g., "1 year", "3 months"
}

/**
 * Represents a version identifier.
 */
interface Version {
    /** The version string. */
    version: string;
}

/**
 * Represents a currency with ISO codes.
 */
interface Currency {
    /** The name of the currency. */
    name: string;
    /** The ISO 4217 alphabetic currency code. */
    isoCodeAlpha?: string;
    /** The ISO 4217 numeric currency code. */
    isoCodeNumeric?: string;
}

/**
 * Represents a project.
 */
interface Project {
    /** The name of the project. */
    name: string;
    /** The code or identifier for the project. */
    code?: string;
    /** The start date of the project. */
    startDate?: Date;
    /** The end date of the project. */
    endDate?: Date;
    /** The completion status of the project. */
    completion?: string; // e.g., "Completed", "In Progress"
}

/**
 * Represents a time-related component.
 */
interface TimeComponent {
    /** The number of years. */
    years?: number;
    /** The number of half-years. */
    halfYears?: number;
    /** The number of quarters. */
    quarters?: number;
    /** The number of trimesters. */
    trimesters?: number;
    /** The number of months. */
    months?: number;
    /** The number of ten-day periods. */
    tenDays?: number;
    /** The number of weeks. */
    weeks?: number;
    /** The number of days. */
    days?: number;
    /** The number of hours. */
    hours?: number;
    /** The number of minutes. */
    minutes?: number;
    /** The number of seconds. */
    seconds?: number;
}

/**
 * Represents a time component within a larger period.
 */
interface TimeComponentInPeriod extends TimeComponent {
    /** The day of the week. */
    dayOfWeek?: number; // 1-7
    /** The name of the day of the week. */
    dayNameOfWeek?: string;
    /** The day of the month. */
    dayOfMonth?: number;
    /** The day of the quarter. */
    dayOfQuarter?: number;
    /** The day of the trimester. */
    dayOfTrimester?: number;
    /** The day of the half-year. */
    dayOfHalfYear?: number;
    /** The day of the year. */
    dayOfYear?: number;
    /** The week of the year. */
    weekOfYear?: number;
    /** The week of the half-year. */
    weekOfHalfYear?: number;
    /** The week of the quarter. */
    weekOfQuarter?: number;
    /** The week of the trimester. */
    weekOfTrimester?: number;
    /** The week of the month. */
    weekOfMonth?: number;
    /** The ten-day period within the month. */
    tenDaysOfMonth?: number;
    /** The ten-day period within the quarter. */
    tenDayOfQuarter?: number;
    /** The ten-day period within the trimester. */
    tenDayOfTrimester?: number;
    /** The ten-day period within the half-year. */
    tenDayOfHalfYear?: number;
    /** The ten-day period within the year. */
    tenDayOfYear?: number;
    /** The month within the trimester. */
    monthOfTrimester?: number;
    /** The month within the quarter. */
    monthOfQuarter?: number;
    /** The month within the half-year. */
    monthOfHalfYear?: number;
    /** The month of the year. */
    monthOfYear?: number;
    /** The trimester of the year. */
    trimesterOfYear?: number;
    /** The quarter of the half-year. */
    quarterOfHalfYear?: number;
    /** The quarter of the year. */
    quarterOfYear?: number;
    /** The half-year of the year. */
    halfYearsOfYear?: number;
}

/**
 * Represents a time zone.
 */
interface TimeZone {
    /** The name of the time zone. */
    name: string;
    /** The abbreviation of the time zone. */
    abbreviation?: string;
}

/**
 * Represents a latitude value.
 */
interface Latitude {
    /** The numeric latitude value. */
    numericValue: number;
    /** The string representation of the latitude. */
    stringValue?: string;
}

/**
 * Represents a longitude value.
 */
interface Longitude {
    /** The numeric longitude value. */
    numericValue: number;
    /** The string representation of the longitude. */
    stringValue?: string;
}

/**
 * Represents a geographical point.
 */
interface GeoCoordinate {
    /** The latitude of the point. */
    latitude: Latitude;
    /** The longitude of the point. */
    longitude: Longitude;
    /** The altitude of the point. */
    altitude?: number;
}

/**
 * Represents a geographical boundary polygon.
 */
interface GeoPolygon {
    /** The boundary polygon data. */
    polygon: string; // e.g., SVG path data
}

/**
 * Represents a geospatial geometry.
 */
interface GeospatialGeometry {
    /** The type of geometry (e.g., 'Point', 'LineString', 'Polygon'). */
    type: string;
    /** The coordinates of the geometry. */
    coordinates: any; // Varies based on geometry type
}

/**
 * Represents a geographical feature.
 */
interface GeospatialFeature {
    /** The type of feature (e.g., 'Continent', 'Country', 'State', 'City'). */
    type: string;
    /** The name of the feature. */
    name: string;
    /** Geographic centroid coordinates. */
    geoCentroid?: GeoCoordinate;
    /** Geographic boundary. */
    geoBoundary?: GeoBoundary;
    /** Geographic polygon representation. */
    geoPolygon?: GeoPolygon;
    /** Geospatial geometry. */
    geometry?: GeospatialGeometry;
}

/**
 * Represents a person's gender.
 */
type PersonGender = 'Male' | 'Female' | 'Other' | 'Unknown';

/**
 * Represents a person's marital status.
 */
type PersonMaritalStatus = 'Single' | 'Married' | 'Divorced' | 'Widowed' | 'Unknown';

/**
 * Represents a date type.
 */
type DataTypeDate = Date;

/**
 * Represents a time type.
 */
type DataTypeTime = Date; // Can be represented as Date object with time component

/**
 * Represents a time span.
 */
type DataTypeTimeSpan = {
    /** The duration in days. */
    days?: number;
    /** The duration in hours. */
    hours?: number;
    /** The duration in minutes. */
    minutes?: number;
    /** The duration in seconds. */
    seconds?: number;
    /** The duration in milliseconds. */
    milliseconds?: number;
};

/**
 * Represents a number type.
 */
type DataTypeNumber = number;

/**
 * Represents a float number type.
 */
type DataTypeFloat = number;

/**
 * Represents an integer number type.
 */
type DataTypeInteger = number;

/**
 * Represents a binary data type.
 */
type DataTypeBinary = Blob | ArrayBuffer; // Or appropriate binary type

/**
 * Represents an image data type.
 */
type DataTypeImage = string | Blob; // Can be URL or Blob

/**
 * Represents a text data type.
 */
type DataTypeText = string;

/**
 * Represents a URL data type.
 */
type DataTypeURL = string;

/**
 * Represents an email address data type.
 */
type DataTypeEmail = string;

/**
 * Represents an IP address data type.
 */
type DataTypeIPAddress = string;

/**
 * Represents a credit card number.
 */
type DataTypeCreditCardNumber = string;

/**
 * Represents industry codes.
 */
interface IndustryCodes {
    /** NAICS titles for industries. */
    naicsTitles?: string[];
    /** NAICS codes for industries. */
    naicsCodes?: string[];
    /** SIC titles for industries. */
    sicTitles?: string[];
    /** SIC codes for industries. */
    sicCodes?: string[];
}

/**
 * Represents an ISBN (International Standard Book Number).
 */
type DataTypeISBN = string;

/**
 * Represents an ISR code.
 */
type DataISRCCode = string;

/**
 * Represents a Social Security Number (SSN).
 */
type DataTypeSSN = string;

/**
 * Represents a stock symbol.
 */
type DataTypeStockSymbol = string;

/**
 * Represents a UPC-A product code.
 */
type DataTypeProductUPCA = string;

/**
 * Represents a DUNS number.
 */
type DataTypeDunsNumber = string;

/**
 * Represents a currency type.
 */
type DataTypeCurrency = {
    /** The currency code (e.g., 'USD', 'EUR'). */
    code: string;
    /** The amount. */
    amount: number;
};

/**
 * Represents a boolean data type.
 */
type DataTypeBoolean = boolean;

/**
 * Enum for Date type FeatureExtractor values
 */
type DateFeatureExtractor = 'Date';

/**
 * Enum for TimeZone type FeatureExtractor values
 */
type TimeZoneFeatureExtractor = 'TimeZone';

/**
 * Enum for TimeZoneNames type FeatureExtractor values
 */
type TimeZoneNamesFeatureExtractor = 'TimeZoneNames';

/**
 * Enum for Latitude type FeatureExtractor values
 */
type LatitudeFeatureExtractor = 'StringLatitude' | 'NumericLatitude';

/**
 * Enum for Longitude type FeatureExtractor values
 */
type LongitudeFeatureExtractor = 'StringLongitude' | 'NumericLongitude';

/**
 * Enum for Email type FeatureExtractor values
 */
type EmailFeatureExtractor = 'Email';

/**
 * Enum for IPAddress type FeatureExtractor values
 */
type IPAddressFeatureExtractor = 'IPAddress';

/**
 * Enum for CreditCardNumber type FeatureExtractor values
 */
type CreditCardNumberFeatureExtractor =
    | 'CreditCardNumber'
    | 'AmexCreditCard'
    | 'BankcardCreditCard'
    | 'ChinaUnionPayCreditCard'
    | 'DinersClubCarteBlancheCreditCard'
    | 'DinersClubenRouteCreditCard'
    | 'DinersClubInternationalCreditCard'
    | 'DiscoverCreditCard'
    | 'InstaPaymentCreditCard'
    | 'JcbCreditCard'
    | 'LaserCreditCard'
    | 'MaestroCreditCard'
    | 'MasterCreditCard'
    | 'SoloCreditCard'
    | 'SwitchCreditCard'
    | 'VisaCreditCard';

/**
 * Enum for IndustryCodes type FeatureExtractor values
 */
type IndustryCodesFeatureExtractor =
    | 'NAICSTitles2007'
    | 'NAICSCodes2007'
    | 'SicTitles'
    | 'SICCodes';

/**
 * Enum for ISBN type FeatureExtractor values
 */
type ISBNFeatureExtractor = 'ISBN';

/**
 * Enum for ISRCCode type FeatureExtractor values
 */
type ISRCCodeFeatureExtractor = 'ISRCCode';

/**
 * Enum for SSN type FeatureExtractor values
 */
type SSNFeatureExtractor = 'SSN';

/**
 * Enum for StockSymbol type FeatureExtractor values
 */
type StockSymbolFeatureExtractor = 'StockSymbol';

/**
 * Enum for ProductUPCA type FeatureExtractor values
 */
type ProductUPCAFeatureExtractor = 'ProductUPCA';

/**
 * Enum for DunsNumber type FeatureExtractor values
 */
type DunsNumberFeatureExtractor = 'DunsNumber';

/**
 * Enum for PhoneNumber type FeatureExtractor values
 */
type PhoneNumberFeatureExtractor =
    | 'PhoneNumberUS'
    | 'PhoneNumberUK'
    | 'PhoneNumberDutch'
    | 'PhoneNumberBrazil'
    | 'PhoneNumberSouthAfricaCell';

/**
 * Enum for Currency type FeatureExtractor values
 */
type CurrencyFeatureExtractor = 'CurrencyNamesISO4217' | 'CurrencyCodesISO4217' | 'CurrencyCodesISO4217Numeric';

/**
 * Enum for DataSchema type FeatureExtractor values
 */
type DataSchemaFeatureExtractor =
    | 'AddressSchema'
    | 'CitySchema'
    | 'CompanySchema'
    | 'CountrySchema'
    | 'CountySchema'
    | 'DateEuroSchema'
    | 'FeetAndInchesSchema'
    | 'ISBNSchema'
    | 'LatitudeSchema'
    | 'LongitudeSchema'
    | 'PhoneNumberDutchSchema'
    | 'SSNSchema'
    | 'StateSchema'
    | 'USZipSchema'
    | 'StockSchema'
    | 'DunsSchema';

/**
 * Enum for Person Gender FeatureExtractor values
 */
type PersonGenderFeatureExtractor = 'Gender';

/**
 * Enum for Person Marital Status FeatureExtractor values
 */
type PersonMaritalStatusFeatureExtractor = 'PersonMaritalStatus';

/**
 * Enum for Country FeatureExtractor values
 */
type CountryFeatureExtractor =
    | 'TLDs'
    | 'FIPS10Codes'
    | 'CountryCodeISO3166Alpha2'
    | 'CountryCodeISO3166Alpha3'
    | 'CountryCapitals';

/**
 * Enum for State FeatureExtractor values
 */
type StateFeatureExtractor = 'FIPSNumericCodes' | 'FIPSAlphaCodes';

/**
 * Enum for ZipCodeUS type FeatureExtractor values
 */
type ZipCodeUSFeatureExtractor = 'ZipCodeUS' | 'ZipCodeUSPlus';

/**
 * Enum for ZipCodeCanada type FeatureExtractor values
 */
type ZipCodeCanadaFeatureExtractor = 'ZipCodeCanada';

/**
 * Enum for ZipCodeSweden type FeatureExtractor values
 */
type ZipCodeSwedenFeatureExtractor = 'ZipCodeSweden';

/**
 * Enum for Continent FeatureExtractor values
 */
type ContinentFeatureExtractor = 'Continent';

/**
 * Enum for Country FeatureExtractor values
 */
type CountryFeatureExtractorForPlace = 'Country';

/**
 * Enum for State FeatureExtractor values
 */
type StateFeatureExtractorForPlace = 'State';

/**
 * Enum for County FeatureExtractor values
 */
type CountyFeatureExtractor = 'County';

/**
 * Enum for City FeatureExtractor values
 */
type CityFeatureExtractor = 'City' | 'CityAndState';

/**
 * Enum for Actor FeatureExtractor values
 */
type ActorFeatureExtractor = 'Actor';

/**
 * Enum for Politician FeatureExtractor values
 */
type PoliticianFeatureExtractor = 'Politician';

/**
 * Enum for Musician FeatureExtractor values
 */
type MusicianFeatureExtractor = 'Musician';

/**
 * Enum for Company FeatureExtractor values
 */
type CompanyFeatureExtractor = 'Company';

/**
 * Enum for MLBTeam FeatureExtractor values
 */
type MLBTeamFeatureExtractor = 'MLBTeam';

/**
 * Enum for PharmDrugStore FeatureExtractor values
 */
type PharmDrugStoreFeatureExtractor = 'PharmDrugStore';

/**
 * Enum for USHospital FeatureExtractor values
 */
type USHospitalFeatureExtractor = 'USHospital';

/**
 * Enum for USUniversity FeatureExtractor values
 */
type USUniversityFeatureExtractor = 'USUniversity';

/**
 * Enum for Language FeatureExtractor values
 */
type LanguageFeatureExtractor = 'LanguageCode' | 'LanguageName';

/**
 * Enum for MedicalCondition FeatureExtractor values
 */
type MedicalConditionFeatureExtractor = 'MedicalCondition';

/**
 * Enum for DayOfWeek FeatureExtractor values
 */
type DayOfWeekFeatureExtractor = 'DayNumberOfWeek' | 'DayNameOfWeek';

/**
 * Enum for DayOfMonth FeatureExtractor values
 */
type DayOfMonthFeatureExtractor = 'DayNumberOfMonth';

/**
 * Enum for WeekOfYear FeatureExtractor values
 */
type WeekOfYearFeatureExtractor = 'WeekNumberOfYear';

/**
 * Enum for MonthOfYear FeatureExtractor values
 */
type MonthOfYearFeatureExtractor = 'MonthNumberOfYear' | 'MonthNameOfYear';

/**
 * Enum for Color FeatureExtractor values
 */
type ColorFeatureExtractor = 'Color';

/**
 * Enum for Years FeatureExtractor values
 */
type YearsFeatureExtractor = 'Years';

/**
 * Enum for Currency ISO Code FeatureExtractor values
 */
type CurrencyISOCodeFeatureExtractor = 'CurrencyNamesISO4217' | 'CurrencyCodesISO4217' | 'CurrencyCodesISO4217Numeric';

/**
 * Enum for Web URL FeatureExtractor values
 */
type WebURLFeatureExtractor = 'WebURL';

/**
 * Enum for Image URL FeatureExtractor values
 */
type ImageURLFeatureExtractor = 'ImageURL';

/**
 * Enum for ImageJpeg MIME Type FeatureExtractor values
 */
type ImageJpegMimeTypeFeatureExtractor = 'ImageJpeg.MimeType';

/**
 * Enum for Image Png MIME Type FeatureExtractor values
 */
type ImagePngMimeTypeFeatureExtractor = 'ImagePng.MimeType';

/**
 * Represents the core Person graph structure.
 * This interface aggregates various aspects of a person's data
 * based on the provided schema.
 */
interface PersonGraph {
    /** Unique identifier for the person. */
    id: string;
    /** The person's full name. */
    fullName?: string;
    /** The person's first name. */
    firstName?: string;
    /** The person's last name. */
    lastName?: string;
    /** The person's middle name. */
    middleName?: string;
    /** The person's gender, extracted using a feature extractor. */
    gender?: PersonGender;
    /** The person's marital status, extracted using a feature extractor. */
    maritalStatus?: PersonMaritalStatus;
    /** Demographic information about the person. */
    demographics?: PersonDemographicsGraph;
    /** Contact information for the person. */
    contact?: PersonContactGraph;
    /** Social connections and relationships of the person. */
    socialConnections?: PersonSocialConnectionsGraph;
}

/**
 * Represents demographic details for a person within the graph context.
 */
interface PersonDemographicsGraph {
    /** The person's date of birth, potentially extracted as a Date. */
    dateOfBirth?: DateFeature;
    /** The person's nationality. */
    nationality?: string;
    /** Educational details for the person. */
    education?: PersonEducationGraph;
    /** Employment details for the person. */
    employment?: PersonEmploymentGraph;
}

/**
 * Represents educational details for a person within the graph context.
 */
interface PersonEducationGraph {
    /** The highest level of education attained. */
    highestLevel?: string;
    /** The institution where the person studied. */
    institution?: string;
    /** The field of study. */
    fieldOfStudy?: string;
    /** The years attended, represented as a DateRange. */
    yearsAttended?: DateRange;
}

/**
 * Represents employment details for a person within the graph context.
 */
interface PersonEmploymentGraph {
    /** The person's job title. */
    jobTitle?: string;
    /** The company or organization where the person is employed. */
    employer?: string;
    /** The industry the person works in. */
    industry?: string;
    /** The start date of employment. */
    startDate?: Date;
    /** The end date of employment. */
    endDate?: Date;
}

/**
 * Represents contact information for a person within the graph context.
 */
interface PersonContactGraph {
    /** Phone numbers associated with the person. */
    phoneNumbers?: PhoneNumberGraph[];
    /** Email addresses associated with the person. */
    emailAddresses?: EmailAddressGraph[];
    /** Physical addresses associated with the person. */
    addresses?: AddressGraph[];
    /** Social media profiles or online handles. */
    socialMedia?: SocialMediaProfileGraph[];
}

/**
 * Represents a phone number within the graph context.
 */
interface PhoneNumberGraph {
    /** The phone number value. */
    number: string;
    /** The type of phone number. */
    type?: 'Mobile' | 'Home' | 'Work' | 'Fax';
    /** Indicates if this is the primary phone number. */
    isPrimary?: boolean;
}

/**
 * Represents an email address within the graph context.
 */
interface EmailAddressGraph {
    /** The email address value. */
    address: string;
    /** Indicates if this is the primary email address. */
    isPrimary?: boolean;
}

/**
 * Represents a physical address within the graph context.
 */
interface AddressGraph {
    /** Street name and number. */
    street?: string;
    /** House number. */
    house?: string;
    /** Building name or number. */
    building?: string;
    /** Room or apartment number. */
    room?: string;
    /** Floor number. */
    floor?: string;
    /** City. */
    city?: string;
    /** State or province. */
    stateOrProvince?: string;
    /** Postal code (e.g., ZIP code). */
    zip?: string;
    /** Country or region. */
    country?: string;
    /** Quarter or district. */
    quarter?: string;
    /** The type of address. */
    type?: 'Home' | 'Work' | 'Shipping' | 'Billing';
}

/**
 * Represents a social media profile within the graph context.
 */
interface SocialMediaProfileGraph {
    /** The platform name. */
    platform: string;
    /** The user's handle or profile URL. */
    handleOrUrl: string;
}

/**
 * Represents social connections and relationships of a person within the graph context.
 */
interface PersonSocialConnectionsGraph {
    /** Other individuals directly connected to this person. */
    directConnections?: PersonGraph[];
    /** Relationships to other people. */
    relationships?: RelationshipGraph[];
    /** Groups or organizations the person is associated with. */
    affiliations?: AffiliationGraph[];
}

/**
 * Represents a relationship between two people within the graph context.
 */
interface RelationshipGraph {
    /** The person on the other end of the relationship. */
    relatedPerson: PersonGraph;
    /** The type of relationship. */
    type: string;
    /** Additional details about the relationship. */
    description?: string;
}

/**
 * Represents an affiliation of a person with a group or organization within the graph context.
 */
interface AffiliationGraph {
    /** The name of the group or organization. */
    name: string;
    /** The role or position within the group/organization. */
    role?: string;
    /** The type of affiliation. */
    type?: 'Professional' | 'Volunteer' | 'Club' | 'Community';
}

export type {
    Person,
    PersonDemographics,
    PersonEducation,
    PersonEmployment,
    PersonContact,
    PhoneNumber,
    EmailAddress,
    Address,
    SocialMediaProfile,
    PersonSocialConnections,
    Relationship,
    Affiliation,
    GeoPoint,
    GeoBoundary,
    PhysicalAttributes,
    CurrencyExchange,
    DateRange,
    Formatting,
    FontDetails,
    Identifier,
    ForeignKey,
    OrganizationalUnit,
    BomResource,
    Scenario,
    Utility,
    ProductGroup,
    ProductCategory,
    ProductBrand,
    ProductSku,
    Customer,
    CustomerGroup,
    CustomerHousehold,
    Product,
    DateFeature,
    Version,
    Currency,
    Project,
    TimeComponent,
    TimeComponentInPeriod,
    TimeZone,
    Latitude,
    Longitude,
    GeoCoordinate,
    GeoPolygon,
    GeospatialGeometry,
    GeospatialFeature,
    PersonGender,
    PersonMaritalStatus,
    DataTypeDate,
    DataTypeTime,
    DataTypeTimeSpan,
    DataTypeNumber,
    DataTypeFloat,
    DataTypeInteger,
    DataTypeBinary,
    DataTypeImage,
    DataTypeText,
    DataTypeURL,
    DataTypeEmail,
    DataTypeIPAddress,
    DataTypeCreditCardNumber,
    IndustryCodes,
    DataTypeISBN,
    DataISRCCode,
    DataTypeSSN,
    DataTypeStockSymbol,
    DataTypeProductUPCA,
    DataTypeDunsNumber,
    DataTypeCurrency,
    DataTypeBoolean,
    PersonGenderFeatureExtractor,
    PersonMaritalStatusFeatureExtractor,
    DateFeatureExtractor,
    TimeZoneFeatureExtractor,
    TimeZoneNamesFeatureExtractor,
    LatitudeFeatureExtractor,
    LongitudeFeatureExtractor,
    EmailFeatureExtractor,
    IPAddressFeatureExtractor,
    CreditCardNumberFeatureExtractor,
    IndustryCodesFeatureExtractor,
    ISBNFeatureExtractor,
    ISRCCodeFeatureExtractor,
    SSNFeatureExtractor,
    StockSymbolFeatureExtractor,
    ProductUPCAFeatureExtractor,
    DunsNumberFeatureExtractor,
    PhoneNumberFeatureExtractor,
    CurrencyFeatureExtractor,
    DataSchemaFeatureExtractor,
    CountryFeatureExtractor,
    StateFeatureExtractor,
    ZipCodeUSFeatureExtractor,
    ZipCodeCanadaFeatureExtractor,
    ZipCodeSwedenFeatureExtractor,
    ContinentFeatureExtractor,
    CountryFeatureExtractorForPlace,
    StateFeatureExtractorForPlace,
    CountyFeatureExtractor,
    CityFeatureExtractor,
    ActorFeatureExtractor,
    PoliticianFeatureExtractor,
    MusicianFeatureExtractor,
    CompanyFeatureExtractor,
    MLBTeamFeatureExtractor,
    PharmDrugStoreFeatureExtractor,
    USHospitalFeatureExtractor,
    USUniversityFeatureExtractor,
    LanguageFeatureExtractor,
    MedicalConditionFeatureExtractor,
    DayOfWeekFeatureExtractor,
    DayOfMonthFeatureExtractor,
    WeekOfYearFeatureExtractor,
    MonthOfYearFeatureExtractor,
    ColorFeatureExtractor,
    YearsFeatureExtractor,
    CurrencyISOCodeFeatureExtractor,
    WebURLFeatureExtractor,
    ImageURLFeatureExtractor,
    ImageJpegMimeTypeFeatureExtractor,
    ImagePngMimeTypeFeatureExtractor,
    PersonGraph,
    PersonDemographicsGraph,
    PersonEducationGraph,
    PersonEmploymentGraph,
    PersonContactGraph,
    PhoneNumberGraph,
    EmailAddressGraph,
    AddressGraph,
    SocialMediaProfileGraph,
    PersonSocialConnectionsGraph,
    RelationshipGraph,
    AffiliationGraph,
};