import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  IconButton, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemButton, 
  Divider,
  InputAdornment,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ChatIcon from '@mui/icons-material/Chat';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { ChatSession } from '../types/chat';

interface LeftSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (sessionId: string) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteChat,
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box
      sx={{
        width: 300,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: 'none',
        bgcolor: 'background.paper',
      }}
    >
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2
        }}
      >
        <Typography 
          variant="h6"
          sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}
        >
          AI Integrator
        </Typography>

        <Box>
          <TextField
            fullWidth
            placeholder="Search chats..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ 
              mb: 1,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.default',
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onNewChat}
          fullWidth
          sx={{
            borderRadius: 1.5,
            justifyContent: 'flex-start',
            textTransform: 'none',
            py: 1,
            bgcolor: 'background.default',
          }}
        >
          New Chat
        </Button>
      </Box>

      <Divider />

      <List 
        sx={{ 
          overflow: 'auto', 
          flexGrow: 1,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
          },
        }}
      >
        {filteredSessions.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No chat history found
            </Typography>
          </Box>
        ) : (
          filteredSessions.map((session) => (
            <ListItem
              key={session.id}
              disablePadding
              secondaryAction={
                <IconButton 
                  edge="end" 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(session.id);
                  }}
                  sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              }
              sx={{ pr: 6 }}
            >
              <ListItemButton
                selected={session.id === activeSessionId}
                onClick={() => onSessionSelect(session.id)}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'action.selected',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  },
                }}
              >
                <ChatIcon 
                  fontSize="small" 
                  sx={{ 
                    mr: 1.5, 
                    color: 'text.secondary' 
                  }} 
                />
                <ListItemText 
                  primary={session.title}
                  primaryTypographyProps={{
                    noWrap: true,
                    fontSize: '0.9rem',
                  }}
                  secondary={new Date(session.updatedAt).toLocaleDateString()}
                  secondaryTypographyProps={{
                    noWrap: true,
                    fontSize: '0.75rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );
};

export default LeftSidebar; 