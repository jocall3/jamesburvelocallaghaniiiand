import React, { useState, useEffect, useMemo } from 'react';

// Interfaces for the Plugin Registry
interface Plugin {
    id: string;
    name: string;
    description: string;
    version: string;
    author: string;
    downloads: number;
    category: 'Finance' | 'Utility' | 'Core' | 'Integration' | 'Tool';
    status: 'available' | 'installed' | 'update_available';
}

// A subset of the massive list provided in the project goal, adapted for the UI
const MOCK_PLUGIN_DATA: Plugin[] = [
    { id: 'p-001', name: 'ColourChooser', description: 'Advanced color selection tool for financial charts.', version: '1.2.0', author: 'Community', downloads: 1200, category: 'Tool', status: 'available' },
    { id: 'p-002', name: 'Gold Section', description: 'Golden ratio analysis for market trends.', version: '2.0.1', author: 'FinTech Corp', downloads: 5400, category: 'Finance', status: 'installed' },
    { id: 'p-003', name: 'SvgViewer', description: 'View Scalable Vector Graphics within the dashboard.', version: '1.0.5', author: 'OpenSource', downloads: 800, category: 'Utility', status: 'available' },
    { id: 'p-004', name: 'ImageView', description: 'Basic image viewer extension.', version: '1.1.0', author: 'Core Team', downloads: 3000, category: 'Core', status: 'installed' },
    { id: 'p-005', name: 'BSFConsole', description: 'Bean Scripting Framework console for automation.', version: '0.9.beta', author: 'Scripters', downloads: 450, category: 'Tool', status: 'available' },
    { id: 'p-006', name: 'ChatPlugin', description: 'Internal communication tool for trading desks.', version: '3.1.2', author: 'CommSys', downloads: 8900, category: 'Integration', status: 'update_available' },
    { id: 'p-007', name: 'FileAssociations', description: 'Manage file type associations for proprietary formats.', version: '1.0.0', author: 'System', downloads: 1500, category: 'Core', status: 'installed' },
    { id: 'p-008', name: 'HexView', description: 'Hexadecimal viewer for binary data analysis.', version: '1.4.0', author: 'DevTools', downloads: 2200, category: 'Tool', status: 'available' },
    { id: 'p-009', name: 'JarSpyPlugin', description: 'Inspect internal JAR structures.', version: '0.5.0', author: 'SpyWare (JK)', downloads: 600, category: 'Tool', status: 'available' },
    { id: 'p-010', name: 'Log4JPlugin', description: 'Enhanced logging capabilities and viewer.', version: '2.14.1', author: 'Apache Foundation', downloads: 12000, category: 'Core', status: 'update_available' },
    { id: 'p-011', name: 'Macros Manager', description: 'Automate repetitive financial calculations.', version: '4.0.0', author: 'ProductivityInc', downloads: 7500, category: 'Finance', status: 'installed' },
    { id: 'p-012', name: 'SystemProperties', description: 'View and edit system properties.', version: '1.1.1', author: 'SysAdmin', downloads: 900, category: 'Utility', status: 'available' },
    { id: 'p-013', name: 'RegexPlugin', description: 'Regular expression tester and generator.', version: '1.3.4', author: 'RegExWizard', downloads: 3400, category: 'Tool', status: 'available' },
    { id: 'p-014', name: 'RemoteSynchronizer', description: 'Sync data across remote financial nodes.', version: '2.5.0', author: 'NetSync', downloads: 1100, category: 'Integration', status: 'available' },
    { id: 'p-015', name: 'ShowEncodingPlugin', description: 'Display file encoding details in status bar.', version: '1.0.2', author: 'TextMaster', downloads: 500, category: 'Utility', status: 'installed' },
    { id: 'p-016', name: 'SpellCheckPlugin', description: 'Spell checker for reports and documentation.', version: '2.0.0', author: 'GrammarPolice', downloads: 6700, category: 'Utility', status: 'available' },
    { id: 'p-017', name: 'Time Convertor Plugin', description: 'Convert between timezones and epoch timestamps.', version: '1.5.0', author: 'TimeLord', downloads: 2300, category: 'Utility', status: 'available' },
    { id: 'p-018', name: 'RSSPlugin', description: 'Read financial news feeds directly in the IDE.', version: '3.0.1', author: 'NewsFeed', downloads: 4100, category: 'Integration', status: 'available' },
    { id: 'p-019', name: 'Module Dependency Graph', description: 'Visualize dependencies between financial modules.', version: '1.2.0', author: 'GraphViz', downloads: 1800, category: 'Core', status: 'available' },
    { id: 'p-020', name: 'SimplePowerPack', description: 'A collection of useful utilities.', version: '5.0.0', author: 'PowerUser', downloads: 9000, category: 'Tool', status: 'update_available' },
    { id: 'p-021', name: 'Native Neighbourhood', description: 'Integration with OS file explorer.', version: '1.1.0', author: 'NativeSoft', downloads: 2100, category: 'Integration', status: 'available' },
    { id: 'p-022', name: 'Eclipse Workspace Importer', description: 'Import projects from Eclipse workspaces.', version: '0.8.0', author: 'Migrator', downloads: 1300, category: 'Tool', status: 'available' },
    { id: 'p-023', name: 'Native2Ascii', description: 'Convert native encoding to ASCII.', version: '1.0.0', author: 'Charset', downloads: 400, category: 'Utility', status: 'available' },
    { id: 'p-024', name: 'ProjectTitlePlugin', description: 'Customize the window title bar.', version: '1.2.1', author: 'Customizer', downloads: 1600, category: 'Utility', status: 'installed' },
    { id: 'p-025', name: 'IntelliTail', description: 'Log tailing within the application.', version: '2.3.0', author: 'LogMaster', downloads: 3200, category: 'Tool', status: 'available' },
    { id: 'p-026', name: 'Time Tracker Plugin', description: 'Track time spent on specific tasks.', version: '1.8.0', author: 'Manager', downloads: 4500, category: 'Tool', status: 'installed' },
    { id: 'p-027', name: 'LogFilter', description: 'Filter log outputs based on patterns.', version: '1.1.0', author: 'DevOps', downloads: 2800, category: 'Tool', status: 'available' },
    { id: 'p-028', name: 'VMOptions', description: 'Edit VM options easily.', version: '1.0.0', author: 'Core', downloads: 5000, category: 'Core', status: 'available' },
    { id: 'p-029', name: 'OpenWith', description: 'Open files with external applications.', version: '1.3.0', author: 'Integrator', downloads: 2200, category: 'Integration', status: 'installed' },
    { id: 'p-030', name: 'Library Finder', description: 'Find and attach source libraries.', version: '2.0.0', author: 'LibMan', downloads: 1500, category: 'Core', status: 'available' },
    { id: 'p-031', name: 'PrivateWriteInspection', description: 'Code inspection for private field writes.', version: '1.0.1', author: 'CodeQuality', downloads: 700, category: 'Tool', status: 'available' },
    { id: 'p-032', name: 'Inspection-JS', description: 'JavaScript code inspections.', version: '3.0.0', author: 'WebDev', downloads: 8000, category: 'Tool', status: 'update_available' },
    { id: 'p-033', name: 'JavadocWriter', description: 'Generate Javadoc comments automatically.', version: '1.4.0', author: 'DocBot', downloads: 3600, category: 'Tool', status: 'available' },
    { id: 'p-034', name: 'AutoBoxing', description: 'Detect auto-boxing issues in performance critical code.', version: '1.1.0', author: 'PerfExpert', downloads: 1200, category: 'Tool', status: 'available' },
    { id: 'p-035', name: 'CamouflagePlugin', description: 'UI theming to blend with OS.', version: '1.2.0', author: 'ThemeMaster', downloads: 5500, category: 'Utility', status: 'available' },
    { id: 'p-036', name: 'SimpleIntentions', description: 'Quick fixes for common code issues.', version: '2.1.0', author: 'Helper', downloads: 4100, category: 'Tool', status: 'installed' },
    { id: 'p-037', name: 'Subversion_QintSoft', description: 'Subversion VCS integration.', version: '1.8.0', author: 'QintSoft', downloads: 2000, category: 'Integration', status: 'available' },
    { id: 'p-038', name: 'Surround', description: 'Surround code blocks with templates.', version: '1.0.5', author: 'Templater', downloads: 3000, category: 'Tool', status: 'available' },
    { id: 'p-039', name: 'ClearcaseIntegration', description: 'ClearCase VCS integration.', version: '4.0.0', author: 'IBM', downloads: 1000, category: 'Integration', status: 'available' },
    { id: 'p-040', name: 'CVS Report', description: 'Generate reports from CVS history.', version: '1.0.0', author: 'LegacyVCS', downloads: 200, category: 'Tool', status: 'available' },
];

const PluginRegistry: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('All');
    const [plugins, setPlugins] = useState<Plugin[]>(MOCK_PLUGIN_DATA);
    const [isLoading, setIsLoading] = useState(false);

    // Filter plugins based on search and category
    const filteredPlugins = useMemo(() => {
        return plugins.filter(plugin => {
            const matchesSearch = plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  plugin.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'All' || plugin.category === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, filterCategory, plugins]);

    // Handle Install Action
    const handleInstall = (id: string) => {
        setIsLoading(true);
        // Simulate network request
        setTimeout(() => {
            setPlugins(prev => prev.map(p => p.id === id ? { ...p, status: 'installed' } : p));
            setIsLoading(false);
        }, 1000);
    };

    // Handle Uninstall Action
    const handleUninstall = (id: string) => {
        if (!window.confirm("Are you sure you want to uninstall this module?")) return;
        setIsLoading(true);
        setTimeout(() => {
            setPlugins(prev => prev.map(p => p.id === id ? { ...p, status: 'available' } : p));
            setIsLoading(false);
        }, 800);
    };

    // Handle Update Action
    const handleUpdate = (id: string) => {
        setIsLoading(true);
        setTimeout(() => {
            setPlugins(prev => prev.map(p => p.id === id ? { ...p, status: 'installed', version: updateVersion(p.version) } : p));
            setIsLoading(false);
        }, 1200);
    };

    const updateVersion = (v: string) => {
        const parts = v.split('.').map(Number);
        if (parts.length >= 3) {
            parts[2] = parts[2] + 1;
            return parts.join('.');
        }
        return v + '.1';
    };

    // Style constants
    const styles = {
        container: {
            padding: '20px',
            fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
            color: '#333',
            backgroundColor: '#f4f6f8',
            minHeight: '100vh',
        },
        header: {
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #ddd',
            paddingBottom: '15px',
        },
        title: {
            fontSize: '24px',
            fontWeight: 600,
            color: '#2c3e50',
        },
        controls: {
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
        },
        searchInput: {
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            width: '300px',
            fontSize: '14px',
        },
        selectInput: {
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '14px',
            backgroundColor: '#fff',
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
        },
        card: {
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'space-between',
            transition: 'transform 0.2s',
        },
        cardHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '10px',
        },
        pluginName: {
            fontWeight: 700,
            fontSize: '16px',
            color: '#2980b9',
        },
        pluginVersion: {
            fontSize: '12px',
            color: '#7f8c8d',
            backgroundColor: '#ecf0f1',
            padding: '2px 6px',
            borderRadius: '4px',
        },
        pluginDesc: {
            fontSize: '14px',
            color: '#555',
            lineHeight: '1.5',
            marginBottom: '15px',
            flexGrow: 1,
        },
        metaInfo: {
            fontSize: '12px',
            color: '#95a5a6',
            marginBottom: '15px',
            display: 'flex',
            gap: '10px',
        },
        actionArea: {
            borderTop: '1px solid #eee',
            paddingTop: '15px',
            display: 'flex',
            justifyContent: 'flex-end',
        },
        button: {
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'background 0.2s',
        },
        btnInstall: {
            backgroundColor: '#27ae60',
            color: '#fff',
        },
        btnUninstall: {
            backgroundColor: '#e74c3c',
            color: '#fff',
        },
        btnUpdate: {
            backgroundColor: '#f39c12',
            color: '#fff',
        },
        loadingOverlay: {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255,255,255,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            fontSize: '20px',
            color: '#333',
        }
    };

    return (
        <div style={styles.container}>
            {isLoading && <div style={styles.loadingOverlay}>Processing...</div>}
            
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Financial Module Marketplace</h1>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                        Browse, install, and manage extensions for your trading environment.
                    </p>
                </div>
                <div style={styles.controls}>
                    <select 
                        style={styles.selectInput} 
                        value={filterCategory} 
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="All">All Categories</option>
                        <option value="Finance">Finance</option>
                        <option value="Tool">Tools</option>
                        <option value="Utility">Utilities</option>
                        <option value="Core">Core</option>
                        <option value="Integration">Integration</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Search modules..."
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div style={styles.grid}>
                {filteredPlugins.length > 0 ? (
                    filteredPlugins.map((plugin) => (
                        <div key={plugin.id} style={styles.card}>
                            <div>
                                <div style={styles.cardHeader}>
                                    <span style={styles.pluginName}>{plugin.name}</span>
                                    <span style={styles.pluginVersion}>v{plugin.version}</span>
                                </div>
                                <div style={styles.metaInfo}>
                                    <span>By {plugin.author}</span>
                                    <span>•</span>
                                    <span>{plugin.downloads.toLocaleString()} installs</span>
                                    <span>•</span>
                                    <span>{plugin.category}</span>
                                </div>
                                <p style={styles.pluginDesc}>{plugin.description}</p>
                            </div>
                            <div style={styles.actionArea}>
                                {plugin.status === 'available' && (
                                    <button 
                                        style={{...styles.button, ...styles.btnInstall}}
                                        onClick={() => handleInstall(plugin.id)}
                                    >
                                        Install
                                    </button>
                                )}
                                {plugin.status === 'installed' && (
                                    <button 
                                        style={{...styles.button, ...styles.btnUninstall}}
                                        onClick={() => handleUninstall(plugin.id)}
                                    >
                                        Uninstall
                                    </button>
                                )}
                                {plugin.status === 'update_available' && (
                                    <div style={{display: 'flex', gap: '8px'}}>
                                        <button 
                                            style={{...styles.button, ...styles.btnUninstall}}
                                            onClick={() => handleUninstall(plugin.id)}
                                        >
                                            Uninstall
                                        </button>
                                        <button 
                                            style={{...styles.button, ...styles.btnUpdate}}
                                            onClick={() => handleUpdate(plugin.id)}
                                        >
                                            Update
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#888' }}>
                        <h3>No modules found matching your criteria.</h3>
                        <p>Try adjusting your search or category filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PluginRegistry;