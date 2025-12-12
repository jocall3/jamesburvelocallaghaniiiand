import React from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
}));

const StyledToolbar = styled(Toolbar)({
  display: 'flex',
  justifyContent: 'space-between',
});

const TitleLink = styled(Link)({
  textDecoration: 'none',
  color: 'inherit',
});

interface HeaderProps {
  title: string;
  navLinks?: { text: string; path: string }[];
}

const Header: React.FC<HeaderProps> = ({ title, navLinks = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <StyledAppBar position="static">
      <StyledToolbar>
        <Typography variant="h6">
          <TitleLink to="/">{title}</TitleLink>
        </Typography>
        {isMobile ? (
          <div>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={open}
              onClose={handleClose}
            >
              {navLinks.map((link) => (
                <MenuItem key={link.path} onClick={handleClose}>
                  <Link to={link.path} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {link.text}
                  </Link>
                </MenuItem>
              ))}
            </Menu>
          </div>
        ) : (
          <div>
            {navLinks.map((link) => (
              <Button key={link.path} color="inherit" component={Link} to={link.path}>
                {link.text}
              </Button>
            ))}
          </div>
        )}
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default Header;