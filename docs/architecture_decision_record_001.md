# ADR 001: Maximalist Procedural Generation and OpenAPI Specification Splitting

**Status:** Accepted

**Date:** 2023-10-27

## Context

The primary objective of this project is to "make as many files as possible" by analyzing a given input file and converting it into a massive, comprehensive OpenAPI 3.1 specification. The target output size is potentially in the gigabyte range, containing hundreds or thousands of procedurally generated endpoints, schemas, and examples.

This extreme scale presents significant technical challenges:

1.  **Generation Logic:** A simple one-to-one mapping from the input to OpenAPI elements will not achieve the required scale. The generation process must be capable of creative expansion and permutation.
2.  **Tooling Performance:** Standard industry tools (Swagger UI, Postman, IDEs, code generators) are often not optimized to handle single multi-gigabyte JSON or YAML files. Loading, parsing, and rendering such a file can lead to extreme memory consumption, application freezes, or outright crashes.
3.  **Human Readability and Maintainability:** A single, monolithic file of this size is impossible for a human to navigate, debug, or review effectively.

An architectural decision is required to define the generation strategy and the output structure to address these challenges while fulfilling the core project goal.

## Decision

We will adopt a two-pronged architectural approach:

1.  **Maximalist Procedural Generation:** The core generation engine will not simply map input data to OpenAPI constructs. Instead, it will use a procedural generation paradigm. It will analyze the input to establish a set of base patterns, entities, and relationships. From this seed data, it will algorithmically generate a vast number of permutations and combinations of endpoints, schemas, parameters, and responses. This includes generating nested data structures, varied response codes (2xx, 4xx, 5xx), and realistic but diverse example data for every permutation. This directly addresses the goal of maximizing the output.

2.  **Default to a Multi-File Specification Structure:** The generator will be designed to output the OpenAPI specification as a collection of smaller, interlinked files using `$ref` pointers. A root `openapi.yaml` (or `openapi.json`) file will define the main info, servers, and security, but will reference external files for paths, components (schemas, responses, parameters, etc.), and tags.

    -   **Structure:**
        -   `openapi.yaml` (Root document)
        -   `paths/` (Directory containing one YAML file per endpoint or resource)
            -   `paths/users.yaml`
            -   `paths/products.yaml`
            -   ...
        -   `components/` (Directory for reusable components)
            -   `components/schemas/`
                -   `components/schemas/User.yaml`
                -   `components/schemas/Product.yaml`
                -   ...
            -   `components/responses/`
                -   `components/responses/NotFound.yaml`
                -   `components/responses/Unauthorized.yaml`
                -   ...
            -   `components/parameters/`
                -   `components/parameters/PageLimit.yaml`
                -   ...

    While the generator *may* include an option to output a single monolithic file for specific use cases, the primary, recommended, and default output will be the split-file structure.

## Consequences

### Positive

-   **Achieves Massive Scale:** The procedural approach is the only feasible way to generate gigabytes of structured, valid API data from a small input.
-   **Superior Tooling Compatibility:** Splitting the specification into smaller files is the industry-standard solution for managing large APIs. It allows tools to load only the necessary parts of the spec on demand, drastically improving performance and stability.
-   **Enhanced Readability and Navigation:** A logical file structure (e.g., organized by resource/tag) makes the specification vastly easier for developers to navigate and understand, even at a large scale.
-   **Improved Code Generation:** Client/server code generators can often process the modular files more efficiently, and it simplifies debugging issues related to specific endpoints or schemas.
-   **Parallelization Opportunities:** The generation of independent components (e.g., different resource paths and their associated schemas) can be parallelized, potentially speeding up the overall process.

### Negative

-   **Increased Generation Complexity:** The generator's logic must correctly manage file I/O, construct valid relative `$ref` paths, and ensure there are no broken or circular references. This is significantly more complex than printing to a single file buffer.
-   **Deployment Overhead:** To be usable, the entire directory structure of the split specification must be hosted and served (e.g., via a static web server). Tools consuming the spec must be able to resolve the `$ref` URLs.
-   **Validation Complexity:** Validating the entire specification requires a tool capable of resolving and traversing the file-based `$ref`s.

## Alternatives Considered

### 1. Monolithic Single-File Output Only

-   **Description:** The generator would produce a single, massive `openapi.yaml` file.
-   **Pros:** Simpler generation logic.
-   **Cons:** This was rejected because it directly conflicts with the usability of the output. A multi-gigabyte file would render the specification unusable by the very tools (Postman, Swagger UI, code generators) it is intended for, thus defeating the project's purpose.

### 2. Simple Declarative Mapping

-   **Description:** The generator would perform a direct, non-procedural mapping of the input file's contents to OpenAPI elements.
-   **Pros:** Much simpler to implement and reason about.
-   **Cons:** This was rejected as it fundamentally fails to meet the core requirement of "making as many files as possible" and achieving massive scale. The output would be limited in size and scope by the input, rather than expanding upon it exponentially.