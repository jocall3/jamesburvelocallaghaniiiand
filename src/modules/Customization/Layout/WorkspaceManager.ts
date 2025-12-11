```typescript
interface WorkspaceLayout {
    [key: string]: any;
}

interface WorkspaceConfig {
    name: string;
    layout: WorkspaceLayout;
}

class WorkspaceManager {
    private static readonly STORAGE_KEY = 'workspaceConfigs';

    static saveWorkspace(name: string, layout: WorkspaceLayout): void {
        const config: WorkspaceConfig = { name, layout };
        const existingConfigs = WorkspaceManager.loadAllWorkspaces();
        existingConfigs.push(config);
        WorkspaceManager.saveAllWorkspaces(existingConfigs);
    }

    static loadWorkspace(name: string): WorkspaceLayout | null {
        const existingConfigs = WorkspaceManager.loadAllWorkspaces();
        const config = existingConfigs.find(c => c.name === name);
        return config ? config.layout : null;
    }

    static deleteWorkspace(name: string): void {
        let existingConfigs = WorkspaceManager.loadAllWorkspaces();
        existingConfigs = existingConfigs.filter(c => c.name !== name);
        WorkspaceManager.saveAllWorkspaces(existingConfigs);
    }

    static loadAllWorkspaces(): WorkspaceConfig[] {
        const storedConfigs = localStorage.getItem(WorkspaceManager.STORAGE_KEY);
        return storedConfigs ? JSON.parse(storedConfigs) : [];
    }

    private static saveAllWorkspaces(configs: WorkspaceConfig[]): void {
        localStorage.setItem(WorkspaceManager.STORAGE_KEY, JSON.stringify(configs));
    }

    static renameWorkspace(oldName: string, newName: string): void {
        const existingConfigs = WorkspaceManager.loadAllWorkspaces();
        const configIndex = existingConfigs.findIndex(c => c.name === oldName);
        if (configIndex !== -1) {
            existingConfigs[configIndex].name = newName;
            WorkspaceManager.saveAllWorkspaces(existingConfigs);
        }
    }
}

export default WorkspaceManager;
```