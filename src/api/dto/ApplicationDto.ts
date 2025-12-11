export interface ApplicationDto {
    id: string;
    displayName: string;
    appId: string;
    createdDateTime: string;
    applicationType: string;
    accountEnabled: boolean;
    applicationVisibility: 'Visible' | 'Hidden';
    assignmentRequired: boolean;
    isAppProxy: boolean;
}
