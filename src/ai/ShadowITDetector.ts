```typescript
export class ShadowITDetector {
    private suspiciousPatterns: string[] = [
        ".*test.*",
        ".*demo.*",
        ".*sample.*",
        ".*billgates.*",
        ".*[0-9]{3,}.*", // Looks for applications with long sequences of numbers.
    ];

    constructor() {
        //Can add more patterns via constructor arguments if needed.
    }

    public isSuspiciousAppName(appName: string): boolean {
        if (!appName) {
            return false;
        }

        const lowerCaseAppName = appName.toLowerCase();
        for (const pattern of this.suspiciousPatterns) {
            const regex = new RegExp(pattern);
            if (regex.test(lowerCaseAppName)) {
                return true;
            }
        }
        return false;
    }

    // Example anomaly detection (can be expanded with more sophisticated algorithms)
    public detectNameAnomaly(displayName: string): boolean {
        if (!displayName) {
            return false;
        }

        // Check for unusual character combinations or excessive length
        if (/[^a-zA-Z0-9\s\-]+/.test(displayName) || displayName.length > 50) {
            return true;
        }

        return false;
    }


    public isPotentialShadowIT(app: { displayName: string }): boolean {
        return this.isSuspiciousAppName(app.displayName) || this.detectNameAnomaly(app.displayName);
    }

}
```