interface TemporalAnchor {
    anchorId: string;
    branchName: string;
    timestamp: number; // Example: milliseconds since epoch
    metadata?: any;
}

export class TimelineBranch {
    private currentAnchor: TemporalAnchor;
    private branches: Map<string, TemporalAnchor[]>; // branchName -> list of historical anchors in this branch

    constructor(initialAnchorId: string, branchName: string = "main") {
        this.currentAnchor = {
            anchorId: initialAnchorId,
            branchName: branchName,
            timestamp: Date.now(),
        };
        this.branches = new Map();
        this.branches.set(branchName, [this.currentAnchor]);
    }

    /**
     * Returns the ID of the current simulation anchor/point in time.
     */
    public getCurrentAnchorId(): string {
        return this.currentAnchor.anchorId;
    }

    /**
     * Returns the name of the current branch.
     */
    public getCurrentBranchName(): string {
        return this.currentAnchor.branchName;
    }

    /**
     * Records a new state/event by creating a new temporal anchor, effectively moving forward in the current branch.
     * @param newAnchorId The unique ID for the new state.
     * @param metadata Any relevant data associated with this temporal state.
     */
    public advanceTimeline(newAnchorId: string, metadata?: any): void {
        const newAnchor: TemporalAnchor = {
            anchorId: newAnchorId,
            branchName: this.currentAnchor.branchName,
            timestamp: Date.now(),
            metadata: metadata,
        };

        this.currentAnchor = newAnchor;
        
        const history = this.branches.get(this.currentAnchor.branchName) || [];
        history.push(newAnchor);
        this.branches.set(this.currentAnchor.branchName, history);
    }

    /**
     * Creates a new branch based on the current anchor point.
     * @param newBranchName The name for the new branch.
     * @param baseAnchorId The anchor ID to start the new branch from. If not provided, the current anchor is used.
     */
    public switchBranch(newBranchName: string, baseAnchorId?: string): void {
        if (this.branches.has(newBranchName)) {
            throw new Error(`Branch '${newBranchName}' already exists.`);
        }

        const anchorToBranchFrom = baseAnchorId ? this.findAnchorInHistory(baseAnchorId) : this.currentAnchor;

        if (!anchorToBranchFrom) {
            throw new Error(`Anchor ID '${baseAnchorId || this.currentAnchor.anchorId}' not found for branching.`);
        }

        const newBranchStartingAnchor: TemporalAnchor = {
            anchorId: anchorToBranchFrom.anchorId, // The new branch starts *at* this anchor
            branchName: newBranchName,
            timestamp: Date.now(), // Timestamp for the moment of branching
            metadata: { baseAnchor: anchorToBranchFrom.anchorId, originalBranch: anchorToBranchFrom.branchName }
        };

        // Copy the history up to the base anchor from its original branch
        const baseHistory = this.branches.get(anchorToBranchFrom.branchName) || [];
        const baseIndex = baseHistory.findIndex(a => a.anchorId === anchorToBranchFrom.anchorId);

        let newHistory: TemporalAnchor[] = [];
        if (baseIndex !== -1) {
            // Copy the history leading up to and including the branching point
            newHistory = baseHistory.slice(0, baseIndex + 1);
        } else {
            // If the anchor wasn't found in its own branch history (shouldn't happen if findAnchorInHistory works)
            // or if it's the very first anchor, we still need to start the history.
            // This case might need more robust handling depending on how anchors are managed.
            // For now, assume anchorToBranchFrom is valid and exists in its branch.
        }
        
        // Add the newly created anchor as the starting point of this new branch's history
        newHistory.push(newBranchStartingAnchor);
        this.branches.set(newBranchName, newHistory);

        // Update the current anchor to reflect the new branch context
        this.currentAnchor = newBranchStartingAnchor;
    }

    /**
     * Moves the current timeline context to an existing anchor point, potentially switching branches if the anchor belongs to another branch.
     * @param anchorId The ID of the anchor to jump to.
     */
    public goToAnchor(anchorId: string): void {
        let foundAnchor: TemporalAnchor | null = null;
        let foundBranchName: string | null = null;

        // Search all branches for the anchor ID
        for (const [branchName, history] of this.branches.entries()) {
            const anchor = history.find(a => a.anchorId === anchorId);
            if (anchor) {
                foundAnchor = anchor;
                foundBranchName = branchName;
                break;
            }
        }

        if (!foundAnchor || !foundBranchName) {
            throw new Error(`Anchor ID '${anchorId}' not found across any timeline branch.`);
        }

        // Update the current anchor to point to the found anchor and its branch
        this.currentAnchor = {
            anchorId: foundAnchor.anchorId,
            branchName: foundBranchName,
            timestamp: Date.now(), // Update timestamp for context switch
            metadata: { original: foundAnchor.metadata, contextSwitch: true }
        };
    }

    /**
     * Retrieves the history of anchors for a specific branch.
     * @param branchName The name of the branch.
     */
    public getBranchHistory(branchName: string): TemporalAnchor[] | undefined {
        return this.branches.get(branchName);
    }

    /**
     * Helper to find an anchor in any known history by its ID.
     */
    private findAnchorInHistory(anchorId: string): TemporalAnchor | undefined {
        for (const history of this.branches.values()) {
            const anchor = history.find(a => a.anchorId === anchorId);
            if (anchor) {
                return anchor;
            }
        }
        return undefined;
    }

    /**
     * Gets all available branch names.
     */
    public getAllBranchNames(): string[] {
        return Array.from(this.branches.keys());
    }

    /**
     * Merges a specified branch into the current branch.
     * This is a simplified merge; a real-world scenario would involve conflict resolution.
     * @param sourceBranchName The name of the branch to merge from.
     * @param targetBranchName The name of the branch to merge into (defaults to current branch).
     */
    public mergeBranch(sourceBranchName: string, targetBranchName?: string): void {
        const effectiveTargetBranchName = targetBranchName || this.currentAnchor.branchName;

        if (!this.branches.has(sourceBranchName)) {
            throw new Error(`Source branch '${sourceBranchName}' does not exist.`);
        }
        if (!this.branches.has(effectiveTargetBranchName)) {
            throw new Error(`Target branch '${effectiveTargetBranchName}' does not exist.`);
        }

        const sourceHistory = this.branches.get(sourceBranchName)!;
        const targetHistory = this.branches.get(effectiveTargetBranchName)!;

        // Find the common ancestor or the latest anchor in the target branch that exists in the source branch's history
        // For simplicity, we'll just append unique anchors from the source to the target.
        // A more sophisticated merge would involve finding a common ancestor and replaying changes.

        const targetAnchorIds = new Set(targetHistory.map(anchor => anchor.anchorId));
        
        for (const anchor of sourceHistory) {
            if (!targetAnchorIds.has(anchor.anchorId)) {
                // This anchor is new to the target branch.
                // In a real merge, we'd need to ensure its dependencies are met or rebase.
                // For this simulation, we'll just add it.
                targetHistory.push(anchor);
                targetAnchorIds.add(anchor.anchorId); // Keep track of added anchors
            }
            // If anchor.anchorId exists in targetHistory, it implies a potential merge point or conflict.
            // This simplified merge doesn't handle conflicts.
        }

        // Update the branch in the map
        this.branches.set(effectiveTargetBranchName, targetHistory);

        // If the current anchor was in the source branch and we merged into the current branch,
        // we might want to update the current anchor to reflect the merged state.
        // This logic depends heavily on the desired merge strategy.
        // For now, we'll leave the current anchor as is unless the target branch was the current branch.
        if (effectiveTargetBranchName === this.currentAnchor.branchName) {
            // If the merge happened into the current branch, and the current anchor is now potentially outdated
            // or needs to reflect the merged state, we might need to update it.
            // A simple approach is to set the current anchor to the latest anchor of the merged branch.
            this.currentAnchor = targetHistory[targetHistory.length - 1];
        }
    }
}