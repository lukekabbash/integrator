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
  useTheme,
  useMediaQuery,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ChatIcon from '@mui/icons-material/Chat';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import { ChatSession } from '../types/chat';

interface LeftSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (sessionId: string) => void;
  onEditChat?: (sessionId: string, newTitle: string) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteChat,
  onEditChat,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (sessionId: string, currentTitle: string) => {
    setEditingSessionId(sessionId);
    setEditTitle(currentTitle);
  };

  const handleSaveEdit = (sessionId: string) => {
    if (editTitle.trim() && onEditChat) {
      onEditChat(sessionId, editTitle.trim());
    }
    setEditingSessionId(null);
    setEditTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(sessionId);
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
      setEditTitle('');
    }
  };

  const handleDoubleClick = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    handleStartEdit(session.id, session.title);
  };

  const filteredSessions = sessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box
      sx={{
        width: isMobile ? '100%' : 300,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: 'none',
        bgcolor: 'background.paper',
      }}
    >
      <Box 
        sx={{ 
          p: isMobile ? 1.5 : 2, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isMobile ? 1.5 : 2
        }}
      >
        {!isMobile && (
          <Typography 
            variant="h6"
            sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}
          >
            AI Integrator
          </Typography>
        )}

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
                fontSize: isMobile ? '0.875rem' : '1rem',
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize={isMobile ? "small" : "medium"} />
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
          size={isMobile ? "small" : "medium"}
          sx={{
            borderRadius: 1.5,
            justifyContent: 'flex-start',
            textTransform: 'none',
            py: isMobile ? 0.75 : 1,
            bgcolor: 'background.default',
            fontSize: isMobile ? '0.875rem' : '1rem',
            color: 'white'
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
            width: '4px',
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
              sx={{ 
                '&:hover .action-buttons': {
                  opacity: 1,
                },
              }}
            >
              <ListItemButton
                selected={session.id === activeSessionId}
                onClick={() => onSessionSelect(session.id)}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  py: isMobile ? 0.75 : 1,
                  pr: 7,
                  position: 'relative',
                  '&.Mui-selected': {
                    backgroundColor: 'action.selected',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  },
                }}
              >
                <ChatIcon 
                  fontSize={isMobile ? "small" : "medium"}
                  sx={{ 
                    mr: 1.5, 
                    color: 'text.secondary',
                    fontSize: '1.2rem',
                  }} 
                />
                {editingSessionId === session.id ? (
                  <TextField
                    fullWidth
                    size="small"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, session.id)}
                    onBlur={() => handleSaveEdit(session.id)}
                    autoFocus
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: isMobile ? '0.875rem' : '0.9rem',
                        pr: 5.5,
                      },
                      maxWidth: 'calc(100% - 48px)',
                    }}
                  />
                ) : (
                  <ListItemText 
                    onDoubleClick={(e) => handleDoubleClick(e, session)}
                    primary={session.title}
                    primaryTypographyProps={{
                      noWrap: true,
                      fontSize: isMobile ? '0.875rem' : '0.9rem',
                    }}
                    secondary={new Date(session.updatedAt).toLocaleDateString()}
                    secondaryTypographyProps={{
                      noWrap: true,
                      fontSize: isMobile ? '0.75rem' : '0.8rem',
                    }}
                    sx={{
                      cursor: 'text',
                      maxWidth: 'calc(100% - 48px)',
                    }}
                  />
                )}
                <Stack 
                  direction="row" 
                  spacing={0.25}
                  className="action-buttons"
                  sx={{
                    position: 'absolute',
                    right: 1,
                    opacity: 0,
                    transition: 'opacity 0.2s ease-in-out',
                    p: 0.25,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(session.id, session.title);
                    }}
                    sx={{ 
                      opacity: 0.6,
                      '&:hover': { opacity: 1 },
                      padding: 0.5,
                    }}
                  >
                    <EditIcon sx={{ fontSize: '1.1rem' }} />
                  </IconButton>
                  <IconButton 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(session.id);
                    }}
                    sx={{ 
                      opacity: 0.6,
                      '&:hover': { opacity: 1 },
                      padding: 0.5,
                    }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: '1.1rem' }} />
                  </IconButton>
                </Stack>
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>

      <Divider />
    </Box>
  );
};

export default LeftSidebar; 