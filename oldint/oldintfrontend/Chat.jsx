import React from 'react';
import { Box, TextField, Button, Paper } from '@mui/material';
import { useAI } from '../contexts/AIContext';

const Chat = () => {
  const [message, setMessage] = React.useState('');
  const { sendMessage, messages, isLoading } = useAI();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {messages.map((msg, index) => (
          <Paper 
            key={index}
            sx={{ 
              p: 2, 
              mb: 2, 
              bgcolor: msg.role === 'user' ? 'primary.dark' : 'background.paper'
            }}
          >
            {msg.content}
          </Paper>
        ))}
      </Box>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          sx={{ mb: 2 }}
        />
        <Button 
          type="submit" 
          variant="contained" 
          disabled={isLoading || !message.trim()}
          fullWidth
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default Chat; 