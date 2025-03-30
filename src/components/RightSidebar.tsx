import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Button,
  FormHelperText,
  useTheme,
  useMediaQuery,
  Alert,
  Tooltip,
} from '@mui/material';
import { ModelProvider } from '../types/chat';
import { supportsSystemPrompt } from '../utils/modelUtils';
import ModelSelector from './ModelSelector';

interface RightSidebarProps {
  modelName: string;
  provider: ModelProvider;
  systemPrompt: string;
  onModelChange: (modelId: string) => void;
  onSystemPromptChange: (prompt: string) => void;
  onProviderChange?: (provider: ModelProvider) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  modelName,
  provider,
  systemPrompt,
  onModelChange,
  onSystemPromptChange,
  onProviderChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [localSystemPrompt, setLocalSystemPrompt] = useState<string>(systemPrompt);
  const [showSystemPromptWarning, setShowSystemPromptWarning] = useState<boolean>(!supportsSystemPrompt(modelName));
  
  useEffect(() => {
    setShowSystemPromptWarning(!supportsSystemPrompt(modelName));
  }, [modelName]);

  const handleSystemPromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalSystemPrompt(event.target.value);
  };

  const handleSystemPromptSave = () => {
    onSystemPromptChange(localSystemPrompt);
  };

  return (
    <Box 
      sx={{ 
        height: '100%',
        width: isMobile ? '100%' : '300px',
        bgcolor: 'background.paper',
        borderLeft: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}
    >
      <Box sx={{ 
        p: isMobile ? 1.5 : 3, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: isMobile ? 2 : 3 
      }}>
        <Box>
          <Typography 
            variant={isMobile ? "subtitle2" : "subtitle1"}
            sx={{ fontWeight: 'medium', mb: 1 }}
          >
            Model Selection
          </Typography>
          <ModelSelector 
            selectedModel={modelName}
            onModelChange={onModelChange}
            selectedProvider={provider}
            onProviderChange={onProviderChange || (() => {})}
          />
        </Box>

        {/* System Prompt Section */}
        <Box>
          <Typography 
            variant={isMobile ? "subtitle2" : "subtitle1"}
            sx={{ 
              fontWeight: 'medium', 
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            System Prompt
            {showSystemPromptWarning && (
              <Tooltip title="This model does not support system prompts">
                <Alert 
                  severity="warning" 
                  sx={{ 
                    mt: 1,
                    py: isMobile ? 0.5 : 1,
                    '& .MuiAlert-message': {
                      fontSize: isMobile ? '0.75rem' : '0.875rem'
                    }
                  }}
                >
                  This model does not support system prompts
                </Alert>
              </Tooltip>
            )}
          </Typography>
          <TextField
            multiline
            rows={isMobile ? 3 : 4}
            value={localSystemPrompt}
            onChange={handleSystemPromptChange}
            placeholder="Enter system instructions..."
            fullWidth
            size={isMobile ? "small" : "medium"}
            sx={{ 
              bgcolor: 'background.default',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'divider',
                },
                fontSize: isMobile ? '0.875rem' : '1rem',
              },
            }}
          />
          <Button 
            onClick={handleSystemPromptSave}
            variant="contained" 
            size={isMobile ? "small" : "medium"}
            sx={{ mt: 1 }}
            disabled={showSystemPromptWarning}
          >
            Save Instructions
          </Button>
        </Box>

        {/* Parameters Section */}
        <Box>
          <Typography 
            variant={isMobile ? "subtitle2" : "subtitle1"}
            sx={{ fontWeight: 'medium', mb: 1 }}
          >
            Parameters
          </Typography>
          <FormControl 
            fullWidth 
            size={isMobile ? "small" : "medium"} 
            sx={{ mb: 2 }}
          >
            <InputLabel id="temperature-label">Temperature</InputLabel>
            <Select
              labelId="temperature-label"
              id="temperature-select"
              value="0.5"
              label="Temperature"
              sx={{ 
                bgcolor: 'background.default',
                fontSize: isMobile ? '0.875rem' : '1rem',
              }}
            >
              <MenuItem value="0.1">0.1 - More precise</MenuItem>
              <MenuItem value="0.3">0.3</MenuItem>
              <MenuItem value="0.5">0.5 - Balanced</MenuItem>
              <MenuItem value="0.7">0.7</MenuItem>
              <MenuItem value="1.0">1.0 - More creative</MenuItem>
            </Select>
            <FormHelperText sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
              Controls randomness of responses
            </FormHelperText>
          </FormControl>
          
          <FormControl 
            fullWidth 
            size={isMobile ? "small" : "medium"}
          >
            <InputLabel id="max-length-label">Max Output Tokens</InputLabel>
            <Select
              labelId="max-length-label"
              id="max-length-select"
              value="2048"
              label="Max Output Tokens"
              sx={{ 
                bgcolor: 'background.default',
                fontSize: isMobile ? '0.875rem' : '1rem',
              }}
            >
              <MenuItem value="512">512</MenuItem>
              <MenuItem value="1024">1024</MenuItem>
              <MenuItem value="2048">2048</MenuItem>
              <MenuItem value="4096">4096</MenuItem>
              <MenuItem value="8192">8192</MenuItem>
            </Select>
            <FormHelperText sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
              Limits length of AI responses
            </FormHelperText>
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
};

export default RightSidebar; 