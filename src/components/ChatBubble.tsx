import React, { useEffect, useRef, useState } from 'react';
import { Paper, Typography, Avatar, Box, Skeleton, IconButton, Tooltip, Menu, MenuItem, TextField, Button, Theme } from '@mui/material';
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
        gap: { xs: 1, sm: 2 },
        mb: 2,
        maxWidth: '100%',
        width: '100%',
        boxSizing: 'border-box',
        px: { xs: 1, sm: 0 },
      }}
    >
      <Avatar 
        src={isUser ? '/Headshot.PNG' : '/INT LOGO.png'} 
        sx={{ 
          boxShadow: 2,
          width: { xs: 32, sm: 40 },
          height: { xs: 32, sm: 40 },
          bgcolor: message.isLoading ? 'transparent' : undefined,
          display: { xs: 'none', sm: 'block' }
        }}
      />
      
      {isUser ? (
        // User message - in a box
        <Box sx={{ 
          maxWidth: isEditing ? '95%' : { xs: '85%', sm: '80%' },
          width: 'fit-content',
          boxSizing: 'border-box',
          ml: { xs: 0, sm: 2 },
        }}>
          <Paper
            elevation={2}
            sx={{
              p: 1.5,
              bgcolor: isEditing ? 'background.paper' : 'secondary.main',
              color: isEditing ? 'text.primary' : 'text.primary',
              borderRadius: '12px',
              position: 'relative',
              borderTopRightRadius: '4px',
              '&::before': {
                content: '""',
                position: 'absolute',
                right: -6,
                top: 0,
                borderTop: '8px solid transparent',
                borderLeft: `8px solid ${isEditing ? (theme: Theme) => theme.palette.background.paper : (theme: Theme) => theme.palette.secondary.main}`,
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
              <Typography 
                ref={contentRef}
                variant="body1" 
                component="div"
                sx={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.3,
                  position: 'relative',
                  minHeight: '24px',
                  '& p': {
                    marginTop: 0.25,
                    marginBottom: 0.25,
                    lineHeight: 1.3,
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
            )}
          </Paper>

          {/* Timestamp and edit button below the bubble */}
          {!isEditing && (
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                alignItems: 'center', 
                gap: 1,
                mt: 0.5,
                mr: 0.5,
                opacity: 0.7
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: { xs: '0.65rem', sm: '0.75rem' }
                }}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
              
              {onEditMessage && (
                <>
                  <IconButton 
                    size="small" 
                    sx={{ 
                      p: 0.5,
                      '&:hover': { opacity: 1 },
                      transform: { xs: 'translateY(-1px)', sm: 'none' }
                    }}
                    onClick={handleOpenMenu}
                  >
                    <EditIcon sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.9rem' }
                    }} />
                  </IconButton>
                  
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
                </>
              )}
            </Box>
          )}
        </Box>
      ) : (
        // AI message - no box, just text
        <Box
          sx={{
            p: { xs: 1, sm: 2 },
            maxWidth: { xs: '85%', sm: '80%' },
            color: 'text.primary',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            mr: { xs: 0, sm: 2 },
            '& code': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '0.1em 0.3em',
              borderRadius: '3px',
              fontFamily: '"Consolas", "Monaco", monospace',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            },
            '& pre': {
              backgroundColor: 'rgba(50, 50, 50, 0.25)',
              padding: '0.5em',
              borderRadius: '4px',
              overflowX: 'auto',
              fontFamily: '"Consolas", "Monaco", monospace',
              maxWidth: '100%',
              '& code': {
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }
            }
          }}
        >
          {/* Provider and Model info */}
          {message.provider && message.modelName && (
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block',
                color: 'text.secondary',
                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                mb: { xs: 0.25, sm: 0.5 },
                lineHeight: { xs: 1.2, sm: 1.5 },
                transform: { xs: 'translateY(8px)', sm: 'none' }
              }}
            >
              {formatProviderName(message.provider)} — {formatModelName(message.modelName)}
            </Typography>
          )}

          {/* Chain of Thought content - DeepSeek */}
          {!isUser && message.reasoningContent && (
            <Box
              sx={{
                borderLeft: '2px solid',
                borderColor: 'primary.main',
                pl: 2,
                py: 1,
                my: 1,
                bgcolor: 'rgba(25, 118, 210, 0.05)',
                borderRadius: '4px',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: 'primary.main',
                  fontWeight: 500,
                  mb: 0.5
                }}
              >
                Reasoning
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  color: 'text.secondary',
                  fontSize: '0.9em',
                  lineHeight: 1.4
                }}
              >
                {message.reasoningContent}
              </Typography>
            </Box>
          )}

          {/* Chain of Thought content - Gemini */}
          {!isUser && message.thinkingContent && (
            <Box
              sx={{
                borderLeft: '2px solid',
                borderColor: 'secondary.main',
                pl: 2,
                py: 1,
                my: 1,
                bgcolor: 'rgba(156, 39, 176, 0.05)',
                borderRadius: '4px',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: 'secondary.main',
                  fontWeight: 500,
                  mb: 0.5
                }}
              >
                Thinking
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  color: 'text.secondary',
                  fontSize: '0.9em',
                  lineHeight: 1.4
                }}
              >
                {message.thinkingContent}
              </Typography>
            </Box>
          )}
          
          {/* Message content */}
          <Typography 
            ref={contentRef}
            variant="body1" 
            component="div"
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.3,
              position: 'relative',
              minHeight: '24px',  // Ensure minimum height for empty content
              '&::before': message.isLoading ? {
                content: '"|"',
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                animation: 'blink 1s step-end infinite',
                color: 'primary.main',
                fontSize: '1.2em',
                lineHeight: 1,
                height: '1em',
              } : {},
              pl: message.isLoading ? '12px' : 0,
              '@keyframes blink': {
                '0%, 100%': {
                  opacity: 1,
                },
                '50%': {
                  opacity: 0,
                },
              },
              '& p': {
                marginTop: 0.25,
                marginBottom: 0.25,
                lineHeight: 1.3,
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
          
          {/* Timestamp - always show */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mt: { xs: 0.5, sm: 1 },
            transform: { xs: 'translateY(-8px)', sm: 'none' }
          }}>
            <Typography 
              variant="caption" 
              sx={{ 
                opacity: 0.7,
                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                lineHeight: { xs: 1.2, sm: 1.5 }
              }}
            >
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ChatBubble; 