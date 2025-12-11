export interface GeoCentroid {
    /**
     * The latitude coordinate, typically ranging from -90 (South Pole) to +90 (North Pole).
     */
    latitude: number;
    /**
     * The longitude coordinate, typically ranging from -180 (West) to +180 (East).
     */
    longitude: number;
    /**
     * The altitude or Z coordinate, optional.
     */
    altitude?: number;
}

export interface GeoBoundaryRect {
    /**
     * The northernmost latitude of the bounding box.
     */
    north: number;
    /**
     * The southernmost latitude of the bounding box.
     */
    south: number;
    /**
     * The westernmost longitude of the bounding box.
     */
    west: number;
    /**
     * The easternmost longitude of the bounding box.
     */
    east: number;
    // For 3D bounding boxes, 'front' and 'rear' (or min/max altitude) could be added.
    // E.g., front?: number; rear?: number;
}

export interface GeoBoundaryPolygon {
    /**
     * An array of vertices defining the polygon.
     * The order of vertices typically defines the polygon's exterior ring.
     * For simplicity, this interface assumes a simple, non-self-intersecting polygon.
     */
    vertices: { latitude: number; longitude: number; }[];
}

/**
 * Service for processing and handling geospatial data, including GeoCentroids and GeoBoundaries.
 * It provides methods to create, validate, and perform basic operations on geographic coordinates.
 * Assumes WGS84 (Latitude/Longitude) as the global coordinate system.
 */
export class GeoSpatialService {

    /**
     * Validates if a given latitude is within the standard WGS84 range [-90, 90].
     * @param latitude The latitude value to validate.
     * @returns True if the latitude is valid, false otherwise.
     */
    private isValidLatitude(latitude: number): boolean {
        return latitude >= -90 && latitude <= 90;
    }

    /**
     * Validates if a given longitude is within the standard WGS84 range [-180, 180].
     * @param longitude The longitude value to validate.
     * @returns True if the longitude is valid, false otherwise.
     */
    private isValidLongitude(longitude: number): boolean {
        return longitude >= -180 && longitude <= 180;
    }

    /**
     * Creates a GeoCentroid object from individual coordinate components.
     * This method maps raw X (longitude), Y (latitude), and optional Z (altitude) values
     * to the structured GeoCentroid interface.
     *
     * @param x The X-coordinate, interpreted as longitude.
     * @param y The Y-coordinate, interpreted as latitude.
     * @param z The Z-coordinate, interpreted as altitude (optional).
     * @returns A GeoCentroid object if coordinates are valid, otherwise null.
     */
    public createCentroid(x: number, y: number, z?: number): GeoCentroid | null {
        if (!this.isValidLatitude(y) || !this.isValidLongitude(x)) {
            console.warn(`GeoSpatialService: Invalid centroid coordinates provided. Latitude: ${y}, Longitude: ${x}.`);
            return null;
        }

        return {
            latitude: y,
            longitude: x,
            altitude: z
        };
    }

    /**
     * Creates a GeoBoundaryRect (bounding box) object from its extreme geographic coordinates.
     * This method processes `GeoBoundaryTop`, `GeoBoundaryBottom`, `GeoBoundaryLeft`, and `GeoBoundaryRight`
     * features from the project schema.
     *
     * @param topLatitude The northernmost latitude (`GeoBoundaryTop`).
     * @param bottomLatitude The southernmost latitude (`GeoBoundaryBottom`).
     * @param leftLongitude The westernmost longitude (`GeoBoundaryLeft`).
     * @param rightLongitude The easternmost longitude (`GeoBoundaryRight`).
     * @returns A GeoBoundaryRect object if coordinates are valid, otherwise null.
     */
    public createBoundingRectangle(
        topLatitude: number,
        bottomLatitude: number,
        leftLongitude: number,
        rightLongitude: number
    ): GeoBoundaryRect | null {
        if (
            !this.isValidLatitude(topLatitude) || !this.isValidLatitude(bottomLatitude) ||
            !this.isValidLongitude(leftLongitude) || !this.isValidLongitude(rightLongitude)
        ) {
            console.warn(
                `GeoSpatialService: Invalid bounding rectangle coordinates. ` +
                `Top: ${topLatitude}, Bottom: ${bottomLatitude}, Left: ${leftLongitude}, Right: ${rightLongitude}.`
            );
            return null;
        }

        if (topLatitude < bottomLatitude) {
            console.warn(`GeoSpatialService: Invalid bounding rectangle: 'topLatitude' (${topLatitude}) must be greater than or equal to 'bottomLatitude' (${bottomLatitude}).`);
            return null;
        }

        // Note: Handling anti-meridian crossing (where `rightLongitude` < `leftLongitude`)
        // typically involves more complex spatial queries. For simple data representation,
        // we store the provided min/max. The actual geometric interpretation for rendering
        // or querying would handle the wrap-around.
        return {
            north: topLatitude,
            south: bottomLatitude,
            west: leftLongitude,
            east: rightLongitude
        };
    }

    /**
     * Creates a GeoBoundaryPolygon object from an array of its vertices.
     * This method processes `GeoBoundaryPolygon` features.
     *
     * @param vertices An array of objects, where each object contains `latitude` and `longitude`
     *                 defining a vertex of the polygon.
     * @returns A GeoBoundaryPolygon object if vertices are valid and sufficient (at least 3 vertices),
     *          otherwise null.
     */
    public createBoundingPolygon(vertices: { latitude: number; longitude: number; }[]): GeoBoundaryPolygon | null {
        if (!vertices || vertices.length < 3) {
            console.warn("GeoSpatialService: A geographic polygon requires at least 3 vertices.");
            return null;
        }

        const validVertices: { latitude: number; longitude: number; }[] = [];
        for (let i = 0; i < vertices.length; i++) {
            const vertex = vertices[i];
            if (!this.isValidLatitude(vertex.latitude) || !this.isValidLongitude(vertex.longitude)) {
                console.warn(
                    `GeoSpatialService: Invalid vertex found in polygon at index ${i}. ` +
                    `Latitude: ${vertex.latitude}, Longitude: ${vertex.longitude}. ` +
                    `Rejecting entire polygon.`
                );
                return null;
            }
            validVertices.push(vertex);
        }

        return {
            vertices: validVertices
        };
    }

    /**
     * Calculates the great-circle distance between two GeoCentroid points using the Haversine formula.
     *
     * @param centroid1 The first GeoCentroid.
     * @param centroid2 The second GeoCentroid.
     * @param unit The desired unit of distance: 'km' for kilometers (default), 'miles' for miles.
     * @returns The calculated distance between the two centroids in the specified unit.
     */
    public calculateDistance(centroid1: GeoCentroid, centroid2: GeoCentroid, unit: 'km' | 'miles' = 'km'): number {
        const R = unit === 'km' ? 6371 : 3958.8; // Radius of Earth in km or miles

        const lat1Rad = this.degreesToRadians(centroid1.latitude);
        const lon1Rad = this.degreesToRadians(centroid1.longitude);
        const lat2Rad = this.degreesToRadians(centroid2.latitude);
        const lon2Rad = this.degreesToRadians(centroid2.longitude);

        const dLat = lat2Rad - lat1Rad;
        const dLon = lon2Rad - lon1Rad;

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Converts an angle from degrees to radians.
     * @param degrees The angle in degrees.
     * @returns The angle in radians.
     */
    private degreesToRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    // Additional methods could be implemented here for more complex geospatial operations,
    // such as:
    // - `isPointInPolygon(point: GeoCentroid, polygon: GeoBoundaryPolygon): boolean`: Checks if a point lies within a polygon.
    // - `getCentroidOfPolygon(polygon: GeoBoundaryPolygon): GeoCentroid | null`: Calculates the centroid of a polygon.
    // - `intersects(rect1: GeoBoundaryRect, rect2: GeoBoundaryRect): boolean`: Checks for intersection between two bounding boxes.
    // - `transformCoordinates(point: GeoCentroid, fromCrs: string, toCrs: string): GeoCentroid`: Transforms coordinates between different Coordinate Reference Systems.
    // These methods would depend on the specific needs of the project for spatial analysis.
}