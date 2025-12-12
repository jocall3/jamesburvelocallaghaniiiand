import React from 'react';
import { Card, CardContent, Typography, Button, makeStyles } from '@material-ui/core';

interface AccessReviewCardProps {
  highRiskApps: {
    id: string;
    displayName: string;
    appId: string;
    createdDateTime: string;
    applicationType?: string;
    accountEnabled: boolean;
    applicationVisibility: string;
    assignmentRequired: boolean;
    isAppProxy: boolean;
  }[];
  onReviewAccess: () => void;
}

const useStyles = makeStyles({
  card: {
    marginBottom: '20px',
  },
  title: {
    marginBottom: '10px',
  },
  button: {
    marginTop: '15px',
  },
});

const AccessReviewCard: React.FC<AccessReviewCardProps> = ({ highRiskApps, onReviewAccess }) => {
  const classes = useStyles();

  const hasHighRiskApps = highRiskApps.length > 0;

  return (
    <Card className={classes.card}>
      <CardContent>
        <Typography variant="h6" className={classes.title}>
          Review Access for High-Risk Apps
        </Typography>
        {hasHighRiskApps ? (
          <>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Please review access for the following high-risk applications:
            </Typography>
            <ul>
              {highRiskApps.map((app) => (
                <li key={app.id}>
                  {app.displayName}
                </li>
              ))}
            </ul>
            <Button
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={onReviewAccess}
            >
              Review Access
            </Button>
          </>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No high-risk applications found requiring immediate attention.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default AccessReviewCard;