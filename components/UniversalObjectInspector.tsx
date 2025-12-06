
import React, { useState } from 'react';

const inspectorStyles = {
  base: {
    fontFamily: '"Menlo", "DejaVu Sans Mono", "Consolas", "Lucida Console", monospace',
    fontSize: '13px',
    lineHeight: '1.5',
    color: '#333',
  },
  container: {
    backgroundColor: '#f7f7f7',
    border: '1px solid #dcdcdc',
    borderRadius: '5px',
    padding: '15px',
    overflowX: 'auto' as const,
  },
  collapser: {
    cursor: 'pointer',
    userSelect: 'none' as const,
    display: 'inline-block',
    marginRight: '5px',
  },
  collapsed: {
    display: 'inline',
  },
  expanded: {
    display: 'block',
  },
  indent: {
    marginLeft: '2em',
  },
  entry: {
    display: 'flex',
    alignItems: 'flex-start',
  },
  key: {
    color: '#994500',
    marginRight: '0.5em',
    whiteSpace: 'nowrap' as const,
  },
  string: {
    color: '#3a9a3a',
  },
  url: {
    color: '#0563c1',
    textDecoration: 'underline',
  },
  number: {
    color: '#1a01cc',
  },
  boolean: {
    color: '#b70d69',
  },
  null: {
    color: '#808080',
  },
  comment: {
    color: '#808080',
    fontStyle: 'italic',
    marginLeft: '1em',
  },
};

const isLikelyTimestamp = (key: string, value: any): value is number => {
  if (typeof value !== 'number' || !Number.isInteger(value)) return false;
  const keyLower = key.toLowerCase();
  const isTimestampKey = keyLower.endsWith('_at') || keyLower.endsWith('date') || keyLower === 'created' || keyLower === 'start' || keyLower === 'end';
  // Check if the number is a plausible Unix timestamp in seconds (between 2000 and 2050)
  return isTimestampKey && value > 946684800 && value < 2524608000;
};

const isURL = (value: any): value is string => {
  return typeof value === 'string' && value.startsWith('http');
};

const JsonValue = ({ propKey = '', value, level, isLast }: { propKey?: string, value: any, level: number, isLast: boolean }) => {
  if (value === null) {
    return <span style={inspectorStyles.null}>null{!isLast && ','}</span>;
  }

  const type = typeof value;

  if (type === 'string') {
    if (isURL(value)) {
      return (
        <span style={inspectorStyles.string}>
          "
          <a href={value} target="_blank" rel="noopener noreferrer" style={inspectorStyles.url}>
            {value}
          </a>
          "
          {!isLast && ','}
        </span>
      );
    }
    return <span style={inspectorStyles.string}>"{value}"{!isLast && ','}</span>;
  }

  if (type === 'number') {
    if (isLikelyTimestamp(propKey, value)) {
      const date = new Date(value * 1000);
      return (
        <span style={inspectorStyles.number} title={date.toUTCString()}>
          {value}{!isLast && ','}
          <span style={inspectorStyles.comment}>// {date.toLocaleString()}</span>
        </span>
      );
    }
    return <span style={inspectorStyles.number}>{value}{!isLast && ','}</span>;
  }

  if (type === 'boolean') {
    return <span style={inspectorStyles.boolean}>{value.toString()}{!isLast && ','}</span>;
  }

  if (Array.isArray(value)) {
    return <JsonArray data={value} level={level} isLast={isLast} />;
  }

  if (type === 'object') {
    return <JsonObject data={value} level={level} isLast={isLast} />;
  }

  return <span>{String(value)}{!isLast && ','}</span>;
};

const JsonObject = ({ data, level, isLast }: { data: object, level: number, isLast: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return <span>{'{ }'}{!isLast && ','}</span>;
  }

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }

  const collapsedView = (
    <span style={inspectorStyles.collapsed} onClick={toggleExpand}>
      <span style={inspectorStyles.collapser}>{'{...}'}</span>
      {!isLast && ','}
    </span>
  );

  if (!isExpanded) {
    return collapsedView;
  }

  return (
    <span style={inspectorStyles.expanded}>
      <span style={inspectorStyles.collapser} onClick={toggleExpand}>{'{'}</span>
      <div style={inspectorStyles.indent}>
        {entries.map(([key, value], index) => (
          <div key={key} style={inspectorStyles.entry}>
            <span style={inspectorStyles.key}>"{key}":</span>
            <JsonValue propKey={key} value={value} level={level + 1} isLast={index === entries.length - 1} />
          </div>
        ))}
      </div>
      <span>{'}'}{!isLast && ','}</span>
    </span>
  );
};

const JsonArray = ({ data, level, isLast }: { data: any[], level: number, isLast: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(data.length < 5 || level < 1);
  const isEmpty = data.length === 0;

  if (isEmpty) {
    return <span>{'[ ]'}{!isLast && ','}</span>;
  }

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }

  const collapsedView = (
    <span style={inspectorStyles.collapsed} onClick={toggleExpand}>
      <span style={inspectorStyles.collapser}>{'[...]'}{` (${data.length} items)`}</span>
      {!isLast && ','}
    </span>
  );

  if (!isExpanded) {
    return collapsedView;
  }

  return (
    <span style={inspectorStyles.expanded}>
      <span style={inspectorStyles.collapser} onClick={toggleExpand}>{'['}</span>
      <div style={inspectorStyles.indent}>
        {data.map((value, index) => (
          <div key={index} style={inspectorStyles.entry}>
            <JsonValue value={value} level={level + 1} isLast={index === data.length - 1} />
          </div>
        ))}
      </div>
      <span>{']'}{!isLast && ','}</span>
    </span>
  );
};


type UniversalObjectInspectorProps = {
  data: object | any[] | null | undefined;
};

const UniversalObjectInspector = ({ data }: UniversalObjectInspectorProps) => {
  if (data === undefined) {
    return null;
  }
  
  return (
    <div style={{...inspectorStyles.base, ...inspectorStyles.container}}>
      <JsonValue value={data} level={0} isLast={true} />
    </div>
  );
};

export default UniversalObjectInspector;