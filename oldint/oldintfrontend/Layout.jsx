import React from 'react';
import { Box, Drawer, styled } from '@mui/material';
import ConversationSidebar from './ConversationSidebar';
import SettingsSidebar from './SettingsSidebar';

const SIDEBAR_WIDTH = 280;

const MainContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
}));

const Content = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  marginLeft: SIDEBAR_WIDTH,
  marginRight: SIDEBAR_WIDTH,
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.default,
}));

const Sidebar = styled(Drawer)({
  width: SIDEBAR_WIDTH,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: SIDEBAR_WIDTH,
    boxSizing: 'border-box',
  },
});

const Layout = ({ children }) => {
  return (
    <MainContainer>
      <Sidebar
        variant="permanent"
        anchor="left"
        sx={{
          '& .MuiDrawer-paper': {
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <ConversationSidebar />
      </Sidebar>

      <Content>{children}</Content>

      <Sidebar
        variant="permanent"
        anchor="right"
        sx={{
          '& .MuiDrawer-paper': {
            backgroundColor: 'background.paper',
            borderLeft: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <SettingsSidebar />
      </Sidebar>
    </MainContainer>
  );
};

export default Layout; 