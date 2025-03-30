import React, { useState, useRef, useEffect } from 'react';
import { 
  Paper, 
  IconButton, 
  InputBase, 
  Box, 
  useTheme, 
  CircularProgress,
  Tooltip,
  Badge,
  TextField
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import { motion } from 'framer-motion';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  isLoading: boolean;
  disabled?: boolean;
  initialMessage?: string;
  isEditing?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onClearChat, 
  isLoading, 
  disabled = false,
  initialMessage = '',
  isEditing = false
}) => {
  const [message, setMessage] = useState(initialMessage);
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  // Update message state when initialMessage prop changes
  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
      
      // Focus the input when we're editing a message
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [initialMessage]);

  useEffect(() => {
    // Focus input on component mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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

  return (
    <Box
      component={motion.div}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      sx={{ 
        position: 'sticky', 
        bottom: 0, 
        width: '100%',
        pb: 2,
        pt: 1,
        '&::before': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '160px',
          background: (theme) => `linear-gradient(to top, ${theme.palette.background.default}, transparent)`,
          pointerEvents: 'none',
        },
        zIndex: 2
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          width: '100%',
          position: 'relative',
        }}
      >
        <TextField
          fullWidth
          multiline
          minRows={3}
          maxRows={5}
          placeholder="Message your AI..."
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: 'background.paper',
              pr: '48px',
              '& fieldset': {
                borderColor: 'divider',
              },
              '&:hover fieldset': {
                borderColor: 'grey.400',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
              '& textarea': {
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '2px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                },
              },
            },
          }}
        />
        
        <IconButton 
          type="submit"
          disabled={!message.trim() || isLoading}
          sx={{
            position: 'absolute',
            right: '8px',
            bottom: '8px',
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