import { CSSProperties } from 'react';

export const O_tableCellStyle: CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #e0e0e0',
  textAlign: 'left',
  fontSize: '14px',
  color: '#333',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

export const O_tableHeaderStyle: CSSProperties = {
  ...O_tableCellStyle,
  fontWeight: 'bold',
  backgroundColor: '#f5f5f5',
  color: '#555',
};

export const O_tableRowStyle: CSSProperties = {
  backgroundColor: '#fff',
  '&:hover': {
    backgroundColor: '#f9f9f9',
  },
};

export const O_tableContainerStyle: CSSProperties = {
  width: '100%',
  overflowX: 'auto',
  border: '1px solid #e0e0e0',
  borderRadius: '4px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};