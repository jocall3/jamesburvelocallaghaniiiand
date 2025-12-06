import React from 'react';

interface CarrierText {
  footer_body: string | null;
  footer_title: string | null;
  header_body: string | null;
  header_title: string | null;
}

interface PhysicalBundle {
    features: {
      card_logo: 'unsupported' | 'optional' | 'required';
      carrier_text: 'unsupported' | 'optional' | 'required';
      second_line: 'unsupported' | 'optional' | 'required';
    };
    id: string;
    livemode: boolean;
    name: string;
    object: 'issuing.physical_bundle';
    status: string;
    type: 'custom' | 'standard';
}


interface PersonalizationDesign {
  id: string;
  object: 'issuing.personalization_design';
  name: string | null;
  status: 'rejected' | 'active' | 'pending' | string;
  card_logo: string | null; // Represents Stripe File ID for the logo
  carrier_text: CarrierText;
  physical_bundle: PhysicalBundle;
}

interface CardDesignVisualizerProps {
  design: PersonalizationDesign;
  cardholderName?: string;
}

// --- Internal Utility Components/Styling ---

const CARD_WIDTH = '400px';
const CARD_HEIGHT = '250px';

const cardStyle: React.CSSProperties = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  borderRadius: '15px',
  background: 'linear-gradient(135deg, #1f1f3a, #4a4e69)',
  boxShadow: '0 10px 20px rgba(0, 0, 0, 0.5)',
  color: 'white',
  padding: '20px',
  position: 'relative',
  fontFamily: 'monospace',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  overflow: 'hidden',
};

const chipStyle: React.CSSProperties = {
  width: '45px',
  height: '35px',
  borderRadius: '5px',
  background: '#c0c0c0',
  boxShadow: 'inset 0 0 5px rgba(0, 0, 0, 0.3)',
  position: 'absolute',
  top: '30px',
  left: '30px',
};

const logoContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  height: '40px',
};

const statusIndicatorStyle = (status: string): React.CSSProperties => {
  let color = 'gray';
  switch (status.toLowerCase()) {
    case 'active':
      color = '#00ff7f'; 
      break;
    case 'pending':
      color = '#ffff00';
      break;
    case 'rejected':
      color = '#ff4d4d';
      break;
  }
  return {
    fontSize: '10px',
    padding: '4px 8px',
    borderRadius: '8px',
    border: `1px solid ${color}`,
    color: color,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginLeft: '10px'
  };
};

const cardTextRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
};

// Mock Stripe Logo (Text representation)
const StripeLogo: React.FC = () => (
  <span style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', opacity: 0.7 }}>
    STRIPE ISSUING
  </span>
);

// --- Main Component ---

const CardDesignVisualizer: React.FC<CardDesignVisualizerProps> = ({ design, cardholderName = 'JANE DOE' }) => {
  const { status, name, card_logo } = design;

  const renderClientLogo = () => {
    if (card_logo) {
      return (
        <div style={{
          width: '50px',
          height: '30px',
          border: '1px solid white',
          borderRadius: '5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: '10px',
          fontSize: '10px',
          backgroundColor: '#ffffff10',
        }}>
          Client Logo
        </div>
      );
    }
    return null;
  };

  const getStatusText = (s: string) => {
      switch (s.toLowerCase()) {
          case 'active': return 'Approved';
          case 'pending': return 'Review Pending';
          case 'rejected': return 'Rejected';
          default: return 'Draft';
      }
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333' }}>
        Physical Card Preview: {name || design.id}
      </h3>
      
      <div style={cardStyle}>
        
        {/* Row 1: Chip and Client Logos */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div style={chipStyle} />
            <div style={logoContainerStyle}>
                {renderClientLogo()}
            </div>
        </div>


        {/* Row 2: Card Number Placeholder */}
        <div style={{ 
            fontSize: '24px', 
            letterSpacing: '3px', 
            textAlign: 'center', 
            margin: '20px 0', 
            opacity: 0.9,
            fontWeight: 500
        }}>
          **** **** **** 4242
        </div>

        {/* Row 3: Holder Name, Expiry */}
        <div style={cardTextRowStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '10px', opacity: 0.6 }}>Valid Thru</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '3px' }}>
              08/30
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <span style={{ fontSize: '10px', opacity: 0.6 }}>Cardholder Name</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '3px' }}>
              {cardholderName}
            </span>
          </div>
        </div>
        
        {/* Overlay the Stripe logo and Status */}
        <div style={{ 
            position: 'absolute', 
            bottom: '10px', 
            left: '20px', 
            display: 'flex', 
            alignItems: 'center' 
        }}>
            <span style={{ fontSize: '10px', opacity: 0.5, marginRight: '10px' }}>Design ID: {design.id.slice(0, 10)}...</span>
            <div style={statusIndicatorStyle(status)}>
                {getStatusText(status)}
            </div>
        </div>

        <div style={{ position: 'absolute', bottom: '10px', right: '20px' }}>
            <StripeLogo />
        </div>
      </div>

      {/* Auxiliary information display */}
      <div style={{ 
          marginTop: '25px', 
          border: '1px solid #e0e0e0', 
          padding: '15px', 
          borderRadius: '5px', 
          width: CARD_WIDTH,
          backgroundColor: 'white',
          color: '#333',
          fontSize: '12px'
      }}>
          <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '10px' }}>Carrier Text Configuration:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><strong>Header Title:</strong> {design.carrier_text.header_title || '—'}</div>
              <div><strong>Footer Title:</strong> {design.carrier_text.footer_title || '—'}</div>
              <div><strong>Header Body:</strong> {design.carrier_text.header_body || '—'}</div>
              <div><strong>Footer Body:</strong> {design.carrier_text.footer_body || '—'}</div>
          </div>
          <p style={{ margin: '10px 0 0 0', fontWeight: 'bold' }}>Rejection Reasons:</p>
          <p style={{ margin: '5px 0 0 0', color: design.status === 'rejected' ? 'red' : 'green' }}>
            Card Logo: {design.status === 'rejected' ? 'Rejected by issuing.personalization_design' : 'N/A'}
          </p>
      </div>
    </div>
  );
};

export default CardDesignVisualizer;