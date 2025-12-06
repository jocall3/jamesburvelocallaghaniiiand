
import React, { useState, useMemo, CSSProperties } from 'react';

// Type definitions for the ISO 20022 Schema
interface SchemaDefinition {
  type: string;
  minLength?: number;
  maxLength?: number;
  description?: string;
  enum?: string[];
  pattern?: string;
  additionalProperties?: boolean;
  properties?: { [key: string]: any };
  definitions?: { [key: string]: SchemaDefinition };
}

interface Schema {
  definitions: {
    [key: string]: SchemaDefinition;
  };
  properties: {
    [key: string]: { "$ref": string };
  };
}

// Helper function to parse description text into a preamble and a code map
const parseDescription = (descriptionText: string | undefined) => {
    if (!descriptionText) {
        return { preamble: '', codes: new Map<string, string>() };
    }

    const codeMap = new Map<string, string>();
    const preambleLines: string[] = [];
    const codeListRegex = /^\*\s*`(.+?)`\s*-\s*(.*)/;
    let inCodeList = false;

    for (const line of descriptionText.split('\n')) {
        const trimmedLine = line.trim();
        const match = trimmedLine.match(codeListRegex);

        if (match) {
            inCodeList = true;
            const [, code, desc] = match;
            codeMap.set(code.replace(/\\u0027/g, "'"), desc.trim());
        } else {
            if (!inCodeList) {
                preambleLines.push(line);
            }
        }
    }

    return {
        preamble: preambleLines.join('\n').trim().replace(/\r/g, ''),
        codes: codeMap
    };
};


const DefinitionDetails: React.FC<{ schema: Schema; definitionName: string }> = ({ schema, definitionName }) => {
    const definition = schema.definitions[definitionName];

    if (!definition) {
        return <div style={styles.detailsPlaceholder}>Select a definition from the list to see its details.</div>;
    }

    const { preamble, codes } = parseDescription(definition.description);

    return (
        <div style={styles.detailsContainer}>
            <h2 style={styles.detailsHeader}>{definitionName}</h2>
            
            <div style={styles.detailSection}>
                <strong style={styles.detailLabel}>Type:</strong>
                <span>{definition.type}</span>
            </div>

            {definition.minLength !== undefined && (
                <div style={styles.detailSection}>
                    <strong style={styles.detailLabel}>Min Length:</strong>
                    <span>{definition.minLength}</span>
                </div>
            )}
            {definition.maxLength !== undefined && (
                 <div style={styles.detailSection}>
                    <strong style={styles.detailLabel}>Max Length:</strong>
                    <span>{definition.maxLength}</span>
                </div>
            )}
            {definition.pattern && (
                 <div style={styles.detailSection}>
                    <strong style={styles.detailLabel}>Pattern:</strong>
                    <code style={styles.codeBlock}>{definition.pattern}</code>
                </div>
            )}

            {preamble && (
                <div style={styles.detailSection}>
                    <strong style={styles.detailLabel}>Description:</strong>
                    <p style={styles.descriptionText}>{preamble}</p>
                </div>
            )}

            {definition.enum && definition.enum.length > 0 && (
                <div style={styles.detailSection}>
                    <h3 style={styles.subHeader}>Code List</h3>
                    <table style={styles.table}>
                        <thead style={styles.tableHead}>
                            <tr>
                                <th style={styles.tableCellHeader}>Code</th>
                                <th style={styles.tableCellHeader}>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {definition.enum.map(code => (
                                <tr key={code} style={styles.tableRow}>
                                    <td style={{...styles.tableCell, ...styles.codeCell}}>{code}</td>
                                    <td style={styles.tableCell}>{codes.get(code) || 'No description available.'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};


const SchemaExplorer: React.FC<{ schemaData: Schema }> = ({ schemaData }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDefinitionName, setSelectedDefinitionName] = useState<string | null>(null);

    const definitionNames = useMemo(() => {
        return Object.keys(schemaData.definitions || {}).sort();
    }, [schemaData]);

    const filteredNames = useMemo(() => {
        if (!searchTerm) {
            return definitionNames;
        }
        return definitionNames.filter(name =>
            name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, definitionNames]);

    return (
        <div style={styles.container}>
            <aside style={styles.sidebar}>
                <div style={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="Search definitions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
                <ul style={styles.list}>
                    {filteredNames.map(name => (
                        <li
                            key={name}
                            onClick={() => setSelectedDefinitionName(name)}
                            style={{
                                ...styles.listItem,
                                ...(name === selectedDefinitionName ? styles.selectedListItem : {})
                            }}
                        >
                            {name}
                        </li>
                    ))}
                </ul>
            </aside>
            <main style={styles.mainContent}>
                {selectedDefinitionName ? (
                    <DefinitionDetails schema={schemaData} definitionName={selectedDefinitionName} />
                ) : (
                   <div style={styles.detailsPlaceholder}>Select a definition from the list to see its details.</div>
                )}
            </main>
        </div>
    );
};

// Styles
const styles: { [key: string]: CSSProperties } = {
    container: {
        display: 'flex',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
        height: '100vh',
        width: '100%',
        color: '#333',
        backgroundColor: '#f9f9f9',
    },
    sidebar: {
        width: '350px',
        borderRight: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
    },
    searchContainer: {
        padding: '10px',
        borderBottom: '1px solid #ddd',
    },
    searchInput: {
        width: '100%',
        padding: '10px',
        fontSize: '14px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxSizing: 'border-box',
    },
    list: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        overflowY: 'auto',
        flex: 1,
    },
    listItem: {
        padding: '10px 15px',
        cursor: 'pointer',
        borderBottom: '1px solid #eee',
        fontSize: '14px',
        transition: 'background-color 0.2s',
    },
    selectedListItem: {
        backgroundColor: '#eaf4ff',
        fontWeight: 'bold',
        color: '#0056b3',
    },
    mainContent: {
        flex: 1,
        padding: '2rem',
        overflowY: 'auto',
    },
    detailsPlaceholder: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        color: '#888',
        fontSize: '1.2rem',
    },
    detailsContainer: {
        maxWidth: '900px',
    },
    detailsHeader: {
        marginTop: 0,
        borderBottom: '2px solid #0056b3',
        paddingBottom: '10px',
        color: '#0056b3',
    },
    subHeader: {
        marginTop: '2rem',
        borderBottom: '1px solid #ccc',
        paddingBottom: '8px',
        color: '#444',
    },
    detailSection: {
        marginBottom: '1.5rem',
    },
    detailLabel: {
        display: 'inline-block',
        minWidth: '120px',
        fontWeight: '600',
        color: '#555',
    },
    descriptionText: {
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        marginTop: '5px',
        color: '#222'
    },
    codeBlock: {
        backgroundColor: '#f0f0f0',
        padding: '2px 6px',
        borderRadius: '3px',
        fontFamily: 'monospace',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '1rem',
    },
    tableHead: {
        backgroundColor: '#f2f2f2',
    },
    tableRow: {
        borderBottom: '1px solid #ddd',
    },
    tableCellHeader: {
        padding: '12px',
        textAlign: 'left',
        fontWeight: 600,
    },
    tableCell: {
        padding: '12px',
        verticalAlign: 'top',
    },
    codeCell: {
        fontFamily: 'monospace',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
    },
};

export default SchemaExplorer;
