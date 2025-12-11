```typescript
export class ApplicationEntity {
    id: string;
    displayName: string;
    appId: string;
    createdDateTime: string;
    applicationType?: string;
    accountEnabled?: boolean;
    applicationVisibility?: string;
    assignmentRequired?: boolean;
    isAppProxy?: boolean;

    constructor(data: {
        id: string,
        displayName: string,
        appId: string,
        createdDateTime: string,
        applicationType?: string,
        accountEnabled?: boolean,
        applicationVisibility?: string,
        assignmentRequired?: boolean,
        isAppProxy?: boolean
    }) {
        this.id = data.id;
        this.displayName = data.displayName;
        this.appId = data.appId;
        this.createdDateTime = data.createdDateTime;
        this.applicationType = data.applicationType;
        this.accountEnabled = data.accountEnabled;
        this.applicationVisibility = data.applicationVisibility;
        this.assignmentRequired = data.assignmentRequired;
        this.isAppProxy = data.isAppProxy;
    }

    get isMicrosoftApp(): boolean {
        return this.applicationType === 'Microsoft Application';
    }

    get isEnterpriseApplication(): boolean {
        return this.applicationType === 'Enterprise Application';
    }
    
    get isVisible(): boolean {
        return this.applicationVisibility === 'Visible';
    }

    get isAccountEnabled(): boolean {
        return this.accountEnabled === true || this.accountEnabled === undefined;
    }
    
    get isAssignmentRequired(): boolean {
        return this.assignmentRequired === true;
    }
}
```