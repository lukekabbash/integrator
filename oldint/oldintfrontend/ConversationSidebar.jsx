import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  styled,
} from '@mui/material';
import {
  Add as AddIcon,
  Chat as ChatIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAI } from '../contexts/AIContext';

const SidebarContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
}));

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
}));

const ConversationSidebar = () => {
  const { messages, setMessages } = useAI();

  const handleNewConversation = () => {
    setMessages([]);
  };

  return (
    <SidebarContainer>
      <Header>
        <Typography variant="h6">Conversations</Typography>
        <IconButton onClick={handleNewConversation} color="primary">
          <AddIcon />
        </IconButton>
      </Header>
      
      <Divider />
      
      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <ChatIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Current Chat"
              secondary="Started 2 minutes ago" 
            />
          </ListItemButton>
        </ListItem>
      </List>
    </SidebarContainer>
  );
};

export default ConversationSidebar; 