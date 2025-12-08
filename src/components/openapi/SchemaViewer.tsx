import React, { useState, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChevronDown, ChevronRight, FileJson, ListTree } from 'lucide-react';

// Basic type definition for OpenAPI 3.1.0 Schema Object.
// This is not exhaustive but covers common cases.
interface SchemaObject {
  type?: string | string[];
  properties?: { [key: string]: SchemaObject };
  items?: SchemaObject;
  required?: string[];
  description?: string;
  format?: string;
  enum?: any[];
  default?: any;
  example?: any;
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  allOf?: SchemaObject[];
  [key: string]: any; // Allow for extensions
}

type SchemaViewerProps = {
  schema: SchemaObject | null | undefined;
  title?: string;
};

type SchemaNodeProps = {
  name: string;
  schema: SchemaObject;
  level?: number;
  isRoot?: boolean;
  isRequired?: boolean;
};

const TypeBadge: React.FC<{ type: string | string[] | undefined }> = ({ type }) => {
  if (!type) return null;
  const types = Array.isArray(type) ? type : [type];
  
  const getColor = (t: string) => {
    switch (t) {
      case 'string': return 'bg-green-200 text-green-800';
      case 'number':
      case 'integer': return 'bg-blue-200 text-blue-800';
      case 'boolean': return 'bg-yellow-200 text-yellow-800';
      case 'object': return 'bg-purple-200 text-purple-800';
      case 'array': return 'bg-indigo-200 text-indigo-800';
      case 'null': return 'bg-gray-300 text-gray-800';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <>
      {types.map((t, index) => (
        <span key={index} className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full mr-1 ${getColor(t)}`}>
          {t}
        </span>
      ))}
    </>
  );
};

const SchemaNode: React.FC<SchemaNodeProps> = ({ name, schema, level = 0, isRoot = false, isRequired = false }) => {
  const [isOpen, setIsOpen] = useState(isRoot || level < 1);
  const isExpandable = (schema.type === 'object' && schema.properties) || (schema.type === 'array' && schema.items) || schema.oneOf || schema.anyOf || schema.allOf;

  const toggleOpen = () => {
    if (isExpandable) {
      setIsOpen(!isOpen);
    }
  };

  const renderCombiners = (combiner: 'oneOf' | 'anyOf' | 'allOf') => {
    if (!schema[combiner]) return null;
    return (
      <div className="pl-6 border-l border-dashed border-gray-600">
        <div className="text-sm font-semibold text-cyan-400 my-1">{combiner}</div>
        {schema[combiner]?.map((subSchema, index) => (
          <SchemaNode key={index} name={`Option ${index + 1}`} schema={subSchema} level={level + 1} />
        ))}
      </div>
    );
  };

  return (
    <div className="font-sans text-sm">
      <div 
        className={`flex items-center py-1 hover:bg-gray-700/50 rounded-md ${isExpandable ? 'cursor-pointer' : ''}`}
        style={{ paddingLeft: `${level * 1.5}rem` }}
        onClick={toggleOpen}
      >
        {isExpandable ? (
          isOpen ? <ChevronDown size={16} className="mr-2 flex-shrink-0" /> : <ChevronRight size={16} className="mr-2 flex-shrink-0" />
        ) : (
          <div className="w-6 mr-2 flex-shrink-0"></div>
        )}
        <span className="font-mono font-bold text-gray-300 mr-2">{name}</span>
        <TypeBadge type={schema.type} />
        {isRequired && <span className="text-xs font-semibold text-red-400 ml-2">required</span>}
        {schema.format && <span className="text-xs text-gray-400 ml-2 font-mono">({schema.format})</span>}
        {schema.description && <span className="text-gray-400 ml-3 italic truncate"> - {schema.description}</span>}
      </div>
      {isOpen && isExpandable && (
        <div className="border-l border-gray-700" style={{ marginLeft: `${level * 1.5 + 0.75}rem` }}>
          {schema.type === 'object' && schema.properties && Object.entries(schema.properties).map(([propName, propSchema]) => (
            <SchemaNode
              key={propName}
              name={propName}
              schema={propSchema}
              level={level + 1}
              isRequired={schema.required?.includes(propName)}
            />
          ))}
          {schema.type === 'array' && schema.items && (
            <SchemaNode name="items" schema={schema.items} level={level + 1} />
          )}
          {renderCombiners('oneOf')}
          {renderCombiners('anyOf')}
          {renderCombiners('allOf')}
        </div>
      )}
    </div>
  );
};

const SchemaTreeView: React.FC<{ schema: SchemaObject }> = ({ schema }) => {
  return <SchemaNode name="Schema" schema={schema} isRoot={true} />;
};

const JsonView: React.FC<{ jsonString: string }> = ({ jsonString }) => {
  return (
    <SyntaxHighlighter language="json" style={atomDark} customStyle={{ margin: 0, borderRadius: '0.375rem', background: '#1f2937' }} wrapLines={true}>
      {jsonString}
    </SyntaxHighlighter>
  );
};

export const SchemaViewer: React.FC<SchemaViewerProps> = ({ schema, title = "Schema" }) => {
  const [viewMode, setViewMode] = useState<'tree' | 'json'>('tree');

  const jsonString = useMemo(() => {
    try {
      return JSON.stringify(schema, null, 2);
    } catch (error) {
      return '{"error": "Invalid schema object"}';
    }
  }, [schema]);

  if (!schema) {
    return (
      <div className="bg-gray-800 text-gray-400 p-4 rounded-lg border border-gray-700">
        <p className="font-semibold">{title}</p>
        <p className="mt-2 text-sm">No schema provided.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 text-white rounded-lg border border-gray-700 overflow-hidden">
      <div className="flex justify-between items-center p-3 bg-gray-900/50 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
        <div className="flex items-center bg-gray-700 rounded-md p-1">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1 text-sm rounded-md flex items-center gap-2 ${viewMode === 'tree' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
            aria-label="Tree View"
          >
            <ListTree size={16} />
            Tree
          </button>
          <button
            onClick={() => setViewMode('json')}
            className={`px-3 py-1 text-sm rounded-md flex items-center gap-2 ${viewMode === 'json' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
            aria-label="JSON View"
          >
            <FileJson size={16} />
            JSON
          </button>
        </div>
      </div>
      <div className="p-4">
        {viewMode === 'tree' ? (
          <SchemaTreeView schema={schema} />
        ) : (
          <JsonView jsonString={jsonString} />
        )}
      </div>
    </div>
  );
};

export default SchemaViewer;