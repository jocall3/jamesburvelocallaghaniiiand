import { createTheme } from '@mui/material/styles';

// Define custom color palette
const primary = {
  main: '#1976d2', // A standard blue
  light: '#42a5f5',
  dark: '#1565c0',
  contrastText: '#ffffff',
};

const secondary = {
  main: '#9c27b0', // A standard purple
  light: '#ba68c8',
  dark: '#7b1fa2',
  contrastText: '#ffffff',
};

const error = {
  main: '#d32f2f', // A standard red
  light: '#ef5350',
  dark: '#c62828',
  contrastText: '#ffffff',
};

const warning = {
  main: '#f57c00', // A standard orange
  light: '#ff9800',
  dark: '#e65100',
  contrastText: '#ffffff',
};

const info = {
  main: '#0288d1', // A standard cyan
  light: '#03a9f4',
  dark: '#01579b',
  contrastText: '#ffffff',
};

const success = {
  main: '#2e7d32', // A standard green
  light: '#4caf50',
  dark: '#1b5e20',
  contrastText: '#ffffff',
};

// Define typography settings
const typography = {
  fontFamily: [
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.6,
  },
  h6: {
    fontSize: '1.1rem',
    fontWeight: 500,
    lineHeight: 1.7,
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.8,
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.9,
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    textTransform: 'none', // Default to no text transform for buttons
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 2.0,
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: 2.0,
    textTransform: 'uppercase',
  },
};

// Define spacing units (in pixels or rems)
const spacingUnit = 8; // Base spacing unit

// Define custom theme
const theme = createTheme({
  palette: {
    primary,
    secondary,
    error,
    warning,
    info,
    success,
    // You can add more custom colors here, e.g.,
    // custom: {
    //   brandBlue: '#007bff',
    //   lightGray: '#f8f9fa',
    // },
  },
  typography,
  spacing: (factor: number) => `${factor * spacingUnit}px`, // Example: theme.spacing(2) will be 16px
  shape: {
    borderRadius: 4, // Default border radius for components
  },
  components: {
    // You can define default styles for Material-UI components here
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Example: Make buttons have a slightly more rounded border
          textTransform: 'none', // Ensure buttons don't have uppercase text by default
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: primary.main, // Example: Set app bar background to primary color
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Example: Make cards have rounded corners
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', // Example: Add a subtle shadow
        },
      },
    },
  },
});

export default theme;