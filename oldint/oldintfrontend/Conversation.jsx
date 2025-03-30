import React from 'react';
import { Box, TextField, Button, Paper } from '@mui/material';
import { useAI } from '../contexts/AIContext';

const Conversation = () => {
  const [message, setMessage] = React.useState('');
  const { sendMessage, messages, isLoading } = useAI();

  // ... rest of the code ...
};

export default Conversation; 