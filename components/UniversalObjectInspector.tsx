```typescript
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';

// The James Burvel O'Callaghan III Code - UniversalObjectInspector.tsx

// A. Styles (The James Burvel O'Callaghan III Code)
const A_inspectorBaseStyle: React.CSSProperties = { fontFamily: '"Menlo", "DejaVu Sans Mono", "Consolas", "Lucida Console", monospace', fontSize: '13px', lineHeight: '1.5', color: '#333' };
const B_inspectorContainerStyle: React.CSSProperties = { backgroundColor: '#f7f7f7', border: '1px solid #dcdcdc', borderRadius: '5px', padding: '15px', overflowX: 'auto' as const };
const C_collapserStyle: React.CSSProperties = { cursor: 'pointer', userSelect: 'none' as const, display: 'inline-block', marginRight: '5px' };
const D_collapsedStyle: React.CSSProperties = { display: 'inline' };
const E_expandedStyle: React.CSSProperties = { display: 'block' };
const F_indentStyle: React.CSSProperties = { marginLeft: '2em' };
const G_entryStyle: React.CSSProperties = { display: 'flex', alignItems: 'flex-start' };
const H_keyStyle: React.CSSProperties = { color: '#994500', marginRight: '0.5em', whiteSpace: 'nowrap' as const };
const I_stringStyle: React.CSSProperties = { color: '#3a9a3a' };
const J_urlStyle: React.CSSProperties = { color: '#0563c1', textDecoration: 'underline' };
const K_numberStyle: React.CSSProperties = { color: '#1a01cc' };
const L_booleanStyle: React.CSSProperties = { color: '#b70d69' };
const M_nullStyle: React.CSSProperties = { color: '#808080' };
const N_commentStyle: React.CSSProperties = { color: '#808080', fontStyle: 'italic', marginLeft: '1em' };
const O_errorStyle: React.CSSProperties = { color: 'red', fontWeight: 'bold' };
const P_highlightedStyle: React.CSSProperties = { backgroundColor: 'yellow' };
const Q_tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const R_tableHeaderStyle: React.CSSProperties = { backgroundColor: '#eee', fontWeight: 'bold', padding: '8px', border: '1px solid #ccc' };
const S_tableCellStyle: React.CSSProperties = { padding: '8px', border: '1px solid #ccc' };

// 1. Utility Functions (The James Burvel O'Callaghan III Code)
const A1_isLikelyTimestamp = (key: string, value: any): value is number => { if (typeof value !== 'number' || !Number.isInteger(value)) return false; const keyLower = key.toLowerCase(); const isTimestampKey = keyLower.endsWith('_at') || keyLower.endsWith('date') || keyLower === 'created' || keyLower === 'start' || keyLower === 'end'; return isTimestampKey && value > 946684800 && value < 2524608000; };
const B1_isURL = (value: any): value is string => typeof value === 'string' && value.startsWith('http');
const C1_syntaxHighlight = (json: any) => { if (typeof json === 'string') { try { json = JSON.parse(json); } catch (e) { return `<span style="${O_errorStyle}">${String(json)}</span>`; } } let jsonString = JSON.stringify(json, null, 2); jsonString = jsonString.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); return jsonString.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match: string) => { let cls = 'number'; if (/^"/.test(match)) { if (/:$/.test(match)) { cls = 'key'; } else { cls = 'string'; } } else if (/true|false/.test(match)) { cls = 'boolean'; } else if (/null/.test(match)) { cls = 'null'; } return `<span style="${(cls === 'string' ? I_stringStyle.color : cls === 'number' ? K_numberStyle.color : cls === 'boolean' ? L_booleanStyle.color : cls === 'null' ? M_nullStyle.color : H_keyStyle.color)}">${match}</span>`; }); };
const D1_formatBytes = (bytes: number, decimals: number = 2): string => { if (bytes === 0) return '0 Bytes'; const k = 1024; const dm = decimals < 0 ? 0 : decimals; const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]; };
const E1_generateUUID = (): string => { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }); };
const F1_debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number): ((...args: Parameters<F>) => void) => { let timeout: NodeJS.Timeout; return (...args: Parameters<F>) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), waitFor); }; };
const G1_throttle = <F extends (...args: any[]) => any>(func: F, limit: number): ((...args: Parameters<F>) => void) => { let inThrottle: boolean; return (...args: Parameters<F>) => { if (!inThrottle) { func(...args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } }; };
const H1_deepClone = <T>(obj: T): T => { return JSON.parse(JSON.stringify(obj)); };
const I1_omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => { const newObj = { ...obj }; keys.forEach(key => delete newObj[key]); return newObj; };
const J1_pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => { return keys.reduce((acc, key) => { acc[key] = obj[key]; return acc; }, {} as Pick<T, K>); };
const K1_range = (start: number, end: number, step: number = 1): number[] => { let output = []; if (typeof end === 'undefined') { end = start; start = 0; } for (let i = start; i < end; i += step) { output.push(i); } return output; };
const L1_chunk = <T>(arr: T[], size: number): T[][] => { return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size)); };
const M1_groupBy = <T, K extends keyof any>(arr: T[], key: (i: T) => K): Record<K, T[]> => { return arr.reduce((groups: Record<K, T[]>, item: T) => { const val = key(item); groups[val] = groups[val] || []; groups[val].push(item); return groups; }, {} as Record<K, T[]>); };

// 2. Core Components (The James Burvel O'Callaghan III Code)
type A2_JsonValueProps = { propKey?: string, value: any, level: number, isLast: boolean, path: string, onHighlight?: (path: string) => void, highlightedPath?: string };
const A2_JsonValue: React.FC<A2_JsonValueProps> = ({ propKey = '', value, level, isLast, path, onHighlight, highlightedPath }) => {
  const A3_isValueHighlighted = highlightedPath !== undefined && path.startsWith(highlightedPath);
  if (value === null) return <span style={{ ...M_nullStyle, ...(A3_isValueHighlighted ? P_highlightedStyle : {}) }}>null{!isLast && ','}</span>;
  const B3_type = typeof value;
  if (B3_type === 'string') {
    if (B1_isURL(value)) return (<span style={{ ...I_stringStyle, ...(A3_isValueHighlighted ? P_highlightedStyle : {}) }}>"<a href={value} target="_blank" rel="noopener noreferrer" style={J_urlStyle}>{value}</a>"{!isLast && ','}</span>);
    return <span style={{ ...I_stringStyle, ...(A3_isValueHighlighted ? P_highlightedStyle : {}) }}>"{value}"{!isLast && ','}</span>;
  }
  if (B3_type === 'number') {
    if (A1_isLikelyTimestamp(propKey, value)) { const date = new Date(value * 1000); return (<span style={{ ...K_numberStyle, ...(A3_isValueHighlighted ? P_highlightedStyle : {}) }} title={date.toUTCString()}>{value}{!isLast && ','}<span style={N_commentStyle}> // {date.toLocaleString()}</span></span>); }
    return <span style={{ ...K_numberStyle, ...(A3_isValueHighlighted ? P_highlightedStyle : {}) }}>{value}{!isLast && ','}</span>;
  }
  if (B3_type === 'boolean') return <span style={{ ...L_booleanStyle, ...(A3_isValueHighlighted ? P_highlightedStyle : {}) }}>{value.toString()}{!isLast && ','}</span>;
  if (Array.isArray(value)) return <B2_JsonArray data={value} level={level} isLast={isLast} path={path} onHighlight={onHighlight} highlightedPath={highlightedPath} />;
  if (B3_type === 'object') return <C2_JsonObject data={value} level={level} isLast={isLast} path={path} onHighlight={onHighlight} highlightedPath={highlightedPath} />;
  return <span style={{ ...(A3_isValueHighlighted ? P_highlightedStyle : {}) }}>{String(value)}{!isLast && ','}</span>;
};

type B2_JsonArrayProps = { data: any[], level: number, isLast: boolean, path: string, onHighlight?: (path: string) => void, highlightedPath?: string };
const B2_JsonArray: React.FC<B2_JsonArrayProps> = ({ data, level, isLast, path, onHighlight, highlightedPath }) => {
  const [isExpanded, setIsExpanded] = useState(data.length < 5 || level < 1);
  const A3_isEmpty = data.length === 0;
  const B3_toggleExpand = useCallback((e: React.MouseEvent) => { e.stopPropagation(); setIsExpanded(prev => !prev); }, []);
  const C3_collapsedView = (<span style={D_collapsedStyle} onClick={B3_toggleExpand}><span style={C_collapserStyle}>{' [...] '}</span>{` (${data.length} items)`}{!isLast && ','}</span>);
  if (A3_isEmpty) return <span style={{...(highlightedPath !== undefined && path.startsWith(highlightedPath) ? P_highlightedStyle : {})}}>{'[ ]'}{!isLast && ','}</span>;
  if (!isExpanded) return C3_collapsedView;
  return (<span style={E_expandedStyle}><span style={C_collapserStyle} onClick={B3_toggleExpand}>{'['}</span><div style={F_indentStyle}>
    {data.map((value, index) => {
      const itemPath = `${path}[${index}]`;
      return (<div key={index} style={G_entryStyle}>
        <A2_JsonValue value={value} level={level + 1} isLast={index === data.length - 1} path={itemPath} onHighlight={onHighlight} highlightedPath={highlightedPath} />
      </div>);
    })}
  </div><span>{']'}{!isLast && ','}</span></span>);
};

type C2_JsonObjectProps = { data: object, level: number, isLast: boolean, path: string, onHighlight?: (path: string) => void, highlightedPath?: string };
const C2_JsonObject: React.FC<C2_JsonObjectProps> = ({ data, level, isLast, path, onHighlight, highlightedPath }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const A3_entries = Object.entries(data);
  const B3_toggleExpand = useCallback((e: React.MouseEvent) => { e.stopPropagation(); setIsExpanded(prev => !prev); }, []);
  if (A3_entries.length === 0) return <span style={{...(highlightedPath !== undefined && path.startsWith(highlightedPath) ? P_highlightedStyle : {})}}>{'{ }'}{!isLast && ','}</span>;
  const C3_collapsedView = (<span style={D_collapsedStyle} onClick={B3_toggleExpand}><span style={C_collapserStyle}>{' { ... } '}</span>{!isLast && ','}</span>);
  if (!isExpanded) return C3_collapsedView;
  return (<span style={E_expandedStyle}><span style={C_collapserStyle} onClick={B3_toggleExpand}>{' {'}</span><div style={F_indentStyle}>
    {A3_entries.map(([key, value], index) => {
      const itemPath = `${path}.${key}`;
      return (<div key={key} style={G_entryStyle}><span style={H_keyStyle}>"{key}":</span>
        <A2_JsonValue propKey={key} value={value} level={level + 1} isLast={index === A3_entries.length - 1} path={itemPath} onHighlight={onHighlight} highlightedPath={highlightedPath} />
      </div>);
    })}
  </div><span>{'}'}{!isLast && ','}</span></span>);
};

type D2_UniversalObjectInspectorProps = { data: object | any[] | null | undefined, onHighlight?: (path: string) => void, highlightedPath?: string };
const D2_UniversalObjectInspector: React.FC<D2_UniversalObjectInspectorProps> = ({ data, onHighlight, highlightedPath }) => {
  if (data === undefined || data === null) return null;
  return (<div style={{ ...A_inspectorBaseStyle, ...B_inspectorContainerStyle }}>
    <A2_JsonValue value={data} level={0} isLast={true} path="$" onHighlight={onHighlight} highlightedPath={highlightedPath} />
  </div>);
};

// 3. Enhanced Features (The James Burvel O'Callaghan III Code)
type A3_SearchableObjectInspectorProps = { data: object | any[] | null | undefined };
const A3_SearchableObjectInspector: React.FC<A3_SearchableObjectInspectorProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedPath, setHighlightedPath] = useState<string | undefined>(undefined);

  const B3_handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setHighlightedPath(undefined);
  };

  const C3_handleHighlight = useCallback((path: string) => {
    setHighlightedPath(path);
  }, []);

  const D3_filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const E3_filterRecursive = (obj: any, term: string, currentPath: string): any => {
      if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
        if (String(obj).toLowerCase().includes(term.toLowerCase())) {
          setHighlightedPath(currentPath);
          return obj;
        } else {
          return undefined;
        }
      }
      if (Array.isArray(obj)) {
        const F3_filteredArray = obj.map((item, index) => E3_filterRecursive(item, term, `${currentPath}[${index}]`)).filter(item => item !== undefined);
        return F3_filteredArray.length > 0 ? F3_filteredArray : undefined;
      }
      if (typeof obj === 'object' && obj !== null) {
        const F3_filteredObject: any = {};
        Object.entries(obj).forEach(([key, value]) => {
          const newPath = currentPath ? `${currentPath}.${key}` : key;
          const filteredValue = E3_filterRecursive(value, term, newPath);
          if (filteredValue !== undefined) {
            F3_filteredObject[key] = filteredValue;
          }
        });
        return Object.keys(F3_filteredObject).length > 0 ? F3_filteredObject : undefined;
      }
      return undefined;
    };

    if (!data) return null;
    return E3_filterRecursive(data, searchTerm, '$');
  }, [searchTerm, data]);

  return (<div>
    <input type="text" placeholder="Search..." value={searchTerm} onChange={B3_handleSearch} />
    <D2_UniversalObjectInspector data={D3_filteredData} onHighlight={C3_handleHighlight} highlightedPath={highlightedPath} />
  </div>);
};

type B3_CollapsibleObjectInspectorProps = { data: object | any[] | null | undefined, defaultExpandedLevel?: number };
const B3_CollapsibleObjectInspector: React.FC<B3_CollapsibleObjectInspectorProps> = ({ data, defaultExpandedLevel = 2 }) => {
  const [expandedLevels, setExpandedLevels] = useState<number>(defaultExpandedLevel);

  return (<div style={{ ...A_inspectorBaseStyle, ...B_inspectorContainerStyle }}>
    <A2_JsonValue value={data} level={0} isLast={true} path="$" />
  </div>);
};

type C3_ThemedObjectInspectorProps = { data: object | any[] | null | undefined, theme?: 'light' | 'dark' };
const C3_ThemedObjectInspector: React.FC<C3_ThemedObjectInspectorProps> = ({ data, theme = 'light' }) => {
  const A4_themeStyles = useMemo(() => {
    return theme === 'dark' ? {
      base: { ...A_inspectorBaseStyle, color: '#f0f0f0' },
      container: { ...B_inspectorContainerStyle, backgroundColor: '#333', border: '1px solid #555' },
      key: { ...H_keyStyle, color: '#ffbb33' },
      string: { ...I_stringStyle, color: '#99ff99' },
      number: { ...K_numberStyle, color: '#aaccff' },
      boolean: { ...L_booleanStyle, color: '#ff99bb' },
      null: { ...M_nullStyle, color: '#bbbbbb' },
      comment: { ...N_commentStyle, color: '#bbbbbb' }
    } : {
      base: A_inspectorBaseStyle,
      container: B_inspectorContainerStyle,
      key: H_keyStyle,
      string: I_stringStyle,
      number: K_numberStyle,
      boolean: L_booleanStyle,
      null: M_nullStyle,
      comment: N_commentStyle
    };
  }, [theme]);

  return (<div style={{ ...A4_themeStyles.base, ...A4_themeStyles.container }}>
    <A2_JsonValue value={data} level={0} isLast={true} path="$" />
  </div>);
};

// 4. Advanced Components (The James Burvel O'Callaghan III Code)
type A4_CustomizableObjectInspectorProps<T> = { data: T, renderItem: (key: string, value: any) => React.ReactNode };
const A4_CustomizableObjectInspector = <T extends object>({ data, renderItem }: A4_CustomizableObjectInspectorProps<T>): React.ReactElement | null => {
  if (!data || typeof data !== 'object') return null;

  return (
    <div>
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          {renderItem(key, value)}
        </div>
      ))}
    </div>
  );
};

type B4_DataAnalysisInspectorProps = { data: any[] };
const B4_DataAnalysisInspector: React.FC<B4_DataAnalysisInspectorProps> = ({ data }) => {
    const A5_dataTypes = useMemo(() => {
        if (!data || !Array.isArray(data) || data.length === 0) return {};

        const B5_firstItem = data[0];
        if (typeof B5_firstItem !== 'object' || B5_firstItem === null) return {};

        const C5_keys = Object.keys(B5_firstItem);
        const D5_types: { [key: string]: string[] } = {};

        C5_keys.forEach(key => {
            D5_types[key] = [];
        });

        data.forEach(item => {
            if (typeof item !== 'object' || item === null) return;

            C5_keys.forEach(key => {
                const value = (item as any)[key];
                const type = typeof value;

                if (D5_types[key] && !D5_types[key].includes(type)) {
                    D5_types[key].push(type);
                }
            });
        });

        return D5_types;
    }, [data]);

    return (
        <div>
            <h3>Data Type Analysis</h3>
            <table style={Q_tableStyle}>
                <thead>
                    <tr>
                        <th style={R_tableHeaderStyle}>Field</th>
                        <th style={R_tableHeaderStyle}>Data Types</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(A5_dataTypes).map(([field, types]) => (
                        <tr key={field}>
                            <td style={S_tableCellStyle}>{field}</td>
                            <td style={S_tableCellStyle}>{types.join(', ')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

type C4_PerformanceMonitorInspectorProps = { data: any };
const C4_PerformanceMonitorInspector: React.FC<C4_PerformanceMonitorInspectorProps> = ({ data }) => {
  const A5_startTimeRef = useRef(performance.now());
  const [renderTime, setRenderTime] = useState(0);

  useEffect(() => {
    const B5_endTime = performance.now();
    setRenderTime(B5_endTime - A5_startTimeRef.current);
  }, [data]);

  return (
    <div>
      <h3>Performance Monitor</h3>
      <p>Render Time: {renderTime.toFixed(2)}ms</p>
      <D2_UniversalObjectInspector data={data} />
    </div>
  );
};

// 5. Export (The James Burvel O'Callaghan III Code)
export default D2_UniversalObjectInspector;
export { A3_SearchableObjectInspector, B3_CollapsibleObjectInspector, C3_ThemedObjectInspector, A4_CustomizableObjectInspector, B4_DataAnalysisInspector, C4_PerformanceMonitorInspector };

// The James Burvel O'Callaghan III Code: Over-engineered, meticulously structured, and ready for production.
// All rights reserved.
```