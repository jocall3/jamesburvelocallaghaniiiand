// src/config/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Stripe-like primary colors
        stripeBlue: '#635BFF',
        stripeDarkBlue: '#42389D',
        stripeLightBlue: '#E6E6FF',
        stripeGray: '#F6F9FC',
        stripeDarkGray: '#8898AA',
        stripeText: '#30313D',
        stripeSuccess: '#28C76F',
        stripeWarning: '#FFC107',
        stripeDanger: '#EA5455',
        // Custom colors for app branding or specific UI elements
        primary: '#635BFF', // Main brand color
        secondary: '#00D1B2', // Accent color
        accent: '#FF7F50', // Another accent for highlights
        background: '#F6F9FC', // Light background
        surface: '#FFFFFF', // Card/panel background
        textPrimary: '#30313D',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
        body: ['Roboto', 'sans-serif'],
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'stripe': '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
        'stripe-lg': '0px 4px 6px rgba(0, 0, 0, 0.1), 0px 1px 3px rgba(0, 0, 0, 0.08)',
        'card': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInFromLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInFromRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out',
        slideInFromLeft: 'slideInFromLeft 0.5s ease-out',
        slideInFromRight: 'slideInFromRight 0.5s ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // For better form styling
    require('@tailwindcss/typography'), // For styling rich text content
    require('@tailwindcss/aspect-ratio'), // For aspect ratio utilities
    // Custom plugin for Stripe-like focus rings
    function ({ addUtilities, theme }) {
      const newUtilities = {
        '.focus-ring-stripe': {
          'outline': '2px solid transparent',
          'outline-offset': '2px',
          'box-shadow': `0 0 0 2px ${theme('colors.stripeBlue')}`,
        },
        '.focus-ring-stripe-dark': {
          'outline': '2px solid transparent',
          'outline-offset': '2px',
          'box-shadow': `0 0 0 2px ${theme('colors.stripeDarkBlue')}`,
        },
      };
      addUtilities(newUtilities, ['focus']);
    },
  ],
}