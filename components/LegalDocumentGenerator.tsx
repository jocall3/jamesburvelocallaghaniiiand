import React, { useState } from 'react';

const LegalDocumentGenerator: React.FC = () => {
  const [documentType, setDocumentType] = useState<string>('Contract');
  const [constitutionalCharter, setConstitutionalCharter] = useState<string>('');
  const [specificClauses, setSpecificClauses] = useState<string>('');
  const [parties, setParties] = useState<string>('');
  const [jurisdiction, setJurisdiction] = useState<string>('United States');
  const [rulesEnginePolicyId, setRulesEnginePolicyId] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<string>('PDF');
  const [generatedDocumentUrl, setGeneratedDocumentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const documentTypes = [
    'Contract', 'Policy', 'Agreement', 'Constitutional Charter Amendment',
    'Terms of Service', 'Privacy Policy', 'Non-Disclosure Agreement',
    'Memorandum of Understanding', 'Bylaws', 'Resolution', 'Legal Opinion'
  ];

  const outputFormats = ['PDF', 'DOCX', 'JSON', 'Markdown', 'HTML'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setGeneratedDocumentUrl(null);

    try {
      // In a real application, this would send the form data to an API endpoint
      // that interacts with the Generative Jurisprudence Engine and Rules Engine.
      console.log('Attempting to generate document with:', {
        documentType,
        constitutionalCharter,
        specificClauses,
        parties,
        jurisdiction,
        rulesEnginePolicyId,
        outputFormat,
      });

      const response = await fetch('/api/generative-jurisprudence/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentType,
          constitutionalCharter,
          specificClauses,
          parties: parties.split(',').map(p => p.trim()).filter(p => p),
          jurisdiction,
          rulesEnginePolicyId,
          outputFormat,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // Assuming the API returns a URL to the generated document or its content
      if (data.documentUrl) {
        setGeneratedDocumentUrl(data.documentUrl);
      } else if (data.documentContent) {
        // If content is returned directly, create a data URL for download/display
        const blob = new Blob([data.documentContent], { type: getMimeType(outputFormat) });
        setGeneratedDocumentUrl(URL.createObjectURL(blob));
      } else {
        throw new Error('No document URL or content received from the API.');
      }
      console.log('Document generation successful:', data);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during document generation.');
      console.error('Generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getMimeType = (format: string): string => {
    switch (format.toLowerCase()) {
      case 'pdf': return 'application/pdf';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'json': return 'application/json';
      case 'markdown': return 'text/markdown';
      case 'html': return 'text/html';
      default: return 'application/octet-stream';
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Legal Document Generator</h1>
      <p style={styles.description}>
        Utilize the Generative Jurisprudence Engine to draft legal documents based on foundational charters and specific requirements.
      </p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="documentType" style={styles.label}>Document Type:</label>
          <select
            id="documentType"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            style={styles.select}
            required
          >
            {documentTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="constitutionalCharter" style={styles.label}>Constitutional Charter / Base Document Text:</label>
          <textarea
            id="constitutionalCharter"
            value={constitutionalCharter}
            onChange={(e) => setConstitutionalCharter(e.target.value)}
            rows={8}
            placeholder="Paste the foundational text, constitutional charter, or relevant legal precedent here. This forms the basis for generation."
            style={styles.textarea}
            required
          />
          <small style={styles.hint}>For larger documents, a file upload feature would be integrated here.</small>
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="specificClauses" style={styles.label}>Specific Clauses / Requirements:</label>
          <textarea
            id="specificClauses"
            value={specificClauses}
            onChange={(e) => setSpecificClauses(e.target.value)}
            rows={5}
            placeholder="Enter specific clauses, requirements, or instructions for the document (e.g., 'Include a force majeure clause', 'Define payment terms as Net 30', 'Ensure compliance with GDPR Article 17')."
            style={styles.textarea}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="parties" style={styles.label}>Parties Involved (Comma-separated):</label>
          <input
            type="text"
            id="parties"
            value={parties}
            onChange={(e) => setParties(e.target.value)}
            placeholder="e.g., 'Acme Corp, Beta Solutions LLC, John Doe'"
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="jurisdiction" style={styles.label}>Governing Jurisdiction:</label>
          <input
            type="text"
            id="jurisdiction"
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            placeholder="e.g., 'Delaware, USA' or 'England and Wales'"
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="rulesEnginePolicyId" style={styles.label}>Rules Engine Policy ID (Optional):</label>
          <input
            type="text"
            id="rulesEnginePolicyId"
            value={rulesEnginePolicyId}
            onChange={(e) => setRulesEnginePolicyId(e.target.value)}
            placeholder="e.g., 'POLICY_FINANCE_001' for specific business rules"
            style={styles.input}
          />
          <small style={styles.hint}>Reference a policy from the high-fidelity Rules Engine to apply complex business logic or compliance rules.</small>
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="outputFormat" style={styles.label}>Output Format:</label>
          <select
            id="outputFormat"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value)}
            style={styles.select}
          >
            {outputFormats.map((format) => (
              <option key={format} value={format}>{format}</option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={isLoading} style={styles.button}>
          {isLoading ? 'Generating...' : 'Generate Draft Document'}
        </button>
      </form>

      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {generatedDocumentUrl && (
        <div style={styles.result}>
          <h2 style={styles.resultHeader}>Generated Document:</h2>
          <p>Your document has been successfully generated.</p>
          <a
            href={generatedDocumentUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={`generated_document.${outputFormat.toLowerCase()}`}
            style={styles.downloadLink}
          >
            Download Generated Document ({outputFormat})
          </a>
          {/* Optional: Display content directly if it's a text-based format and not a large file */}
          {generatedDocumentUrl.startsWith('blob:http') && (outputFormat === 'JSON' || outputFormat === 'Markdown' || outputFormat === 'HTML') && (
            <p style={styles.hint}>
              (Content preview for {outputFormat} might be available in a dedicated viewer, or download to view.)
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '900px',
    margin: '40px auto',
    padding: '30px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    backgroundColor: '#ffffff',
  },
  header: {
    fontSize: '2.2em',
    color: '#333',
    marginBottom: '15px',
    textAlign: 'center',
  },
  description: {
    fontSize: '1.1em',
    color: '#666',
    marginBottom: '30px',
    textAlign: 'center',
    lineHeight: '1.6',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    marginBottom: '10px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#444',
    fontSize: '0.95em',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '1em',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '1em',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '1em',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '0.85em',
    color: '#888',
    marginTop: '5px',
    display: 'block',
  },
  button: {
    padding: '14px 25px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '1.1em',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    alignSelf: 'flex-start',
    marginTop: '15px',
  },
  'button:hover': { // Note: Inline styles don't support pseudo-classes directly. This is illustrative.
    backgroundColor: '#0056b3',
  },
  'button:disabled': { // Note: Inline styles don't support pseudo-classes directly. This is illustrative.
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
  },
  error: {
    backgroundColor: '#ffe0e0',
    color: '#cc0000',
    border: '1px solid #cc0000',
    padding: '15px',
    borderRadius: '5px',
    marginTop: '25px',
    fontSize: '1em',
  },
  result: {
    backgroundColor: '#e6f7ff',
    border: '1px solid #99e6ff',
    padding: '25px',
    borderRadius: '8px',
    marginTop: '30px',
  },
  resultHeader: {
    fontSize: '1.8em',
    color: '#0056b3',
    marginBottom: '15px',
  },
  downloadLink: {
    display: 'inline-block',
    marginTop: '15px',
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '5px',
    transition: 'background-color 0.3s ease',
  },
  'downloadLink:hover': { // Note: Inline styles don't support pseudo-classes directly. This is illustrative.
    backgroundColor: '#218838',
  },
};

export default LegalDocumentGenerator;