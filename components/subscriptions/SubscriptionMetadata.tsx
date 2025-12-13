import React, { useState, useEffect } from 'react';

interface SubscriptionMetadataProps {
  initialMetadata?: Record<string, any>;
  onChange?: (metadata: Record<string, any>) => void;
  readOnly?: boolean;
}

const SubscriptionMetadata: React.FC<SubscriptionMetadataProps> = ({
  initialMetadata = {},
  onChange,
  readOnly = false,
}) => {
  const [metadata, setMetadata] = useState<Record<string, any>>(initialMetadata);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    setMetadata(initialMetadata);
  }, [initialMetadata]);

  const handleInputChange = (key: string, value: string) => {
    const updatedMetadata = { ...metadata, [key]: value };
    setMetadata(updatedMetadata);
    if (onChange) {
      onChange(updatedMetadata);
    }
  };

  const handleRemoveField = (key: string) => {
    const { [key]: _, ...rest } = metadata;
    setMetadata(rest);
    if (onChange) {
      onChange(rest);
    }
  };

  const handleAddField = () => {
    if (newKey.trim() && newValue.trim()) {
      const updatedMetadata = { ...metadata, [newKey.trim()]: newValue.trim() };
      setMetadata(updatedMetadata);
      if (onChange) {
        onChange(updatedMetadata);
      }
      setNewKey('');
      setNewValue('');
    }
  };

  return (
    <div className="subscription-metadata">
      <h3>Subscription Metadata</h3>
      {Object.entries(metadata).map(([key, value]) => (
        <div key={key} className="metadata-field">
          <label>{key}:</label>
          {readOnly ? (
            <span>{String(value)}</span>
          ) : (
            <input
              type="text"
              value={String(value)}
              onChange={(e) => handleInputChange(key, e.target.value)}
            />
          )}
          {!readOnly && (
            <button onClick={() => handleRemoveField(key)} className="remove-button">
              &times;
            </button>
          )}
        </div>
      ))}

      {!readOnly && (
        <div className="add-metadata-field">
          <h4>Add New Field</h4>
          <input
            type="text"
            placeholder="New Key"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
          <input
            type="text"
            placeholder="New Value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
          <button onClick={handleAddField} className="add-button">
            Add Field
          </button>
        </div>
      )}

      <style jsx>{`
        .subscription-metadata {
          border: 1px solid #ccc;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          background-color: #f9f9f9;
        }
        .subscription-metadata h3 {
          margin-top: 0;
          color: #333;
        }
        .metadata-field {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .metadata-field label {
          min-width: 100px;
          font-weight: bold;
          margin-right: 10px;
          color: #555;
        }
        .metadata-field span,
        .metadata-field input {
          flex-grow: 1;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 3px;
          box-sizing: border-box;
        }
        .metadata-field input:focus {
          outline: none;
          border-color: #007bff;
        }
        .remove-button {
          background-color: #ff4d4f;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          padding: 5px 10px;
          margin-left: 10px;
          font-size: 1.2em;
          line-height: 1;
        }
        .remove-button:hover {
          background-color: #d9363e;
        }
        .add-metadata-field {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }
        .add-metadata-field h4 {
          margin-top: 0;
          color: #333;
        }
        .add-metadata-field input {
          margin-right: 10px;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 3px;
        }
        .add-button {
          background-color: #28a745;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          padding: 8px 15px;
        }
        .add-button:hover {
          background-color: #218838;
        }
      `}</style>
    </div>
  );
};

export default SubscriptionMetadata;