import React, { useState, useRef, useEffect } from 'react';
import { 
  IconButton, 
  Box, 
  CircularProgress,
  TextField,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { motion } from 'framer-motion';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  isLoading: boolean;
  disabled?: boolean;
  initialMessage?: string;
  isEditing?: boolean;
  onHeightChange?: (height: number) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onClearChat, 
  isLoading, 
  disabled = false,
  initialMessage = '',
  isEditing = false,
  onHeightChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [message, setMessage] = useState(initialMessage);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Add detection for PWA mode
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;

  // Modified focus handling for PWA
  const forceFocus = () => {
    if (inputRef.current) {
      // Delay focus slightly to ensure iOS registers it
      setTimeout(() => {
        inputRef.current?.focus();
        // Scroll to input to ensure keyboard shows
        inputRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Update parent component with input height changes
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current && onHeightChange) {
        const height = containerRef.current.offsetHeight;
        onHeightChange(height);
      }
    };

    // Update height on mount and when message changes
    updateHeight();

    // Create ResizeObserver to monitor height changes
    const resizeObserver = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [message, onHeightChange]);

  // Update message state when initialMessage prop changes
  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
      if (isPWA) {
        forceFocus();
      } else if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [initialMessage, isPWA]);

  useEffect(() => {
    // Focus input on component mount
    if (isPWA) {
      forceFocus();
    } else if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPWA]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  // Handle key press for Enter key sending message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Send message on Enter key without Shift (Shift+Enter for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        type: 'spring', 
        stiffness: 500, 
        damping: 25 
      } 
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleInputClick = (e: React.MouseEvent) => {
    if (isPWA) {
      e.preventDefault();
      forceFocus();
    }
  };

  return (
    <Box
      component={motion.div}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      sx={{ 
        position: isMobile ? 'fixed' : 'sticky',
        bottom: 0,
        left: isMobile ? 0 : 'auto',
        right: isMobile ? 0 : 'auto',
        width: '100%',
        pb: { xs: 0, sm: 2 },
        pt: 1,
        background: 'transparent',
        zIndex: 1300,
        // Add PWA-specific positioning
        ...(isPWA && isMobile && {
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
        })
      }}
    >
      <Box
        ref={containerRef}
        component="form"
        onSubmit={handleSubmit}
        onClick={handleInputClick}
        sx={{
          display: 'flex',
          width: '100%',
          position: 'relative',
          ...(isMobile && {
            px: 1,
            py: 1.5,
            pb: 2,
            bgcolor: 'background.paper',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            boxShadow: '0px -2px 5px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid',
            borderColor: 'divider',
            // Add PWA-specific styles
            ...(isPWA && {
              position: 'relative',
              zIndex: 1301,
            })
          })
        }}
      >
        <TextField
          fullWidth
          multiline
          minRows={1}
          maxRows={isMobile ? 4 : 5}
          placeholder="Message your AI..."
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
          inputRef={inputRef}
          inputProps={{
            inputMode: 'text',
            enterKeyHint: 'send',
            autoComplete: 'off',
            autoCapitalize: 'sentences',
            autoCorrect: 'on',
            spellCheck: 'true',
            // PWA-specific click handling
            onClick: (e) => {
              if (isPWA) {
                e.preventDefault();
                forceFocus();
              }
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: isMobile ? '20px' : '12px',
              backgroundColor: 'background.paper',
              pr: '48px',
              mx: isMobile ? 1.5 : 0,
              height: isMobile ? 'auto' : 'auto',
              minHeight: isMobile ? '44px' : 'auto',
              maxHeight: isMobile ? '120px' : '200px',
              overflowY: 'auto',
              // Add iOS PWA specific styles
              WebkitUserSelect: 'text',
              WebkitTouchCallout: 'none',
              '& textarea': {
                py: isMobile ? 0.75 : 2,
                px: isMobile ? 1.5 : 2,
                lineHeight: isMobile ? 1.2 : 1.5,
                minHeight: isMobile ? '24px !important' : 'auto',
                // iOS PWA specific styles
                cursor: 'text !important',
                WebkitUserSelect: 'text !important',
                userSelect: 'text !important',
                // Keep existing styles
                scrollbarWidth: 'thin',
                scrollbarColor: '#444654 transparent',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  position: 'absolute',
                  right: 0,
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                  border: 'none',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#444654',
                  borderRadius: '10px',
                  border: '2px solid transparent',
                  backgroundClip: 'content-box',
                  '&:hover': {
                    background: '#545567',
                  },
                },
              },
              '& fieldset': {
                borderColor: isMobile ? 'transparent' : 'divider',
                borderWidth: isMobile ? '0 !important' : '1px',
              },
              '&:hover fieldset': {
                borderColor: isMobile ? 'transparent' : 'grey.400',
              },
              '&.Mui-focused fieldset': {
                borderColor: isMobile ? 'transparent' : 'primary.main',
              },
            },
          }}
        />
        
        <IconButton 
          type="submit"
          disabled={!message.trim() || isLoading}
          sx={{
            position: 'absolute',
            right: isMobile ? '16px' : '8px',
            bottom: isMobile ? '28px' : '8px',
            transform: 'none',
            width: 32,
            height: 32,
            bgcolor: message.trim() ? '#fff' : 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            '&:hover': {
              bgcolor: message.trim() ? '#fff' : 'rgba(255, 255, 255, 0.1)',
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            },
            transition: 'background-color 0.2s ease',
          }}
        >
          {isLoading ? (
            <CircularProgress size={16} />
          ) : (
            <Box
              component="svg"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              sx={{
                width: 16,
                height: 16,
                fill: 'none',
                stroke: message.trim() ? '#000' : 'rgba(255, 255, 255, 0.3)',
                strokeWidth: 2,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                transition: 'stroke 0.2s ease',
              }}
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </Box>
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatInput; 