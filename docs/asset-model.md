# The Polymorphic Asset Model

This document provides a conceptual overview of the polymorphic asset model that underpins the entire system. Understanding this model is crucial for interacting with the API, designing integrations, and comprehending the various data structures involved.

## Introduction

At the heart of our platform lies the concept of an "Asset." An asset represents any distinct, manageable item within the system, whether it's a digital file, a physical object, a piece of software, or a collection of sensor data. To accommodate the vast diversity of these items while maintaining a unified management framework, we employ a **polymorphic asset model**.

Polymorphism allows us to treat different types of assets uniformly where common operations are concerned (e.g., listing all assets, assigning ownership, managing permissions) while also providing specific attributes and behaviors unique to each asset type. This approach ensures scalability, flexibility, and maintainability as new asset types are introduced.

## The Core `Asset` Entity

All assets, regardless of their specific type, share a common set of fundamental properties. These properties define the base `Asset` entity and provide a consistent foundation for identification, management, and auditing.

### Common Properties

Every asset in the system will possess the following core attributes:

*   **`id` (UUID)**: A unique identifier for the asset. This ID is immutable and serves as the primary key for referencing the asset across the system.
*   **`name` (String)**: A human-readable name for the asset. This name should be descriptive and can be updated.
*   **`description` (String, optional)**: A detailed explanation or summary of the asset's purpose, content, or characteristics.
*   **`assetType` (String)**: A discriminator field that explicitly defines the specific type of the asset (e.g., `ImageAsset`, `VideoAsset`, `DocumentAsset`, `PhysicalAsset`, `SoftwareAsset`, `SensorDataAsset`). This field is critical for understanding the asset's specific structure and available operations.
*   **`status` (Enum)**: The current lifecycle status of the asset (e.g., `Draft`, `Active`, `Archived`, `Deprecated`, `Deleted`). This status dictates what operations are permissible on the asset.
*   **`ownerId` (UUID)**: The ID of the user or organization responsible for the asset.
*   **`projectId` (UUID, optional)**: The ID of the project to which this asset belongs, if applicable. Assets can be organized within projects for better management and access control.
*   **`tags` (Array of Strings, optional)**: A list of keywords or labels used for categorization, search, and filtering.
*   **`createdAt` (DateTime)**: The timestamp when the asset was initially created in the system.
*   **`updatedAt` (DateTime)**: The timestamp of the last modification to the asset's core properties or its specific type properties.
*   **`createdBy` (UUID)**: The ID of the user who created the asset.
*   **`updatedBy` (UUID)**: The ID of the user who last updated the asset.
*   **`version` (Integer)**: An internal version number, incremented with each significant update to the asset's data. This is distinct from content versioning.

### The `assetType` Discriminator

The `assetType` field is the cornerstone of our polymorphic model. It acts as a **discriminator**, indicating which specific schema an asset instance conforms to beyond the base `Asset` properties. When retrieving an asset, the `assetType` value tells the client how to interpret the additional, type-specific fields present in the response.

For example, an asset with `assetType: "ImageAsset"` will include properties like `width`, `height`, and `format`, while an asset with `assetType: "VideoAsset"` will have `duration`, `resolution`, and `codec`.

## Polymorphic Asset Types

Building upon the base `Asset` entity, we define various specialized asset types. Each type extends the base with properties relevant to its specific nature. This section outlines some of the primary asset types supported by the system.

### Digital Assets

Digital assets represent any form of electronic content. They often share common properties related to file storage and access.

#### `DigitalAsset` (Abstract Base for Digital Content)

An abstract base type for all digital assets, adding properties common to files.

*   **`fileSize` (Integer)**: The size of the digital file in bytes.
*   **`mimeType` (String)**: The MIME type of the file (e.g., `image/jpeg`, `video/mp4`, `application/pdf`).
*   **`storagePath` (String)**: The internal path or URI where the digital content is stored (e.g., S3 bucket path, internal file system path).
*   **`checksum` (String)**: A hash (e.g., MD5, SHA256) of the file content for integrity verification.
*   **`downloadUrl` (String, optional)**: A pre-signed URL for temporary direct download of the asset content.

#### `ImageAsset`

Represents a digital image file.

*   **`assetType`: "ImageAsset"**
*   **Inherits from**: `DigitalAsset`
*   **Specific Properties**:
    *   **`width` (Integer)**: The width of the image in pixels.
    *   **`height` (Integer)**: The height of the image in pixels.
    *   **`format` (String)**: The image file format (e.g., `JPEG`, `PNG`, `GIF`, `SVG`).
    *   **`altText` (String, optional)**: Alternative text for accessibility purposes.
    *   **`thumbnailUrl` (String, optional)**: URL to a generated thumbnail image.

#### `VideoAsset`

Represents a digital video file.

*   **`assetType`: "VideoAsset"**
*   **Inherits from**: `DigitalAsset`
*   **Specific Properties**:
    *   **`duration` (Integer)**: The duration of the video in seconds.
    *   **`resolution` (String)**: The video resolution (e.g., `1920x1080`, `3840x2160`).
    *   **`codec` (String)**: The video codec used (e.g., `H.264`, `VP9`).
    *   **`frameRate` (Number)**: The frame rate of the video in frames per second.
    *   **`previewImageUrl` (String, optional)**: URL to a static image preview of the video.

#### `DocumentAsset`

Represents a digital document file (e.g., PDF, Word document, spreadsheet).

*   **`assetType`: "DocumentAsset"**
*   **Inherits from**: `DigitalAsset`
*   **Specific Properties**:
    *   **`pageCount` (Integer)**: The number of pages in the document.
    *   **`language` (String, optional)**: The primary language of the document content (e.g., `en-US`, `fr-FR`).
    *   **`author` (String, optional)**: The author(s) of the document.
    *   **`keywords` (Array of Strings, optional)**: Keywords extracted from the document content.

### Physical Assets

Represents tangible, real-world objects that need to be tracked and managed.

*   **`assetType`: "PhysicalAsset"**
*   **Inherits from**: `Asset`
*   **Specific Properties**:
    *   **`location` (String)**: The current physical location of the asset (e.g., `Warehouse A, Shelf 3`, `Office 201`).
    *   **`serialNumber` (String, optional)**: A unique manufacturer serial number.
    *   **`modelNumber` (String, optional)**: The model number of the physical item.
    *   **`manufacturer` (String, optional)**: The manufacturer of the asset.
    *   **`acquisitionDate` (Date, optional)**: The date when the asset was acquired.
    *   **`warrantyEndDate` (Date, optional)**: The end date of the asset's warranty.
    *   **`condition` (Enum)**: The current physical condition of the asset (e.g., `New`, `Used`, `Damaged`, `Under Repair`).

### Software Assets

Represents software components, applications, codebases, or licenses.

*   **`assetType`: "SoftwareAsset"**
*   **Inherits from**: `Asset`
*   **Specific Properties**:
    *   **`versionNumber` (String)**: The specific version of the software (e.g., `1.0.5`, `2.1-beta`).
    *   **`licenseType` (String, optional)**: The type of software license (e.g., `MIT`, `GPLv3`, `Proprietary`).
    *   **`repositoryUrl` (String, optional)**: URL to the source code repository (e.g., GitHub, GitLab).
    *   **`deploymentEnvironment` (Array of Strings, optional)**: Environments where the software is deployed (e.g., `Production`, `Staging`, `Development`).
    *   **`dependencies` (Array of Strings, optional)**: A list of other software assets or libraries this software depends on.
    *   **`documentationUrl` (String, optional)**: URL to the software's documentation.

### Sensor Data Assets

Represents collections or streams of data generated by sensors or IoT devices.

*   **`assetType`: "SensorDataAsset"**
*   **Inherits from**: `Asset`
*   **Specific Properties**:
    *   **`sensorType` (String)**: The type of sensor generating the data (e.g., `Temperature`, `Humidity`, `Pressure`, `GPS`).
    *   **`dataType` (String)**: The specific data format or schema of the sensor readings (e.g., `JSON`, `CSV`, `Protobuf`).
    *   **`measurementUnit` (String, optional)**: The unit of measurement for the sensor data (e.g., `Celsius`, `kPa`, `meters/second`).
    *   **`collectionFrequency` (String, optional)**: How often data is collected (e.g., `10s`, `1min`, `hourly`).
    *   **`dataRetentionPolicy` (String, optional)**: Policy for how long the raw sensor data is retained.
    *   **`dataEndpoint` (String, optional)**: An API endpoint or stream URL to access the raw or processed sensor data.

## Relationships and Dependencies

Assets rarely exist in isolation. The model supports various relationships to represent complex structures and dependencies:

*   **Parent-Child Relationships**: Assets can be organized hierarchically. For example, a `Project` asset might contain multiple `DocumentAsset`s and `ImageAsset`s. A `SoftwareAsset` might have `ModuleAsset` children.
*   **Dependencies**: An asset can declare dependencies on other assets. For instance, a `VideoAsset` might depend on an `AudioAsset` and several `ImageAsset`s for its creation. A `SoftwareAsset` might depend on a `LibraryAsset`.
*   **Associations**: Generic links to other assets or entities within the system (e.g., an `ImageAsset` associated with a `Product` entity).

These relationships are typically managed through dedicated fields (e.g., `parentId`, `relatedAssetIds`) or through separate relationship entities, allowing for flexible graph-like structures.

## Asset Lifecycle and Versioning

Assets progress through various stages in their lifecycle, and their content or metadata may evolve over time.

*   **Status Management**: The `status` field (e.g., `Draft`, `Active`, `Archived`) governs the visibility and mutability of an asset. Transitions between statuses are often controlled by specific API actions and permissions.
*   **Content Versioning**: For digital assets, the actual content (e.g., the image file, the document text) can undergo multiple revisions. This is typically managed by a separate versioning system, where each version of the content is itself an immutable object, and the `DigitalAsset` points to its current active content version. The API will provide mechanisms to retrieve specific content versions.
*   **Metadata Versioning**: The `version` field on the base `Asset` tracks changes to the asset's metadata (e.g., name, description, tags, owner). This allows for auditing and potentially reverting metadata changes.

## Implications for API Design

The polymorphic asset model has significant implications for how the API is structured:

*   **Unified Asset Endpoint**: A primary `/assets` endpoint allows for generic operations (e.g., `GET /assets` to list all assets, `GET /assets/{id}` to retrieve any asset by ID). The response for `GET /assets/{id}` will include the `assetType` discriminator, allowing clients to correctly parse the full asset object.
*   **Type-Specific Endpoints (Optional)**: While a unified endpoint is powerful, specific operations might be better exposed through type-specific endpoints (e.g., `/images`, `/videos`). These endpoints could offer specialized filtering or actions relevant only to that asset type.
*   **Schema Definition**: The OpenAPI specification will leverage `oneOf` or `anyOf` with a `discriminator` to define the polymorphic nature of the `Asset` schema, ensuring that clients can correctly generate models for all asset types.
*   **Filtering and Searching**: The API will support robust filtering based on common properties (e.g., `status`, `ownerId`, `tags`) and also allow filtering by `assetType` to retrieve only specific kinds of assets.
*   **Request Bodies**: When creating or updating assets, the request body will include the `assetType` field, and the rest of the payload will conform to the schema of that specific asset type.

## Conclusion

The polymorphic asset model provides a robust and flexible foundation for managing diverse items within our system. By defining a common base `Asset` and extending it with type-specific properties, we enable both unified management and specialized handling. This model is designed to scale, accommodate future asset types, and facilitate the creation of a powerful, intuitive, and machine-readable API.