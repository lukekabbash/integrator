import React, { useEffect, useRef, useState } from 'react';
import { Paper, Typography, Avatar, Box, Skeleton, IconButton, Tooltip, Menu, MenuItem, TextField, Button } from '@mui/material';
import { Message } from '../types/chat';
import { processText } from '../utils/textFormatting';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import SendIcon from '@mui/icons-material/Send';
import CancelIcon from '@mui/icons-material/Cancel';

// Provider display name formatting
const formatProviderName = (provider: string): string => {
  const providerFormatting: { [key: string]: string } = {
    'openai': 'OpenAI',
    'google': 'Google',
    'anthropic': 'Anthropic',
    'xai': 'xAI',
    'deepseek': 'DeepSeek',
    'perplexity': 'Perplexity'
  };
  return providerFormatting[provider] || provider;
};

// Model display name formatting
const formatModelName = (modelName: string): string => {
  // Special cases for specific model formatting
  const modelFormatting: { [key: string]: string } = {
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'gemini-pro': 'Gemini Pro',
    'gemini-pro-vision': 'Gemini Pro Vision',
    'claude-3-opus': 'Claude 3 Opus',
    'claude-3-sonnet': 'Claude 3 Sonnet',
    'grok-1': 'Grok 1',
    'grok-2': 'Grok 2',
    'deepseek-chat': 'DeepSeek Chat',
    'deepseek-reasoner': 'DeepSeek Reasoner',
    'sonar': 'Sonar',
    'sonar-pro': 'Sonar Pro',
    'sonar-small': 'Sonar Small'
  };

  return modelFormatting[modelName] || modelName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface ChatBubbleProps {
  message: Message;
  isLatest: boolean;
  onEditMessage?: (messageId: string, content: string, branch: boolean) => void;
  onUpdateMessage?: (messageId: string, newContent: string) => void;
  isEditing?: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  message, 
  isLatest, 
  onEditMessage,
  onUpdateMessage
}) => {
  const isUser = message.role === 'user';
  const contentRef = useRef<HTMLDivElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  
  // Process message content to handle formatting
  const processedContent = React.useMemo(() => {
    const processed = processText(message.content);
    // Sanitize the HTML to prevent XSS attacks
    return DOMPurify.sanitize(processed);
  }, [message.content]);

  // Initialize Prism highlighting after content is rendered
  useEffect(() => {
    if (!message.isLoading && contentRef.current) {
      try {
        // Only highlight code blocks within the content
        const codeBlocks = contentRef.current.querySelectorAll('pre code');
        if (codeBlocks.length > 0) {
          codeBlocks.forEach(block => {
            try {
              Prism.highlightElement(block);
            } catch (blockError) {
              console.warn('Failed to highlight individual code block:', blockError);
            }
          });
        }
      } catch (error) {
        console.warn('Error applying syntax highlighting:', error);
      }
    }
  }, [processedContent, message.isLoading]);

  useEffect(() => {
    // Add copy buttons to code blocks in AI messages
    if (!isUser && !message.isLoading && contentRef.current) {
      const codeBlocks = contentRef.current.querySelectorAll('pre');
      
      codeBlocks.forEach(pre => {
        // Check if we've already added a copy button
        if (pre.querySelector('.code-copy-button')) {
          return;
        }
        
        // Create container for position relative
        const container = document.createElement('div');
        container.style.position = 'relative';
        pre.parentNode?.insertBefore(container, pre);
        container.appendChild(pre);
        
        // Create copy button
        const copyButton = document.createElement('button');
        copyButton.innerHTML = '<svg style="width:16px;height:16px" viewBox="0 0 24 24"><path fill="currentColor" d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" /></svg>';
        copyButton.className = 'code-copy-button';
        copyButton.style.position = 'absolute';
        copyButton.style.bottom = '5px';
        copyButton.style.right = '50%';
        copyButton.style.transform = 'translateX(50%)';
        copyButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        copyButton.style.border = 'none';
        copyButton.style.borderRadius = '4px';
        copyButton.style.padding = '4px 8px';
        copyButton.style.cursor = 'pointer';
        copyButton.style.color = 'rgba(255, 255, 255, 0.8)';
        copyButton.style.fontSize = '12px';
        copyButton.style.display = 'flex';
        copyButton.style.alignItems = 'center';
        copyButton.style.gap = '4px';
        copyButton.title = 'Copy code';
        
        copyButton.addEventListener('click', () => {
          const code = pre.querySelector('code');
          if (code) {
            navigator.clipboard.writeText(code.textContent || '')
              .then(() => {
                copyButton.innerHTML = '<svg style="width:16px;height:16px" viewBox="0 0 24 24"><path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg>';
                copyButton.style.backgroundColor = 'rgba(100, 100, 100, 0.4)';
                setTimeout(() => {
                  copyButton.innerHTML = '<svg style="width:16px;height:16px" viewBox="0 0 24 24"><path fill="currentColor" d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" /></svg>';
                  copyButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }, 2000);
              })
              .catch(err => console.error('Failed to copy code: ', err));
          }
        });
        
        container.appendChild(copyButton);
      });
    }
  }, [isUser, message.isLoading, processedContent]);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleEditMessage = () => {
    if (onUpdateMessage) {
      // Enable inline editing
      setIsEditing(true);
    } else if (onEditMessage) {
      // Fall back to the old method if onUpdateMessage isn't provided
      onEditMessage(message.id, message.content, false);
    }
    handleCloseMenu();
  };

  const handleBranchMessage = () => {
    if (onEditMessage) {
      onEditMessage(message.id, message.content, true);
    }
    handleCloseMenu();
  };

  const handleSaveEdit = () => {
    if (onUpdateMessage && editedContent.trim()) {
      onUpdateMessage(message.id, editedContent);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 2,
        mb: 2,
        maxWidth: '100%',
      }}
    >
      <Avatar 
        src={isUser ? '/Headshot.PNG' : '/INT LOGO.png'} 
        sx={{ 
          boxShadow: 2,
          width: 40,
          height: 40
        }}
      />
      
      {isUser ? (
        // User message - in a box
        <Paper
          elevation={2}
          sx={{
            p: 2,
            maxWidth: isEditing ? '95%' : '80%',
            bgcolor: isEditing ? 'background.paper' : 'primary.light',
            color: isEditing ? 'text.primary' : 'primary.contrastText',
            borderRadius: '12px',
            position: 'relative',
            borderTopRightRadius: '4px',
            '&::before': {
              content: '""',
              position: 'absolute',
              right: -6,
              top: 0,
              borderTop: '8px solid transparent',
              borderLeft: `8px solid ${isEditing ? 'background.paper' : 'primary.light'}`,
              borderBottom: '8px solid transparent',
            },
            '& code': {
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              padding: '0.1em 0.3em',
              borderRadius: '3px',
              fontFamily: '"Consolas", "Monaco", monospace',
            },
            '& pre': {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              padding: '0.5em',
              borderRadius: '4px',
              overflowX: 'auto', 
              fontFamily: '"Consolas", "Monaco", monospace',
            },
            transition: 'all 0.2s ease-in-out',
            border: isEditing ? '2px solid' : 'none',
            borderColor: isEditing ? 'rgba(150, 150, 150, 0.5)' : 'transparent'
          }}
        >
          {message.isLoading ? (
            <Box sx={{ width: '100%' }}>
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
          ) : isEditing ? (
            // Editing mode
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                maxRows={15}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onKeyDown={handleKeyPress}
                autoFocus
                variant="outlined"
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(50, 50, 50, 0.06)'
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<CancelIcon />}
                  onClick={handleCancelEdit}
                  color="inherit"
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  size="small" 
                  startIcon={<SendIcon />}
                  onClick={handleSaveEdit}
                  color="primary"
                  disabled={!editedContent.trim()}
                  sx={{ bgcolor: 'grey.700', '&:hover': { bgcolor: 'grey.800' } }}
                >
                  Resend
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              <Typography 
                ref={contentRef}
                variant="body1" 
                component="div"
                sx={{
                  whiteSpace: 'pre-wrap',
                  '& p': {
                    marginTop: 1,
                    marginBottom: 1,
                  },
                  '& p:first-of-type': {
                    marginTop: 0,
                  },
                  '& p:last-of-type': {
                    marginBottom: 0,
                  }
                }}
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography 
                  variant="caption" 
                  sx={{ opacity: 0.7 }}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
                
                {onEditMessage && (
                  <Tooltip title="Edit message">
                    <IconButton 
                      size="small" 
                      sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                      onClick={handleOpenMenu}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                <Menu
                  anchorEl={anchorEl}
                  open={menuOpen}
                  onClose={handleCloseMenu}
                  PaperProps={{
                    sx: {
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
                    }
                  }}
                >
                  <MenuItem onClick={handleEditMessage}>
                    <EditIcon fontSize="small" sx={{ mr: 1, color: 'grey.500' }} />
                    Edit Message
                  </MenuItem>
                  <MenuItem onClick={handleBranchMessage}>
                    <CallSplitIcon fontSize="small" sx={{ mr: 1, color: 'grey.500' }} />
                    Branch from Here
                  </MenuItem>
                </Menu>
              </Box>
            </>
          )}
        </Paper>
      ) : (
        // AI message - no box, just text
        <Box
          sx={{
            p: 2,
            maxWidth: '80%',
            color: 'text.primary',
            '& code': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '0.1em 0.3em',
              borderRadius: '3px',
              fontFamily: '"Consolas", "Monaco", monospace',
            },
            '& pre': {
              backgroundColor: 'rgba(50, 50, 50, 0.25)',
              padding: '0.5em',
              borderRadius: '4px',
              overflowX: 'auto',
              fontFamily: '"Consolas", "Monaco", monospace',
            }
          }}
        >
          {message.isLoading ? (
            <Box sx={{ width: '100%' }}>
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
          ) : (
            <>
              {/* Provider and Model info */}
              {message.provider && message.modelName && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block',
                    mb: 0.5,
                    mt: -0.5,
                    color: 'text.secondary',
                    fontSize: '0.75rem'
                  }}
                >
                  {formatProviderName(message.provider)} — {formatModelName(message.modelName)}
                </Typography>
              )}
              
              {/* Message content */}
              <Typography 
                ref={contentRef}
                variant="body1" 
                component="div"
                sx={{
                  whiteSpace: 'pre-wrap',
                  '& p': {
                    marginTop: 1,
                    marginBottom: 1,
                  },
                  '& p:first-of-type': {
                    marginTop: 0,
                  },
                  '& p:last-of-type': {
                    marginBottom: 0,
                  }
                }}
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />
              
              {/* Timestamp */}
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="caption" 
                  sx={{ opacity: 0.7 }}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ChatBubble; 