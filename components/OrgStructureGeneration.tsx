import React, { useState, FormEvent } from 'react';

/**
 * Interface for the props of the OrgStructureGeneration component.
 * Allows for an optional `onGenerate` callback to integrate with a backend API.
 */
interface OrgStructureGenerationProps {
  /**
   * An optional asynchronous function that will be called with the form data
   * when the user requests to generate an organizational structure.
   * If provided, this function should return the generated structure data.
   * If not provided, the component will use internal mock data.
   */
  onGenerate?: (formData: {
    businessGoals: string;
    currentWorkforce: string;
    keyFunctions: string;
    budgetConstraints: string;
    orgPrinciples: string;
  }) => Promise<GeneratedStructure>;
}

/**
 * Interface for the structure of the generated organizational plan.
 */
interface GeneratedStructure {
  departments: {
    name: string;
    headcount: number;
    budgetAllocation: string;
    roles: string[];
    subDepartments?: GeneratedStructure['departments']; // For nested structures
  }[];
  overallHeadcount: number;
  totalBudget: string;
  recommendations: string[];
}

/**
 * OrgStructureGeneration component provides a UI for generating optimal organizational
 * structures and resource allocation plans based on business requirements.
 * It allows users to input various parameters and displays a simulated or API-generated
 * organizational chart and recommendations.
 */
const OrgStructureGeneration: React.FC<OrgStructureGenerationProps> = ({ onGenerate }) => {
  // State for form inputs
  const [businessGoals, setBusinessGoals] = useState<string>('');
  const [currentWorkforce, setCurrentWorkforce] = useState<string>(''); // e.g., "Sales: 20, Marketing: 15"
  const [keyFunctions, setKeyFunctions] = useState<string>(''); // e.g., "Product Development, Customer Support, Sales, HR"
  const [budgetConstraints, setBudgetConstraints] = useState<string>(''); // e.g., "Max Headcount: 100, Max Salary Budget: $10M"
  const [orgPrinciples, setOrgPrinciples] = useState<string>(''); // e.g., "Flat hierarchy, Agile teams, Decentralized decision-making"

  // State for UI feedback and results
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedStructure, setGeneratedStructure] = useState<GeneratedStructure | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles the form submission, triggering the generation process.
   * It can either call an external `onGenerate` prop or use internal mock data.
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setGeneratedStructure(null);
    setIsLoading(true);

    try {
      // Simulate API call delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock generation logic (used if no `onGenerate` prop is provided)
      const mockStructure: GeneratedStructure = {
        departments: [
          {
            name: 'Executive Leadership',
            headcount: 5,
            budgetAllocation: '$2.5M',
            roles: ['CEO', 'CTO', 'CFO', 'CMO', 'COO'],
          },
          {
            name: 'Product & Engineering',
            headcount: 30,
            budgetAllocation: '$4M',
            roles: ['Product Manager', 'Software Engineer', 'QA Engineer', 'DevOps Engineer'],
            subDepartments: [
              {
                name: 'Frontend Development',
                headcount: 10,
                budgetAllocation: '$1.5M',
                roles: ['Frontend Developer', 'UI/UX Designer']
              },
              {
                name: 'Backend Services',
                headcount: 15,
                budgetAllocation: '$2M',
                roles: ['Backend Developer', 'Database Admin']
              },
              {
                name: 'DevOps & Infrastructure',
                headcount: 5,
                budgetAllocation: '$0.5M',
                roles: ['DevOps Engineer', 'Cloud Architect']
              }
            ]
          },
          {
            name: 'Sales & Marketing',
            headcount: 25,
            budgetAllocation: '$3M',
            roles: ['Sales Manager', 'Account Executive', 'Marketing Specialist', 'Content Creator'],
          },
          {
            name: 'Operations & HR',
            headcount: 10,
            budgetAllocation: '$1.5M',
            roles: ['HR Manager', 'Recruiter', 'Operations Coordinator', 'Legal Counsel'],
          },
        ],
        overallHeadcount: 70,
        totalBudget: '$11M',
        recommendations: [
          'Consider a dedicated R&D department for future innovation, especially if business goals include new product lines.',
          'Implement cross-functional agile teams within Product & Engineering for faster product delivery and adaptability.',
          'Review budget allocation for marketing to align with specific market share growth goals.',
          'Explore automation for routine HR tasks to optimize the Operations & HR department headcount.',
        ],
      };

      // Use the `onGenerate` prop if provided, otherwise fall back to mock data
      const result = onGenerate
        ? await onGenerate({
            businessGoals,
            currentWorkforce,
            keyFunctions,
            budgetConstraints,
            orgPrinciples,
          })
        : mockStructure;

      setGeneratedStructure(result);
    } catch (err) {
      setError('Failed to generate organizational structure. Please check your inputs and try again.');
      console.error('Generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Recursively renders departments and their sub-departments in a hierarchical list.
   */
  const renderDepartment = (department: GeneratedStructure['departments'][0], level: number = 0) => (
    <li key={department.name} style={{ ...styles.departmentItem, marginLeft: `${level * 20}px` }}>
      <strong style={styles.departmentName}>{department.name}</strong>
      <span style={styles.departmentDetails}> (Headcount: {department.headcount}, Budget: {department.budgetAllocation})</span>
      <ul style={styles.roleList}>
        {department.roles.map(role => <li key={role} style={styles.roleItem}>{role}</li>)}
      </ul>
      {department.subDepartments && (
        <ul style={styles.subDepartmentList}>
          {department.subDepartments.map(subDep => renderDepartment(subDep, level + 1))}
        </ul>
      )}
    </li>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Organizational Structure Generator</h2>
      <p style={styles.description}>
        Generate optimal organizational structures and resource allocation plans based on your business requirements.
      </p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="businessGoals" style={styles.label}>Business Goals/Objectives:</label>
          <textarea
            id="businessGoals"
            value={businessGoals}
            onChange={(e) => setBusinessGoals(e.target.value)}
            placeholder="e.g., Increase market share by 10%, Launch new product line, Improve operational efficiency"
            rows={3}
            style={styles.textarea}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="keyFunctions" style={styles.label}>Key Roles/Functions Required:</label>
          <input
            type="text"
            id="keyFunctions"
            value={keyFunctions}
            onChange={(e) => setKeyFunctions(e.target.value)}
            placeholder="e.g., Product Development, Customer Support, Sales, HR (comma-separated)"
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="budgetConstraints" style={styles.label}>Budget & Headcount Constraints (Optional):</label>
          <input
            type="text"
            id="budgetConstraints"
            value={budgetConstraints}
            onChange={(e) => setBudgetConstraints(e.target.value)}
            placeholder="e.g., Max Headcount: 100, Max Salary Budget: $10M, Target Profit Margin: 20%"
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="orgPrinciples" style={styles.label}>Desired Organizational Principles (Optional):</label>
          <textarea
            id="orgPrinciples"
            value={orgPrinciples}
            onChange={(e) => setOrgPrinciples(e.target.value)}
            placeholder="e.g., Flat hierarchy, Agile teams, Decentralized decision-making, Strong cross-functional collaboration"
            rows={2}
            style={styles.textarea}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="currentWorkforce" style={styles.label}>Current Workforce (Optional, for optimization):</label>
          <textarea
            id="currentWorkforce"
            value={currentWorkforce}
            onChange={(e) => setCurrentWorkforce(e.target.value)}
            placeholder="e.g., {'Sales': 20, 'Marketing': 15, 'Engineering': 30} or 'Sales: 20, Marketing: 15'"
            rows={2}
            style={styles.textarea}
          />
        </div>

        <button type="submit" disabled={isLoading} style={isLoading ? { ...styles.button, ...styles.buttonDisabled } : styles.button}>
          {isLoading ? 'Generating...' : 'Generate Structure'}
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}

      {generatedStructure && (
        <div style={styles.results}>
          <h3 style={styles.subHeading}>Generated Organizational Structure:</h3>
          <p style={styles.summaryItem}><strong>Overall Headcount:</strong> {generatedStructure.overallHeadcount}</p>
          <p style={styles.summaryItem}><strong>Total Estimated Budget:</strong> {generatedStructure.totalBudget}</p>

          <h4 style={styles.sectionHeading}>Departments & Roles:</h4>
          <ul style={styles.departmentList}>
            {generatedStructure.departments.map(dep => renderDepartment(dep))}
          </ul>

          <h4 style={styles.sectionHeading}>Recommendations:</h4>
          <ul style={styles.recommendationsList}>
            {generatedStructure.recommendations.map((rec, index) => (
              <li key={index} style={styles.recommendationItem}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Basic inline styles for a clean, self-contained component
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '800px',
    margin: '20px auto',
    padding: '25px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: '28px',
    color: '#333',
    marginBottom: '10px',
    textAlign: 'center',
  },
  description: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '25px',
    textAlign: 'center',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    marginBottom: '30px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '8px',
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#444',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '15px',
    width: '100%',
    boxSizing: 'border-box',
  },
  textarea: {
    padding: '10px 12px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '15px',
    width: '100%',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    alignSelf: 'flex-start',
  },
  buttonDisabled: {
    backgroundColor: '#a0c8f7',
    cursor: 'not-allowed',
  },
  error: {
    color: '#dc3545',
    marginTop: '15px',
    textAlign: 'center',
    fontSize: '15px',
  },
  results: {
    marginTop: '30px',
    paddingTop: '25px',
    borderTop: '1px solid #eee',
  },
  subHeading: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '15px',
  },
  summaryItem: {
    fontSize: '16px',
    color: '#555',
    marginBottom: '8px',
  },
  sectionHeading: {
    fontSize: '18px',
    color: '#555',
    marginTop: '20px',
    marginBottom: '10px',
    borderBottom: '1px solid #eee',
    paddingBottom: '5px',
  },
  departmentList: {
    listStyleType: 'none',
    paddingLeft: '0',
  },
  departmentItem: {
    marginBottom: '10px',
    lineHeight: '1.4',
  },
  departmentName: {
    color: '#007bff',
    fontSize: '17px',
  },
  departmentDetails: {
    fontSize: '15px',
    color: '#666',
  },
  roleList: {
    listStyleType: 'disc',
    paddingLeft: '25px',
    marginTop: '5px',
    color: '#444',
  },
  roleItem: {
    fontSize: '14px',
    marginBottom: '3px',
  },
  subDepartmentList: {
    listStyleType: 'none',
    paddingLeft: '0',
    marginTop: '5px',
  },
  recommendationsList: {
    listStyleType: 'disc',
    paddingLeft: '20px',
    color: '#444',
  },
  recommendationItem: {
    marginBottom: '5px',
    lineHeight: '1.4',
  }
};

export default OrgStructureGeneration;