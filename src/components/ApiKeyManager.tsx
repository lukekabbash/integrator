import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { ModelProvider } from '../types/chat';
import { useApiKeys } from '../hooks/useApiKeys';

interface ApiKeyManagerProps {
  open: boolean;
  onClose: () => void;
}

const providerLabels: Record<ModelProvider, string> = {
  google: 'Google AI API Key',
  openai: 'OpenAI API Key',
  xai: 'xAI API Key',
  deepseek: 'DeepSeek API Key'
};

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { apiKeys, updateApiKeys } = useApiKeys();
  const [localApiKeys, setLocalApiKeys] = useState<typeof apiKeys>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Update local state when dialog opens
  React.useEffect(() => {
    if (open) {
      setLocalApiKeys(apiKeys);
    }
  }, [open, apiKeys]);

  const handleSave = () => {
    updateApiKeys(localApiKeys);
    onClose();
  };

  const handleKeyChange = (provider: ModelProvider) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalApiKeys(prev => ({
      ...prev,
      [provider]: event.target.value
    }));
  };

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>API Key Management</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Enter your API keys for each provider. Keys are stored securely in your browser's local storage.
          </Typography>
          
          {(Object.keys(providerLabels) as ModelProvider[]).map((provider) => (
            <TextField
              key={provider}
              label={providerLabels[provider]}
              fullWidth
              size={isMobile ? "small" : "medium"}
              type={showKeys[provider] ? 'text' : 'password'}
              value={localApiKeys[provider] || ''}
              onChange={handleKeyChange(provider)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle key visibility"
                      onClick={() => toggleKeyVisibility(provider)}
                      edge="end"
                    >
                      {showKeys[provider] ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        px: 3, 
        pb: 3, 
        display: 'flex', 
        justifyContent: 'space-between' 
      }}>
        <Button 
          onClick={onClose}
          sx={{ 
            bgcolor: 'error.dark',
            color: 'white',
            '&:hover': {
              bgcolor: '#a30000', // darker red
              color: 'white',
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          sx={{
            bgcolor: 'white',
            color: 'black',
            boxShadow: '0 0 2px rgba(255, 255, 255, 0.2)',
            '&:hover': {
              bgcolor: 'white',
              boxShadow: '0 0 5px rgba(255, 255, 255, 0.3)',
            }
          }}
        >
          Save Keys
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApiKeyManager; 