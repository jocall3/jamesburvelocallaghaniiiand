import React from 'react';
import { Card, CardHeader, CardContent, Typography, makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  root: {
    marginBottom: '20px',
  },
  header: {
    backgroundColor: '#f0f0f0',
    padding: '10px',
  },
  content: {
    padding: '10px',
  },
  alert: {
    color: 'red',
    fontWeight: 'bold',
  },
});

interface ShadowITAlertWidgetProps {
  shadowITDetected: boolean;
  appName?: string;
  appId?: string;
  // Add other props like risk level, associated users, etc.
}

const ShadowITAlertWidget: React.FC<ShadowITAlertWidgetProps> = ({ shadowITDetected, appName, appId }) => {
  const classes = useStyles();

  return (
    <Card className={classes.root}>
      <CardHeader className={classes.header} title="Shadow IT Alert" />
      <CardContent className={classes.content}>
        {shadowITDetected ? (
          <>
            <Typography className={classes.alert}>Potential Shadow IT Detected!</Typography>
            <Typography>
              {appName ? `Application: ${appName}` : "Potential unauthorized application detected."}
            </Typography>
              {appId && <Typography>App ID: {appId}</Typography>}

            {/* Display details about the detected app. Further details will be added
                depending on the overall information available for each Shadow IT item
                (e.g. risk level, impacted users, etc.). */}
            {/* Example:
            <Typography>Risk Level: High</Typography>
            <Typography>Impacted Users: User1, User2, ...</Typography> */}
          </>
        ) : (
          <Typography>No Shadow IT detected.</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default ShadowITAlertWidget;