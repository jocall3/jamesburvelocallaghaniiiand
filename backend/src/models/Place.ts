class Place {
  id: string;
  name: string;
  description: string | null;

  // Address Components
  streetAddress: string | null;
  building: string | null;
  room: string | null;
  floor: string | null;
  city: string | null;
  county: string | null;
  stateOrProvince: string | null;
  quarter: string | null;
  postalCode: string | null;
  country: string | null;
  continent: string | null;

  // Contact Information (from Address-related features)
  phoneNumber: string | null;
  faxNumber: string | null;

  // Geographical Coordinates
  latitude: number | null;
  longitude: number | null;
  altitude: number | null; // Corresponds to GeoCentroidZ

  // Geographical Boundaries (simplified to basic types for this model)
  geoBoundaryPolygon: string | null; // Assuming WKT or similar string
  geoBoundaryTop: number | null;
  geoBoundaryLeft: number | null;
  geoBoundaryBottom: number | null;
  geoBoundaryRight: number | null;
  geoBoundaryFront: number | null;
  geoBoundaryRear: number | null;

  constructor(options: {
    id: string;
    name: string;
    description?: string;
    streetAddress?: string;
    building?: string;
    room?: string;
    floor?: string;
    city?: string;
    county?: string;
    stateOrProvince?: string;
    quarter?: string;
    postalCode?: string;
    country?: string;
    continent?: string;
    phoneNumber?: string;
    faxNumber?: string;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    geoBoundaryPolygon?: string;
    geoBoundaryTop?: number;
    geoBoundaryLeft?: number;
    geoBoundaryBottom?: number;
    geoBoundaryRight?: number;
    geoBoundaryFront?: number;
    geoBoundaryRear?: number;
  }) {
    this.id = options.id;
    this.name = options.name;
    this.description = options.description ?? null;

    this.streetAddress = options.streetAddress ?? null;
    this.building = options.building ?? null;
    this.room = options.room ?? null;
    this.floor = options.floor ?? null;
    this.city = options.city ?? null;
    this.county = options.county ?? null;
    this.stateOrProvince = options.stateOrProvince ?? null;
    this.quarter = options.quarter ?? null;
    this.postalCode = options.postalCode ?? null;
    this.country = options.country ?? null;
    this.continent = options.continent ?? null;

    this.phoneNumber = options.phoneNumber ?? null;
    this.faxNumber = options.faxNumber ?? null;

    this.latitude = options.latitude ?? null;
    this.longitude = options.longitude ?? null;
    this.altitude = options.altitude ?? null;

    this.geoBoundaryPolygon = options.geoBoundaryPolygon ?? null;
    this.geoBoundaryTop = options.geoBoundaryTop ?? null;
    this.geoBoundaryLeft = options.geoBoundaryLeft ?? null;
    this.geoBoundaryBottom = options.geoBoundaryBottom ?? null;
    this.geoBoundaryRight = options.geoBoundaryRight ?? null;
    this.geoBoundaryFront = options.geoBoundaryFront ?? null;
    this.geoBoundaryRear = options.geoBoundaryRear ?? null;
  }

  /**
   * Returns a formatted full address string for the place.
   * Components are included only if they are not null.
   * @param separator The string to use between address components. Defaults to ", ".
   * @returns A string representing the full address, or null if no address components are available.
   */
  getFullAddress(separator: string = ", "): string | null {
    const addressParts: string[] = [];

    if (this.streetAddress) addressParts.push(this.streetAddress);
    if (this.building) addressParts.push(`Bldg: ${this.building}`);
    if (this.room) addressParts.push(`Room: ${this.room}`);
    if (this.floor) addressParts.push(`Floor: ${this.floor}`);
    if (this.city) addressParts.push(this.city);
    if (this.stateOrProvince) addressParts.push(this.stateOrProvince);
    if (this.postalCode) addressParts.push(this.postalCode);
    if (this.country) addressParts.push(this.country);

    return addressParts.length > 0 ? addressParts.join(separator) : null;
  }

  /**
   * Returns the geographical coordinates as an object.
   * @returns An object with latitude, longitude, and optional altitude, or null if coordinates are incomplete.
   */
  getCoordinates(): { latitude: number; longitude: number; altitude?: number } | null {
    if (this.latitude !== null && this.longitude !== null) {
      return {
        latitude: this.latitude,
        longitude: this.longitude,
        ...(this.altitude !== null && { altitude: this.altitude }),
      };
    }
    return null;
  }

  /**
   * Checks if the place has a valid set of geographical coordinates (latitude and longitude).
   * @returns True if both latitude and longitude are present, false otherwise.
   */
  hasGeoCoordinates(): boolean {
    return this.latitude !== null && this.longitude !== null;
  }
}

export { Place };