import React, { useState, useCallback, ChangeEvent, FormEvent } from 'react';

// Define types for better type safety
interface Header {
  id: string;
  key: string;
  value: string;
}

interface FormDataField {
  id: string;
  key: string;
  value: string | File;
  type: 'text' | 'file';
}

interface ApiResponse {
  status: number | null;
  statusText: string | null;
  headers: Record<string, string>;
  body: string | object | null;
  error: string | null;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
type BodyType = 'none' | 'json' | 'form-data';

const EndpointTester: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [token, setToken] = useState<string>('');
  const [authRedirect, setAuthRedirect] = useState<string>(''); // For display/input, actual redirect handled externally
  const [headers, setHeaders] = useState<Header[]>([{ id: 'h1', key: '', value: '' }]);
  const [bodyType, setBodyType] = useState<BodyType>('none');
  const [jsonBody, setJsonBody] = useState<string>('');
  const [formDataFields, setFormDataFields] = useState<FormDataField[]>([{ id: 'f1', key: '', value: '', type: 'text' }]);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleHeaderChange = useCallback((id: string, field: 'key' | 'value', value: string) => {
    setHeaders(prevHeaders =>
      prevHeaders.map(header => (header.id === id ? { ...header, [field]: value } : header))
    );
  }, []);

  const addHeader = useCallback(() => {
    setHeaders(prevHeaders => [...prevHeaders, { id: `h${prevHeaders.length + 1}`, key: '', value: '' }]);
  }, []);

  const removeHeader = useCallback((id: string) => {
    setHeaders(prevHeaders => prevHeaders.filter(header => header.id !== id));
  }, []);

  const handleFormDataChange = useCallback((id: string, field: 'key' | 'value' | 'type', value: string | File) => {
    setFormDataFields(prevFields =>
      prevFields.map(fieldItem => (fieldItem.id === id ? { ...fieldItem, [field]: value } : fieldItem))
    );
  }, []);

  const addFormField = useCallback(() => {
    setFormDataFields(prevFields => [...prevFields, { id: `f${prevFields.length + 1}`, key: '', value: '', type: 'text' }]);
  }, []);

  const removeFormField = useCallback((id: string) => {
    setFormDataFields(prevFields => prevFields.filter(field => field.id !== id));
  }, []);

  const sendRequest = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      const requestHeaders: HeadersInit = {};
      headers.forEach(header => {
        if (header.key && header.value) {
          requestHeaders[header.key] = header.value;
        }
      });

      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }

      let requestBody: BodyInit | null = null;
      if (bodyType === 'json' && jsonBody) {
        try {
          requestBody = JSON.stringify(JSON.parse(jsonBody));
          requestHeaders['Content-Type'] = 'application/json';
        } catch (jsonError) {
          setResponse({
            status: null,
            statusText: null,
            headers: {},
            body: null,
            error: `Invalid JSON body: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`,
          });
          setLoading(false);
          return;
        }
      } else if (bodyType === 'form-data') {
        const formData = new FormData();
        formDataFields.forEach(field => {
          if (field.key) {
            formData.append(field.key, field.value);
          }
        });
        requestBody = formData;
        // Content-Type for FormData is automatically set by the browser,
        // including the boundary, so we don't set it manually here.
      }

      const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders,
        body: requestBody,
      };

      const res = await fetch(url, fetchOptions);

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let responseBody: string | object | null = null;
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        responseBody = await res.json();
      } else if (contentType?.includes('text/')) {
        responseBody = await res.text();
      } else {
        // Handle other types as blob, for display purposes, we'll just show a placeholder
        await res.blob(); // Consume the body
        responseBody = `[Binary Data - Content-Type: ${contentType || 'unknown'}]`;
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: responseBody,
        error: null,
      });
    } catch (error) {
      setResponse({
        status: null,
        statusText: null,
        headers: {},
        body: null,
        error: `Network Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setLoading(false);
    }
  }, [url, method, token, headers, bodyType, jsonBody, formDataFields]);

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>API Endpoint Tester</h2>

      <form onSubmit={sendRequest} style={styles.form}>
        {/* URL and Method */}
        <div style={styles.inputGroup}>
          <label htmlFor="url" style={styles.label}>URL:</label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            style={styles.input}
            placeholder="e.g., https://api.example.com/data"
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="method" style={styles.label}>Method:</label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            style={styles.select}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
            <option value="HEAD">HEAD</option>
            <option value="OPTIONS">OPTIONS</option>
          </select>
        </div>

        {/* Authentication */}
        <div style={styles.section}>
          <h3 style={styles.subHeading}>Authentication (Bearer Token)</h3>
          <div style={styles.inputGroup}>
            <label htmlFor="token" style={styles.label}>Token:</label>
            <input
              type="password" // Use password type for security
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              style={styles.input}
              placeholder="Your API Bearer Token"
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="authRedirect" style={styles.label}>Auth Redirect URL (for info):</label>
            <input
              type="text"
              id="authRedirect"
              value={authRedirect}
              onChange={(e) => setAuthRedirect(e.target.value)}
              style={styles.input}
              placeholder="e.g., https://your-app.com/auth/callback"
              readOnly // This is typically set by the app, not user editable for a test
            />
          </div>
        </div>

        {/* Headers */}
        <div style={styles.section}>
          <h3 style={styles.subHeading}>Headers</h3>
          {headers.map((header) => (
            <div key={header.id} style={styles.headerRow}>
              <input
                type="text"
                placeholder="Key"
                value={header.key}
                onChange={(e) => handleHeaderChange(header.id, 'key', e.target.value)}
                style={styles.headerInput}
              />
              <input
                type="text"
                placeholder="Value"
                value={header.value}
                onChange={(e) => handleHeaderChange(header.id, 'value', e.target.value)}
                style={styles.headerInput}
              />
              {headers.length > 1 && (
                <button type="button" onClick={() => removeHeader(header.id)} style={styles.removeButton}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addHeader} style={styles.addButton}>
            Add Header
          </button>
        </div>

        {/* Request Body */}
        {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
          <div style={styles.section}>
            <h3 style={styles.subHeading}>Request Body</h3>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="none"
                  checked={bodyType === 'none'}
                  onChange={() => setBodyType('none')}
                />{' '}
                None
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="json"
                  checked={bodyType === 'json'}
                  onChange={() => setBodyType('json')}
                />{' '}
                JSON
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="form-data"
                  checked={bodyType === 'form-data'}
                  onChange={() => setBodyType('form-data')}
                />{' '}
                Form Data
              </label>
            </div>

            {bodyType === 'json' && (
              <textarea
                value={jsonBody}
                onChange={(e) => setJsonBody(e.target.value)}
                placeholder='Enter JSON body, e.g., {"name": "test", "value": 123}'
                rows={10}
                style={styles.textarea}
              />
            )}

            {bodyType === 'form-data' && (
              <div>
                {formDataFields.map((field) => (
                  <div key={field.id} style={styles.headerRow}>
                    <input
                      type="text"
                      placeholder="Key"
                      value={field.key}
                      onChange={(e) => handleFormDataChange(field.id, 'key', e.target.value)}
                      style={styles.headerInput}
                    />
                    <select
                      value={field.type}
                      onChange={(e) => handleFormDataChange(field.id, 'type', e.target.value as 'text' | 'file')}
                      style={styles.selectSmall}
                    >
                      <option value="text">Text</option>
                      <option value="file">File</option>
                    </select>
                    {field.type === 'text' ? (
                      <input
                        type="text"
                        placeholder="Value"
                        value={field.value as string}
                        onChange={(e) => handleFormDataChange(field.id, 'value', e.target.value)}
                        style={styles.headerInput}
                      />
                    ) : (
                      <input
                        type="file"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFormDataChange(field.id, 'value', e.target.files[0]);
                          }
                        }}
                        style={styles.fileInput}
                      />
                    )}
                    {formDataFields.length > 1 && (
                      <button type="button" onClick={() => removeFormField(field.id)} style={styles.removeButton}>
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addFormField} style={styles.addButton}>
                  Add Form Field
                </button>
              </div>
            )}
          </div>
        )}

        <button type="submit" disabled={loading} style={{ ...styles.submitButton, ...(loading ? styles.submitButtonDisabled : {}) }}>
          {loading ? 'Sending Request...' : 'Send Request'}
        </button>
      </form>

      {/* Response Display */}
      {response && (
        <div style={styles.responseContainer}>
          <h3 style={styles.subHeading}>Response</h3>
          {response.error ? (
            <div style={styles.errorBox}>
              <h4>Error:</h4>
              <pre style={styles.pre}>{response.error}</pre>
            </div>
          ) : (
            <>
              <div style={styles.responseStatus}>
                <strong>Status:</strong> {response.status} {response.statusText}
              </div>
              <div style={styles.responseSection}>
                <h4>Headers:</h4>
                <pre style={styles.pre}>
                  {JSON.stringify(response.headers, null, 2)}
                </pre>
              </div>
              <div style={styles.responseSection}>
                <h4>Body:</h4>
                <pre style={styles.pre}>
                  {typeof response.body === 'object' && response.body !== null
                    ? JSON.stringify(response.body, null, 2)
                    : String(response.body)}
                </pre>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Basic inline styles for a clean look. In a real project, this would be a CSS module or a styling library.
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    maxWidth: '900px',
    margin: '20px auto',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    backgroundColor: '#fff',
  },
  heading: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px',
  },
  subHeading: {
    color: '#555',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
    marginBottom: '15px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '10px',
  },
  label: {
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#666',
  },
  input: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  select: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1rem',
    backgroundColor: '#fff',
  },
  selectSmall: {
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '0.9rem',
    backgroundColor: '#fff',
    marginRight: '10px',
  },
  textarea: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1rem',
    minHeight: '150px',
    resize: 'vertical',
  },
  section: {
    border: '1px solid #eee',
    borderRadius: '6px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
  },
  headerRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
    alignItems: 'center',
  },
  headerInput: {
    flex: 1,
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  fileInput: {
    flex: 1,
    padding: '5px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
  },
  addButton: {
    padding: '8px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    marginTop: '10px',
  },
  removeButton: {
    padding: '6px 12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  radioGroup: {
    display: 'flex',
    gap: '20px',
    marginBottom: '15px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '12px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    marginTop: '20px',
    transition: 'background-color 0.2s ease',
  },
  submitButtonDisabled: {
    backgroundColor: '#94d3a2',
    cursor: 'not-allowed',
  },
  responseContainer: {
    marginTop: '30px',
    borderTop: '1px solid #eee',
    paddingTop: '20px',
  },
  responseStatus: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
  },
  responseSection: {
    marginBottom: '15px',
  },
  pre: {
    backgroundColor: '#f4f4f4',
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '15px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    maxHeight: '400px',
    overflowY: 'auto',
    fontSize: '0.9rem',
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '15px',
  },
};

export default EndpointTester;