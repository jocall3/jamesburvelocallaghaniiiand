import React, { useState, useCallback, useMemo } from 'react';

// --- Data Models (Mock) ---

type MacroStepType = 'START' | 'ACTION' | 'CONDITION' | 'END';

interface MacroStep {
  id: string;
  type: MacroStepType;
  label: string;
  config: Record<string, any>;
  next?: string; // ID of the next step (for sequential/linear flow)
  trueNext?: string; // For CONDITION type
  falseNext?: string; // For CONDITION type
}

interface FlowchartContent {
  steps: MacroStep[];
  // Map of step IDs to visual coordinates
  layout: Record<string, { x: number, y: number }>;
}

interface ScriptContent {
  language: 'JAVASCRIPT' | 'PYTHON' | 'DSL';
  code: string;
}

interface MacroDefinition {
  name: string;
  description: string;
  mode: 'FLOWCHART' | 'SCRIPT';
  content: FlowchartContent | ScriptContent;
}

// --- Component Mockups ---

interface FlowchartEditorProps {
  content: FlowchartContent;
  onChange: (newContent: FlowchartContent) => void;
}

const FlowchartEditor: React.FC<FlowchartEditorProps> = ({ content, onChange }) => {
  // NOTE: In a real application, this would integrate a complex flowchart library (e.g., React Flow, jsPlumb).
  // This implementation provides only basic visualization placeholders.

  const handleAddStep = (type: MacroStepType = 'ACTION') => {
    const newStepId = `step-${Date.now()}`;
    const newSteps = [...content.steps, {
      id: newStepId,
      type: type,
      label: type === 'CONDITION' ? 'Decision Point' : 'New Action',
      config: { type: 'Log', message: 'Hello' }
    } as MacroStep];
    
    onChange({
      ...content,
      steps: newSteps,
      layout: { 
        ...content.layout, 
        [newStepId]: { x: 100 + Math.random() * 200, y: 100 + content.steps.length * 60 } 
      }
    });
  };
  
  const renderStep = (step: MacroStep) => {
    const pos = content.layout[step.id];
    let borderColor = 'gray';
    switch (step.type) {
        case 'START': borderColor = 'green'; break;
        case 'END': borderColor = 'red'; break;
        case 'CONDITION': borderColor = 'orange'; break;
        case 'ACTION': borderColor = 'blue'; break;
    }

    return (
      <div
        key={step.id}
        // Simplified styling for visualization
        style={{
          position: 'absolute',
          left: pos?.x,
          top: pos?.y,
          border: `2px solid ${borderColor}`,
          padding: '10px',
          borderRadius: step.type === 'CONDITION' ? '15px' : '5px',
          backgroundColor: '#f9f9f9',
          minWidth: '120px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          cursor: 'grab',
          zIndex: 10
        }}
        title={`Step ID: ${step.id}`}
      >
        <strong>{step.label}</strong>
        <div style={{ fontSize: '0.7em', marginTop: '5px' }}>{step.type}</div>
        {/* Connection point placeholders would go here */}
      </div>
    );
  };

  return (
    <div style={{ border: '1px solid #ccc', minHeight: '400px', padding: '10px' }}>
      <div style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <button onClick={() => handleAddStep('ACTION')} style={{ marginRight: '5px' }}>Add Action</button>
        <button onClick={() => handleAddStep('CONDITION')} style={{ marginRight: '5px' }}>Add Condition</button>
        <button onClick={() => handleAddStep('END')}>Add End</button>
        <span style={{ marginLeft: '20px', color: '#666' }}>{content.steps.length} steps defined</span>
      </div>
      
      <div style={{ position: 'relative', height: '350px', overflow: 'auto', backgroundColor: '#eef' }}>
        {content.steps.map(renderStep)}
        
        {/* Flowchart background grid/hint */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundImage: 'linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px)',
            backgroundSize: '20px 20px', opacity: 0.3 }}
        />
        
        {content.steps.length === 0 && (
            <p style={{ textAlign: 'center', paddingTop: '150px', color: '#888' }}>
                Start building your macro flow here.
            </p>
        )}
      </div>
    </div>
  );
};

interface ScriptEditorProps {
  content: ScriptContent;
  onChange: (newContent: ScriptContent) => void;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({ content, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...content, code: e.target.value });
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...content, language: e.target.value as ScriptContent['language'] });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '400px', border: '1px solid #ccc' }}>
      <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
        Script Language:
        <select value={content.language} onChange={handleLanguageChange} style={{ marginLeft: '10px', padding: '5px' }}>
          <option value="JAVASCRIPT">JavaScript</option>
          <option value="PYTHON">Python</option>
          <option value="DSL">Custom Automation DSL</option>
        </select>
      </div>
      <textarea
        value={content.code}
        onChange={handleChange}
        spellCheck={false}
        style={{ 
            flexGrow: 1, 
            fontFamily: 'Consolas, monospace', 
            fontSize: '14px',
            padding: '10px', 
            minHeight: '300px',
            border: 'none',
            resize: 'none',
            outline: 'none',
        }}
        placeholder={`Write your macro code in ${content.language}...`}
      />
      <div style={{ padding: '5px 10px', backgroundColor: '#eee', fontSize: '0.8em', borderTop: '1px solid #ccc' }}>
        Lines: {content.code.split('\n').length} | Language: {content.language}
      </div>
    </div>
  );
};


// --- Main Component ---

export const MacroDefinitionView: React.FC = () => {
  const initialFlowchartContent: FlowchartContent = {
    steps: [
      { id: 'start-0', type: 'START', label: 'Start Macro', config: {}, next: 'action-1' },
      { id: 'action-1', type: 'ACTION', label: 'Perform Task A', config: { delayMs: 100 }, next: 'end-0' },
      { id: 'end-0', type: 'END', label: 'Finish', config: {} },
    ],
    layout: { 
      'start-0': { x: 200, y: 30 },
      'action-1': { x: 200, y: 120 },
      'end-0': { x: 200, y: 210 }
    }
  };
  
  const initialScriptContent: ScriptContent = {
    language: 'JAVASCRIPT',
    code: '// Define functions or steps here\n\nfunction run(context) {\n  context.log("Macro started");\n  // Example: execute task\n  context.execute("Task Name", { param1: 1 });\n  context.log("Macro finished");\n}',
  };


  const [macro, setMacro] = useState<MacroDefinition>(() => ({
    name: 'New Automated Workflow',
    description: 'A template for sequencing actions or running custom scripts.',
    mode: 'FLOWCHART',
    content: initialFlowchartContent as FlowchartContent,
  }));

  const handleMacroChange = useCallback(<K extends keyof MacroDefinition>(key: K, value: MacroDefinition[K]) => {
    setMacro(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleContentChange = useCallback((newContent: FlowchartContent | ScriptContent) => {
    handleMacroChange('content', newContent);
  }, [handleMacroChange]);

  const handleModeChange = (newMode: 'FLOWCHART' | 'SCRIPT') => {
    if (newMode === macro.mode) return;
    
    // Warning: switching modes usually discards definition unless sophisticated conversion exists.
    if (!window.confirm(`Switching to ${newMode} mode will clear the current ${macro.mode} definition. Continue?`)) {
        return;
    }
    
    let newContent: FlowchartContent | ScriptContent;
    
    if (newMode === 'FLOWCHART') {
      newContent = initialFlowchartContent;
    } else { // SCRIPT
      newContent = initialScriptContent;
    }
    
    setMacro(prev => ({
      ...prev,
      mode: newMode,
      content: newContent
    }));
  };

  const currentContent = useMemo(() => macro.content, [macro.content]);

  const renderContentEditor = () => {
    if (macro.mode === 'FLOWCHART') {
      return (
        <FlowchartEditor
          content={currentContent as FlowchartContent}
          onChange={handleContentChange as (content: FlowchartContent) => void}
        />
      );
    }
    
    if (macro.mode === 'SCRIPT') {
      return (
        <ScriptEditor
          content={currentContent as ScriptContent}
          onChange={handleContentChange as (content: ScriptContent) => void}
        />
      );
    }
    return <p style={{ color: 'red' }}>Error: Unknown macro mode.</p>;
  };

  const handleSave = () => {
      // In a real application, this would dispatch an action to save the macro configuration
      console.log('Saving Macro Definition:', macro);
      alert(`Macro "${macro.name}" saved! (Definition mode: ${macro.mode})`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif', backgroundColor: '#fff' }}>
      <h1 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', color: '#333' }}>
        Automation Macro Builder
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '20px' }}>
        
        {/* Metadata Section */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Macro Name:</label>
          <input
            type="text"
            value={macro.name}
            onChange={(e) => handleMacroChange('name', e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description:</label>
          <textarea
            value={macro.description}
            onChange={(e) => handleMacroChange('description', e.target.value)}
            rows={2}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc' }}
          />
        </div>
      </div>

      {/* Mode Switcher */}
      <div style={{ marginBottom: '20px', border: '1px solid #007bff', borderRadius: '5px', display: 'inline-block', overflow: 'hidden' }}>
        <button 
          onClick={() => handleModeChange('FLOWCHART')} 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: macro.mode === 'FLOWCHART' ? '#007bff' : 'transparent', 
            color: macro.mode === 'FLOWCHART' ? 'white' : '#007bff', 
            border: 'none', 
            cursor: 'pointer',
            borderRight: '1px solid #007bff'
          }}
        >
          <span style={{fontWeight: 'bold'}}>&#9632; Visual Flowchart</span>
        </button>
        <button 
          onClick={() => handleModeChange('SCRIPT')} 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: macro.mode === 'SCRIPT' ? '#007bff' : 'transparent', 
            color: macro.mode === 'SCRIPT' ? 'white' : '#007bff', 
            border: 'none', 
            cursor: 'pointer' 
          }}
        >
          <span style={{fontWeight: 'bold'}}>&#60;/&#62; Scripting Code</span>
        </button>
      </div>

      {/* Dynamic Editor Content */}
      <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
        {renderContentEditor()}
      </div>
      
      <div style={{ marginTop: '30px', textAlign: 'right' }}>
        <button 
          onClick={handleSave} 
          style={{ 
            padding: '12px 40px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer', 
            fontSize: '18px',
            fontWeight: 'bold'
          }}
        >
          Save Macro Definition
        </button>
      </div>
    </div>
  );
};

export default MacroDefinitionView;