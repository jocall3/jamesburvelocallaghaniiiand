import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Paper,
} from '@mui/material';

// --- THEME ---
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#76ff03' },
    background: { default: '#121212', paper: '#1e1e1e' },
    text: { primary: '#e0e0e0', secondary: '#b3b3b3' },
  },
  typography: {
    h4: { fontWeight: 700, marginBottom: '1rem' },
    h5: { fontWeight: 600, marginBottom: '0.75rem' },
    h6: { fontWeight: 600, marginTop: '2rem', marginBottom: '1rem', color: '#76ff03' },
    body1: { lineHeight: 1.7 },
    body2: { lineHeight: 1.6, color: '#b3b3b3' },
  }
});

// --- MAIN VIEW (now a blog post renderer) ---
export const ComplianceOracleView = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />

      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <Typography variant="h5" sx={{ flexGrow: 1 }}>
              The Compliance Oracle Blog
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ py: 4, flexGrow: 1, overflowY: 'auto' }}>
          <Paper sx={{ p: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              The Silent Guardians: 4 Surprising Insights from Building a Real-Time Compliance Oracle
            </Typography>

            <Typography variant="body1" paragraph>
              Ever wondered what it takes to keep the financial world safe and compliant in an age of lightning-fast transactions? It's not just about rules and regulations; it's about an intricate dance of data, technology, and constant vigilance. We recently peeked behind the curtain of a "Compliance Oracle Dashboard" – a system designed to be the eyes and ears of regulatory adherence. What we found wasn't just code; it was a masterclass in turning complex, abstract risks into clear, actionable intelligence. Here are the most impactful takeaways from this digital guardian.
            </Typography>

            {/* Takeaway 1 */}
            <Typography variant="h6" component="h2">
              1. The Illusion of Simplicity: Beneath Every Green Checkmark, a Data Deluge
            </Typography>
            <Typography variant="body1" paragraph>
              When you see a dashboard proudly displaying "Compliant" next to critical regulations like BSA/AML or OFAC, it looks reassuringly simple. But the code reveals a different story: a relentless torrent of data. Thousands, even hundreds of thousands, of messages (like <Box component="code" sx={{ backgroundColor: '#333', p: '2px 4px', borderRadius: '4px' }}>pacs.008</Box>, <Box component="code" sx={{ backgroundColor: '#333', p: '2px 4px', borderRadius: '4px' }}>pacs.009</Box>, <Box component="code" sx={{ backgroundColor: '#333', p: '2px 4px', borderRadius: '4px' }}>camt.053</Box> in financial messaging) flow through the system every hour, each a potential vector for risk. The dashboard's calm exterior belies the intense processing required to sift through this digital ocean.
            </Typography>
            <Box component="blockquote" sx={{
              borderLeft: '4px solid #76ff03',
              pl: 2,
              ml: 0,
              py: 1,
              fontStyle: 'italic',
              color: 'text.secondary'
            }}>
              <Typography variant="body1">
                "Compliance isn't just about ticking boxes; it's about understanding the intricate dance of millions of data points, each scrutinized for the slightest anomaly."
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              This constant ingestion and analysis of data is the unsung hero, ensuring that the green checkmark isn't just a facade but a reflection of genuine, real-time adherence. It's a powerful reminder that true compliance is built on a foundation of comprehensive data mastery.
            </Typography>

            {/* Takeaway 2 */}
            <Typography variant="h6" component="h2">
              2. From Abstract Risk Scores to Actionable Insights: The Power of Visualization
            </Typography>
            <Typography variant="body1" paragraph>
              Numbers alone can be overwhelming. A transaction with a "risk score of 88" might raise an eyebrow, but what does it <Box component="em" sx={{ fontStyle: 'italic' }}>mean</Box>? This is where the Compliance Oracle truly shines. It transforms abstract metrics into vivid, actionable insights. High-risk transactions aren't just listed; they're color-coded, flagged with clear reasons, and even plotted on a global map. Seeing a red polyline stretch from the USA to Russia, or the UK to Iran, instantly communicates the gravity and geographical spread of potential threats.
            </Typography>
            <Typography variant="body1" paragraph>
              The simple yet effective <Box component="code" sx={{ backgroundColor: '#333', p: '2px 4px', borderRadius: '4px' }}>getRiskScoreColor</Box> function, for instance, is a testament to this principle:
            </Typography>
            <Box component="pre" sx={{ backgroundColor: '#222', p: 2, borderRadius: 1, overflowX: 'auto', mb: 2 }}>
              <Typography component="code" variant="body2" sx={{ color: '#e0e0e0' }}>
                {`const getRiskScoreColor = (score: number) =>
  score > 85 ? '#f44336' : score > 65 ? '#ff9800' : '#ffc107';`}
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              This isn't just about aesthetics; it's about cognitive load reduction. By making risk visually intuitive, analysts can prioritize and respond with unprecedented speed.
            </Typography>

            {/* Takeaway 3 */}
            <Typography variant="h6" component="h2">
              3. The Unsung Hero: Mock Data as the Architect of Robust Systems
            </Typography>
            <Typography variant="body1" paragraph>
              In highly regulated environments, real-world data is often sensitive, scarce, or difficult to access for development and testing. The Compliance Oracle's code reveals a sophisticated approach to this challenge: extensive, realistic mock data generation. Functions like <Box component="code" sx={{ backgroundColor: '#333', p: '2px 4px', borderRadius: '4px' }}>generateMessageFlowData</Box> and <Box component="code" sx={{ backgroundColor: '#333', p: '2px 4px', borderRadius: '4px' }}>generateRiskAlerts</Box> aren't just placeholders; they're carefully crafted simulations of real-world scenarios, complete with varying risk scores, reasons, and statuses.
            </Typography>
            <Typography variant="body1" paragraph>
              This isn't merely a development convenience; it's a strategic imperative. It allows developers to:
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                <Typography component="li" variant="body1">Stress-test the system with diverse data patterns.</Typography>
                <Typography component="li" variant="body1">Simulate rare but critical events (e.g., sanction list hits).</Typography>
                <Typography component="li" variant="body1">Demonstrate the system's capabilities without compromising sensitive information.</Typography>
              </Box>
            </Typography>
            <Box component="blockquote" sx={{
              borderLeft: '4px solid #76ff03',
              pl: 2,
              ml: 0,
              py: 1,
              fontStyle: 'italic',
              color: 'text.secondary'
            }}>
              <Typography variant="body1">
                "In the world of high-stakes compliance, realistic mock data isn't a luxury; it's the bedrock of innovation and reliability, allowing us to build and test the future, today."
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              It underscores that building resilient systems often starts with intelligently simulating the world they're meant to protect.
            </Typography>

            {/* Takeaway 4 */}
            <Typography variant="h6" component="h2">
              4. The Ever-Vigilant Eye: Real-Time Monitoring as the New Standard
            </Typography>
            <Typography variant="body1" paragraph>
              The <Box component="code" sx={{ backgroundColor: '#333', p: '2px 4px', borderRadius: '4px' }}>useEffect</Box> hook in the Compliance Oracle's core component is a silent powerhouse, constantly updating message flows, generating new risk alerts, and incrementing total message counts every few seconds. This isn't just a static report; it's a living, breathing system that mirrors the dynamic nature of financial transactions.
            </Typography>
            <Box component="pre" sx={{ backgroundColor: '#222', p: 2, borderRadius: 1, overflowX: 'auto', mb: 2 }}>
              <Typography component="code" variant="body2" sx={{ color: '#e0e0e0' }}>
                {`useEffect(() => {
  const interval = setInterval(() => {
    // ... data generation and state updates ...
  }, 3000); // Updates every 3 seconds
  return () => clearInterval(interval);
}, []);`}
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              This continuous refresh highlights a fundamental shift in compliance: from periodic audits to perpetual vigilance. In a world where illicit activities can unfold in moments, a system that updates every three seconds isn't just fast; it's essential. It ensures that potential threats are identified and flagged <Box component="em" sx={{ fontStyle: 'italic' }}>as they happen</Box>, enabling proactive intervention rather than reactive damage control.
            </Typography>

            {/* Conclusion */}
            <Typography variant="h5" component="h3" sx={{ mt: 4, mb: 2 }}>
              Conclusion:
            </Typography>
            <Typography variant="body1" paragraph>
              The Compliance Oracle Dashboard is more than just a collection of charts and tables; it's a testament to how cutting-edge technology can transform the daunting task of regulatory compliance into a manageable, even proactive, endeavor. By embracing real-time data, powerful visualizations, and robust development practices, we can build systems that not only meet regulatory demands but actively safeguard our financial ecosystems.
            </Typography>
            <Typography variant="body1" paragraph>
              As we navigate an increasingly complex global landscape, one question remains: How can we continue to leverage these "silent guardians" to anticipate tomorrow's risks, before they even emerge?
            </Typography>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};