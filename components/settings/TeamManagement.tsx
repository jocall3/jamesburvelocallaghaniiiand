import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  IconButton,
  Typography,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';

// Define the type for a team member
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Member' | 'Viewer';
}

// Mock data for team members (replace with actual API calls in a real app)
const mockTeamMembers: TeamMember[] = [
  { id: '1', name: 'Alice Smith', email: 'alice.smith@example.com', role: 'Admin' },
  { id: '2', name: 'Bob Johnson', email: 'bob.johnson@example.com', role: 'Member' },
  { id: '3', name: 'Charlie Brown', email: 'charlie.brown@example.com', role: 'Viewer' },
];

const TeamManagement: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('Member');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    // In a real application, you would fetch team members from an API here.
    setTeamMembers(mockTeamMembers);
  }, []);

  const handleInviteMember = () => {
    if (!inviteEmail || !inviteRole) {
      // Basic validation
      return;
    }
    const newMember: TeamMember = {
      id: Date.now().toString(), // Simple ID generation for mock
      name: inviteEmail.split('@')[0], // Placeholder name
      email: inviteEmail,
      role: inviteRole,
    };
    setTeamMembers([...teamMembers, newMember]);
    setInviteEmail('');
    setInviteRole('Member');
    setIsInviteDialogOpen(false);
  };

  const handleDeleteMember = (memberId: string) => {
    setTeamMembers(teamMembers.filter((member) => member.id !== memberId));
  };

  const handleOpenEditDialog = (member: TeamMember) => {
    setEditingMember({ ...member });
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingMember(null);
  };

  const handleSaveEdit = () => {
    if (!editingMember) return;
    setTeamMembers(
      teamMembers.map((member) =>
        member.id === editingMember.id ? editingMember : member
      )
    );
    handleCloseEditDialog();
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (editingMember) {
      setEditingMember({
        ...editingMember,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleEditRoleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    if (editingMember) {
      setEditingMember({
        ...editingMember,
        role: event.target.value as TeamMember['role'],
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Team Management
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => setIsInviteDialogOpen(true)}
        >
          Invite Member
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teamMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell component="th" scope="row">
                  {member.name}
                </TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.role}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    aria-label="edit"
                    onClick={() => handleOpenEditDialog(member)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    aria-label="delete"
                    onClick={() => handleDeleteMember(member.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Invite Member Dialog */}
      <Dialog open={isInviteDialogOpen} onClose={() => setIsInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Invite New Team Member
          <IconButton
            aria-label="close"
            onClick={() => setIsInviteDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel id="invite-role-label">Role</InputLabel>
            <Select
              labelId="invite-role-label"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as TeamMember['role'])}
              label="Role"
            >
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Member">Member</MenuItem>
              <MenuItem value="Viewer">Viewer</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsInviteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleInviteMember}>
            Invite
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit Team Member
          <IconButton
            aria-label="close"
            onClick={handleCloseEditDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        {editingMember && (
          <DialogContent>
            <TextField
              margin="dense"
              label="Name"
              type="text"
              fullWidth
              variant="outlined"
              name="name"
              value={editingMember.name}
              onChange={handleEditInputChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Email Address"
              type="email"
              fullWidth
              variant="outlined"
              name="email"
              value={editingMember.email}
              onChange={handleEditInputChange}
              disabled // Email is usually not editable
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth variant="outlined">
              <InputLabel id="edit-role-label">Role</InputLabel>
              <Select
                labelId="edit-role-label"
                value={editingMember.role}
                onChange={handleEditRoleChange}
                label="Role"
              >
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Member">Member</MenuItem>
                <MenuItem value="Viewer">Viewer</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamManagement;