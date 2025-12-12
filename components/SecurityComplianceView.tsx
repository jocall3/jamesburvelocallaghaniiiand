import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const BlogQuote = ({ children }: { children: React.ReactNode }) => (
  <Paper
    elevation={0}
    sx={{
      borderLeft: '4px solid',
      borderColor: 'primary.main',
      pl: 2,
      py: 1,
      my: 3,
      backgroundColor: 'action.hover',
    }}
  >
    <Typography variant="body1" component="blockquote" sx={{ fontStyle: 'italic' }}>
      {children}
    </Typography>
  </Paper>
);

const SecurityComplianceView = () => {
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 5 }, maxWidth: '800px', mx: 'auto' }}>
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 'bold', letterSpacing: '-0.5px' }}
      >
        Beyond the Firewall: 3 Things Your App's Code Reveals About Your Data
      </Typography>

      <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', color: 'text.secondary', mb: 4 }}>
        We click "agree," we sign in, we share. Every day, we place a tremendous amount of trust in the digital platforms that run our lives. But have you ever wondered what that trust looks like from the other side? We dove into the code of a typical security and compliance dashboard to uncover what’s really happening behind the scenes. The findings are more revealing—and empowering—than you might think.
      </Typography>

      <Box component="section" sx={{ mb: 5 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          1. Absolute Transparency: Every Action Leaves a Trace
        </Typography>
        <Typography variant="body1" paragraph>
          The first thing you notice in a security dashboard isn't a fortress of defenses; it's a meticulous logbook. Every significant action—a login attempt, a settings change, a data export—is recorded with a timestamp, the user involved, and the specific action taken.
        </Typography>
        <Typography variant="body1" paragraph>
          This isn't about surveillance. It's about accountability. This detailed audit trail, represented in the code as `getSecurityLogs()`, is the system's source of truth. If a data breach occurs or an unauthorized change is made, this log is the first place engineers look to trace the digital breadcrumbs. It transforms security from a passive wall into an active, transparent record of events, ensuring that every action has an owner.
        </Typography>
      </Box>

      <Box component="section" sx={{ mb: 5 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          2. Compliance is a Living, Breathing Status—Not a Certificate on the Wall
        </Typography>
        <Typography variant="body1" paragraph>
          In one corner of the dashboard sits a simple indicator: "Compliance Status." It might seem trivial, but its presence implies something profound. Compliance with regulations like GDPR or HIPAA isn't a one-time certification you hang on the wall. It's a continuous, dynamic state that must be monitored constantly.
        </Typography>
        <BlogQuote>
          The code doesn't just check for a certificate; it calls a function like `getComplianceStatus()` to get a real-time report. This suggests the system is always asking itself, "Are we still following the rules?"
        </BlogQuote>
        <Typography variant="body1" paragraph>
          This is a powerful shift in perspective. It treats regulatory adherence not as a bureaucratic hurdle to be cleared, but as a vital sign for the application's health, checked and re-checked with every update and change.
        </Typography>
      </Box>

      <Box component="section" sx={{ mb: 5 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          3. The Most Powerful Button You Don't See: Your Right to Say "No"
        </Typography>
        <Typography variant="body1" paragraph>
          Perhaps the most impactful discovery is the "Consent Records" table. It doesn't just list who agreed to what; it includes a function to actively *revoke* that consent. This is where abstract legal rights become tangible lines of code.
        </Typography>
        <Typography variant="body1" paragraph>
          Your right to withdraw consent isn't just a clause in a privacy policy; it's an actual function call: `revokeConsentRecord(recordId)`. This single line of code is the mechanism that empowers users to take back control over their data. It's a reminder that good systems are built not just to acquire consent, but to respect its withdrawal. It’s the digital embodiment of "no means no."
        </Typography>
      </Box>

      <Box component="footer" sx={{ mt: 5, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Code as a Contract
        </Typography>
        <Typography variant="body1" paragraph>
          Looking at the code behind a security dashboard reveals that true digital trust isn't built on promises, but on processes. It's built on transparent logging, continuous compliance checks, and the fundamental ability to revoke consent.
        </Typography>
        <Typography variant="body1" paragraph sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
          The next time you click 'Agree,' you're not just accepting terms; you're entering into a relationship with the application's code. So, the real question is: is that code built to respect you back?
        </Typography>
      </Box>
    </Box>
  );
};

export default SecurityComplianceView;