```typescript
export interface SecurityRisk {
    id: string;
    displayName: string;
    appId: string;
    createdDateTime: string;
    applicationType: string;
    accountEnabled: boolean;
    applicationVisibility: string;
    assignmentRequired: boolean;
    isAppProxy: boolean;
}

export enum AlertLevel {
    High = 'High',
    Medium = 'Medium',
    Low = 'Low',
    Informational = 'Informational'
}
```