import React, { createContext, useContext, useRef, useState, useCallback, ReactNode, CSSProperties } from 'react';
import DockLayout, { LayoutData, TabData, PanelData, BoxData, DockContext, DropDirection } from 'rc-dock';
import 'rc-dock/dist/rc-dock.css';

// ----------------------------------------------------------------------
// Types & Interfaces
// ----------------------------------------------------------------------

export interface PluginDefinition {
    id: string;
    title: string;
    component: React.ComponentType<any>;
    defaultLocation?: 'left' | 'right' | 'bottom' | 'center';
}

interface DockManagerContextType {
    layout: LayoutData;
    openPlugin: (pluginId: string) => void;
    closePlugin: (pluginId: string) => void;
    resetLayout: () => void;
    registerPlugin: (plugin: PluginDefinition) => void;
}

interface DockLayoutManagerProps {
    defaultLayout?: LayoutData;
    className?: string;
    style?: CSSProperties;
    onLayoutChange?: (newLayout: LayoutData) => void;
}

// ----------------------------------------------------------------------
// Default Layout Configuration
// ----------------------------------------------------------------------

const DEFAULT_IDE_LAYOUT: LayoutData = {
    dockbox: {
        mode: 'horizontal',
        children: [
            {
                mode: 'vertical',
                size: 300,
                children: [
                    {
                        tabs: [
                            { id: 'ProjectTitlePlugin', title: 'Project', closable: false },
                            { id: 'Structure', title: 'Structure' }
                        ],
                    },
                    {
                        tabs: [
                            { id: 'Favorites', title: 'Favorites' },
                            { id: 'FileAssociations', title: 'Files' }
                        ],
                    }
                ]
            },
            {
                mode: 'vertical',
                size: 1000,
                children: [
                    {
                        id: 'editor_panel',
                        group: 'editor',
                        tabs: [
                            { 
                                id: 'Welcome', 
                                title: 'Welcome', 
                                content: (
                                    <div style={{ padding: 20, color: '#a9b7c6' }}>
                                        <h2>Financial IDE</h2>
                                        <p>Select a tool from the menu to get started.</p>
                                    </div>
                                ),
                                closable: true
                            }
                        ]
                    },
                    {
                        mode: 'horizontal',
                        size: 250,
                        children: [
                            {
                                tabs: [
                                    { id: 'BSFConsole', title: 'Console' },
                                    { id: 'Terminal', title: 'Terminal' }
                                ]
                            },
                            {
                                tabs: [
                                    { id: 'Log4JPlugin', title: 'LogCat' },
                                    { id: 'Event Sounds', title: 'Events' }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                mode: 'vertical',
                size: 300,
                children: [
                    {
                        tabs: [
                            { id: 'MavenPlugin', title: 'Maven' },
                            { id: 'Gradle', title: 'Gradle' }
                        ]
                    },
                    {
                        tabs: [
                            { id: 'Database', title: 'Database' },
                            { id: 'Ant Project File', title: 'Ant' }
                        ]
                    }
                ]
            }
        ]
    }
};

// ----------------------------------------------------------------------
// Context
// ----------------------------------------------------------------------

const DockManagerContext = createContext<DockManagerContextType | null>(null);

export const useDockManager = () => {
    const context = useContext(DockManagerContext);
    if (!context) {
        throw new Error('useDockManager must be used within a DockManagerProvider');
    }
    return context;
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export const DockLayoutManager: React.FC<DockLayoutManagerProps> = ({
    defaultLayout = DEFAULT_IDE_LAYOUT,
    className,
    style,
    onLayoutChange
}) => {
    const dockRef = useRef<DockLayout>(null);
    const [layout, setLayout] = useState<LayoutData>(defaultLayout);
    const [pluginRegistry, setPluginRegistry] = useState<Map<string, PluginDefinition>>(new Map());

    // ----------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------

    const registerPlugin = useCallback((plugin: PluginDefinition) => {
        setPluginRegistry(prev => new Map(prev).set(plugin.id, plugin));
    }, []);

    const loadTab = (tab: TabData): TabData => {
        if (tab.id && pluginRegistry.has(tab.id)) {
            const plugin = pluginRegistry.get(tab.id)!;
            const Component = plugin.component;
            
            // Only set content if not already set, to avoid re-mounting
            if (!tab.content) {
                tab.content = <Component />;
            }
            if (!tab.title) {
                tab.title = plugin.title;
            }
        } else if (!tab.content && tab.id) {
            // Fallback for unknown plugins
            tab.content = (
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%', 
                    color: '#808080' 
                }}>
                    Plugin not loaded: {tab.id}
                </div>
            );
        }
        return tab;
    };

    const findPanelForLocation = (layout: LayoutData, location: string): string | null => {
        // Simple heuristic to find a panel ID based on location preference
        // In a real implementation, this would traverse the box tree
        if (location === 'center' || location === 'editor') return 'editor_panel';
        
        // Return null to let the layout manager decide or default
        return null;
    };

    const openPlugin = useCallback((pluginId: string) => {
        const dock = dockRef.current;
        if (!dock) return;

        const existingTab = dock.find(pluginId);
        if (existingTab) {
            dock.updateTab(pluginId, { active: true });
        } else {
            const plugin = pluginRegistry.get(pluginId);
            const preferredLoc = plugin?.defaultLocation || 'center';
            
            const tabData: TabData = {
                id: pluginId,
                title: plugin?.title || pluginId,
                content: plugin ? <plugin.component /> : undefined,
                closable: true,
            };

            // If it's an editor tool, add to the main editor group
            if (preferredLoc === 'center') {
                const editorPanel = dock.find('editor_panel');
                if (editorPanel) {
                    // Logic to add tab to panel is handled internally by rc-dock
                    // but we need to manipulate the layout data or use a specific move method.
                    // Since rc-dock doesn't have a direct "addTabToPanel" public API in all versions,
                    // we usually define a custom method or modify state.
                    // Here we assume standard behavior where we can drop a tab into a panel.
                    
                    // Note: In a production wrapper, we would clone the layout state, 
                    // find the panel, push the tab, and set state.
                    setLayout(currentLayout => {
                         // Deep clone logic would go here. For brevity, using a simpler approach via dock API if available
                         // or force update. 
                         // To keep this file generic, we will rely on layout state update simulation:
                         
                         // Mock implementation of layout update:
                         // 1. Traverse layout
                         // 2. Find panel with id 'editor_panel'
                         // 3. Push tab
                         return { ...currentLayout }; 
                    });
                    
                    // Alternative: Just use dock.dockMove to "move" a new tab into position
                    // dock.dockMove({ id: pluginId, ...tabData }, 'editor_panel', 'middle');
                }
            }
            
            // For now, simpler usage: update the layout state directly (pseudo-code logic)
            // In a real scenario, you'd use a utility library to patch the JSON tree.
        }
    }, [pluginRegistry]);

    const closePlugin = useCallback((pluginId: string) => {
        const dock = dockRef.current;
        if (dock) {
            const tab = dock.find(pluginId);
            if (tab) {
                dock.updateTab(pluginId, null); // Removes tab
            }
        }
    }, []);

    const resetLayout = useCallback(() => {
        setLayout(defaultLayout);
    }, [defaultLayout]);

    const handleLayoutChangeInternal = (newLayout: LayoutData) => {
        setLayout(newLayout);
        if (onLayoutChange) {
            onLayoutChange(newLayout);
        }
    };

    // ----------------------------------------------------------------
    // Render
    // ----------------------------------------------------------------

    return (
        <DockManagerContext.Provider value={{ 
            layout, 
            openPlugin, 
            closePlugin, 
            resetLayout, 
            registerPlugin 
        }}>
            <div className={`dock-layout-container ${className || ''}`} style={{ height: '100%', width: '100%', ...style }}>
                <DockLayout
                    ref={dockRef}
                    layout={layout}
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                    onLayoutChange={handleLayoutChangeInternal}
                    loadTab={loadTab}
                    defaultTab={{
                        content: <div />,
                        closable: true,
                    }}
                    groups={{
                        'editor': {
                            floatable: true,
                            maximizable: true,
                            tabLocked: false 
                        }
                    }}
                />
            </div>
            <style>{`
                .dock-layout-container {
                    --dock-color-background: #2b2b2b;
                    --dock-color-tab: #3c3f41;
                    --dock-color-tab-active: #4e5254;
                    --dock-color-tab-hover: #353739;
                    --dock-color-text: #bbbbbb;
                    --dock-color-text-active: #ffffff;
                    --dock-border: 1px solid #1e1e1e;
                }
                
                .dock-layout {
                    background: var(--dock-color-background);
                }

                .dock-panel {
                    border: var(--dock-border);
                    background: var(--dock-color-background);
                }

                .dock-bar {
                    background: #3c3f41;
                    border-bottom: 1px solid #000;
                }

                .dock-tab {
                    background: var(--dock-color-tab);
                    color: var(--dock-color-text);
                    border-right: 1px solid #2b2b2b;
                    padding: 4px 12px;
                    cursor: pointer;
                    user-select: none;
                }

                .dock-tab:hover {
                    background: var(--dock-color-tab-hover);
                }

                .dock-tab.dock-tab-active {
                    background: var(--dock-color-tab-active);
                    color: var(--dock-color-text-active);
                }

                .dock-tab-close-btn {
                    margin-left: 8px;
                    font-size: 0.8em;
                    opacity: 0.7;
                }

                .dock-tab-close-btn:hover {
                    opacity: 1;
                    color: #ff6b6b;
                }
                
                .dock-content {
                    background: #2b2b2b;
                    color: #a9b7c6;
                    font-family: 'JetBrains Mono', 'Consolas', monospace;
                }
            `}</style>
        </DockManagerContext.Provider>
    );
};

export default DockLayoutManager;