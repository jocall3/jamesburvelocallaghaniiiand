interface TemporalAnchor {
    anchorId: string;
    branchName: string;
    timestamp: number; // Example: milliseconds since epoch
    metadata?: any;
}

export class TimelineBranch {
    private currentAnchor: TemporalAnchor;
    private branches: Map<string, TemporalAnchor[]>; // anchorId -> list of historical anchors in this branch

    constructor(initialAnchorId: string, branchName: string = "main") {
        this.currentAnchor = {
            anchorId: initialAnchorId,
            branchName: branchName,
            timestamp: Date.now(),
        };
        this.branches = new Map();
        this.branches.set(initialAnchorId, [this.currentAnchor]);
    }

    /**
     * Returns the ID of the current simulation anchor/point in time.
     */
    public getCurrentAnchorId(): string {
        return this.currentAnchor.anchorId;
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
        
        // Append to the history of the current branch
        const history = this.branches.get(this.currentAnchor.branchName) || [];
        // Since we are advancing, we might need logic here to decide if we are continuing an existing chain
        // or starting a new one if the anchor ID implies a branch switch was attempted but not through switchBranch.
        
        // For simplicity, assume advancing always appends to the latest recorded anchor's chain for the current branch name.
        // If the currentAnchor.anchorId is new, we implicitly start a new chain under the current branchName.
        
        history.push(newAnchor);
        this.branches.set(this.currentAnchor.branchName, history);
    }

    /**
     * Creates a new branch based on the current anchor point.
     * @param newBranchName The name for the new branch.
     * @param newAnchorId The anchor ID to start the new branch from (usually the current one).
     */
    public switchBranch(newBranchName: string, newAnchorId?: string): void {
        if (this.branches.has(newBranchName)) {
            throw new Error(`Branch '${newBranchName}' already exists.`);
        }

        const anchorToBranchFrom = newAnchorId ? this.findAnchorInHistory(newAnchorId) : this.currentAnchor;

        if (!anchorToBranchFrom) {
            throw new Error(`Anchor ID ${newAnchorId} not found for branching.`);
        }

        this.currentAnchor = {
            anchorId: anchorToBranchFrom.anchorId,
            branchName: newBranchName,
            timestamp: Date.now(), // Timestamp for the moment of branching
            metadata: { baseAnchor: anchorToBranchFrom.anchorId }
        };

        // Copy the history up to the base anchor, then set the current anchor as the first element of the new branch's history
        const baseHistory = this.branches.get(anchorToBranchFrom.branchName) || [];
        const baseIndex = baseHistory.findIndex(a => a.anchorId === anchorToBranchFrom.anchorId);

        let newHistory: TemporalAnchor[] = [];
        if (baseIndex !== -1) {
            // Copy the history leading up to the branching point
            newHistory = baseHistory.slice(0, baseIndex + 1);
        }
        
        // Add the newly created current anchor as the starting point of this new branch
        newHistory.push(this.currentAnchor);
        this.branches.set(newBranchName, newHistory);
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

        this.currentAnchor = {
            anchorId: foundAnchor.anchorId,
            branchName: foundBranchName,
            timestamp: Date.now(), // Update timestamp for context switch
            metadata: { original: foundAnchor.metadata }
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
     * Helper to find an anchor in any known history, used for branching.
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
}
