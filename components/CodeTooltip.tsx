
import React, { useState } from 'react';

// Embedded mock schema data
const schemaData = {
  definitions: {
    "ExternalPurpose1Code": {
      "description": "*`CASH` - Cash management.\n*`SECU` - Securities.",
      "enum": ["CASH", "SECU"]
    }
  }
};

interface CodeTooltipProps {
  codeType: string;
  codeValue: string;
  children: React.ReactNode;
}

const CodeTooltip: React.FC<CodeTooltipProps> = ({ codeType, codeValue, children }) => {
  const [isHovering, setIsHovering] = useState(false);

  // Simplified logic for this fix
  const definition = schemaData.definitions[codeType as keyof typeof schemaData.definitions]?.description;

  return (
    <span
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{ position: 'relative', cursor: 'help', textDecoration: 'underline dotted' }}
    >
      {children}
      {isHovering && definition && (
        <span style={{
            position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: 'black', color: 'white', padding: '5px', borderRadius: '4px',
            width: '200px', fontSize: '12px', zIndex: 1000
        }}>
            {definition}
        </span>
      )}
    </span>
  );
};

export default CodeTooltip;
