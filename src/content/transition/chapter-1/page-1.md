# Transition - Chapter 1: The Migration Path - Transition 7.1

## Introduction to Transition 7.1

Transition 7.1 marks a significant milestone in the evolution of our platform. This release focuses heavily on streamlining the migration path for existing users while introducing foundational elements for future scalability and performance enhancements. This chapter serves as the definitive guide for understanding the changes, potential impacts, and the step-by-step process required to successfully transition your existing infrastructure to the 7.1 standard.

The core philosophy behind 7.1 was **"Stability through Controlled Evolution."** We aimed to minimize breaking changes where possible, but critical architectural shifts necessitated certain mandatory updates.

---

## Key Architectural Shifts in 7.1

Transition 7.1 introduces several under-the-hood changes that affect how modules interact with the core runtime environment. Understanding these shifts is crucial for troubleshooting post-migration issues.

### 1. Deprecation of Legacy Context Handlers (LCH)

The old `ContextHandler.v3` interface, which relied on synchronous state locking, has been formally deprecated and removed in favor of the new **Asynchronous State Manager (ASM)**.

*   **Impact:** Any module relying on direct, synchronous calls to `ContextHandler.v3.getState()` will fail compilation or result in runtime deadlocks if not updated.
*   **Migration Action:** All instances must be refactored to use the new `ASM.fetchState(contextId, timeoutMs)` pattern, which returns a Promise.

### 2. Unified Dependency Resolution (UDR)

Dependency resolution has moved from a file-system-based scan to a centralized manifest system (`manifest.json` located in the root configuration directory).

*   **Benefit:** Faster startup times and deterministic builds.
*   **Breaking Change:** Modules can no longer implicitly load dependencies based on directory structure. All required external libraries *must* be explicitly listed in the project's `manifest.json` under the `dependencies` array.

### 3. Enhanced Security Primitives (ESP)

We have upgraded the default cryptographic libraries used for session management and data serialization.

*   **Old Standard:** SHA-256 with proprietary salting.
*   **New Standard (7.1+):** Argon2id for password hashing and AES-256-GCM for data encryption.

This change is largely transparent for standard operations, but any custom security hooks or serialization layers that bypassed default encryption must be reviewed, as the underlying library calls have changed signature.

---

## The Migration Checklist: Phase by Phase

The transition process is broken down into three distinct phases to ensure a smooth rollout.

### Phase 1: Pre-Migration Assessment (Read-Only)

Before touching any production code, run the automated assessment tool provided in the 7.1 SDK (`/tools/assess_71.sh`).

| Step | Description | Status Check |
| :--- | :--- | :--- |
| 1.1 | **Environment Check** | Verify target OS/Runtime compatibility (requires Node 18+ or Python 3.10+). |
| 1.2 | **LCH Scan** | Identify all files referencing `ContextHandler.v3`. |
| 1.3 | **Manifest Generation** | Create an initial `manifest.json` based on current imports. |
| 1.4 | **Configuration Backup** | Archive the entire `/config` directory. |

### Phase 2: Code Refactoring (Mandatory Updates)

This phase involves modifying the source code to comply with the new architectural standards.

#### 2.1 Updating Context Handlers

For every identified LCH usage (from Step 1.2), replace the synchronous call structure:

**Before (Legacy):**
```javascript
const state = ContextHandler.v3.getState(userId);
// ... process state synchronously
```

**After (7.1 ASM):**
```javascript
import { ASM } from '@platform/runtime';

async function processUser(userId) {
    try {
        const state = await ASM.fetchState(userId, 5000); // 5-second timeout
        // ... process state asynchronously
    } catch (error) {
        console.error(`Failed to fetch state for ${userId}:`, error.message);
    }
}
```

#### 2.2 Validating Dependencies

Ensure that every dependency listed in the newly generated `manifest.json` is correctly versioned and resolves without conflict when running `npm install` or `pip install -r requirements.txt` against the new structure.

### Phase 3: Validation and Deployment

Once refactoring is complete, the system must be validated against the new security primitives.

1.  **Run Unit Tests:** All existing unit tests must pass against the 7.1 runtime environment.
2.  **Security Audit:** Execute the `security_check_71.py` script to confirm that all session tokens generated post-migration use the Argon2id standard.
3.  **Staging Deployment:** Deploy to a staging environment identical to production for a minimum 48-hour soak test. Pay close attention to latency spikes during state retrieval operations.

---

## Troubleshooting Common 7.1 Migration Errors

| Error Code | Description | Likely Cause & Fix |
| :--- | :--- | :--- |
| `ERR_ASM_TIMEOUT` | Asynchronous State Manager failed to return state within the specified timeout. | **Cause:** Deadlock or extremely slow external service dependency. **Fix:** Increase the timeout value in `ASM.fetchState` or optimize the dependency service. |
| `ERR_MANIFEST_MISSING` | A required module could not be loaded at runtime. | **Cause:** Dependency was not explicitly added to `manifest.json`. **Fix:** Add the missing package to the manifest and re-run the build tool. |
| `WARN_LCH_STALE` | Legacy Context Handler code was detected but wrapped in a try/catch block that suppressed the error. | **Cause:** Incomplete refactoring. **Fix:** Remove the try/catch and implement the full ASM asynchronous pattern (Section 2.1). |

This controlled transition ensures that while we embrace the performance gains of 7.1, the integrity of your existing data and business logic remains paramount. Proceed methodically through the phases outlined above.