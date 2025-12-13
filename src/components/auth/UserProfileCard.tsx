import React from 'react';
import { Avatar, Card, CardContent, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// Assuming you have a User type defined elsewhere, e.g., in src/types/user.ts
// For demonstration purposes, we'll define a simple User interface here.
interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  // Add other relevant profile fields as needed
}

interface UserProfileCardProps {
  user: User;
  isLoading?: boolean;
  error?: string | null;
}

const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 345,
  margin: theme.spacing(2),
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(10),
  height: theme.spacing(10),
  marginBottom: theme.spacing(2),
}));

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user, isLoading, error }) => {
  if (isLoading) {
    return (
      <StyledCard>
        <CardContent>
          <Typography variant="h6" component="div" sx={{ mb: 1 }}>
            Loading Profile...
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Avatar sx={{ width: 80, height: 80 }} />
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            Loading username...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Loading email...
          </Typography>
        </CardContent>
      </StyledCard>
    );
  }

  if (error) {
    return (
      <StyledCard>
        <CardContent>
          <Typography variant="h6" color="error" component="div" sx={{ mb: 1 }}>
            Error loading profile
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
        </CardContent>
      </StyledCard>
    );
  }

  if (!user) {
    return (
      <StyledCard>
        <CardContent>
          <Typography variant="h6" component="div" sx={{ mb: 1 }}>
            No user data available
          </Typography>
        </CardContent>
      </StyledCard>
    );
  }

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  const displayName = fullName || user.username;

  return (
    <StyledCard elevation={4}>
      <CardContent>
        <StyledAvatar
          alt={user.username}
          src={user.avatarUrl}
        >
          {!user.avatarUrl && displayName.charAt(0).toUpperCase()}
        </StyledAvatar>
        <Typography variant="h5" component="div" sx={{ mb: 1 }}>
          {displayName}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
          @{user.username}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          {user.email}
        </Typography>
        {/* Add more profile details here as needed */}
        {/* Example: */}
        {/* {user.bio && (
          <Typography variant="body2" color="text.primary" sx={{ mt: 2 }}>
            {user.bio}
          </Typography>
        )} */}
      </CardContent>
    </StyledCard>
  );
};

export default UserProfileCard;