import React from 'react';
import { Box, Select, MenuItem, FormControl, InputLabel, FormHelperText, SelectChangeEvent, Typography, Tooltip, Chip, useTheme, Alert, Button } from '@mui/material';
import { ALL_MODELS, GEMINI_MODELS, OPENAI_MODELS, XAI_MODELS, DEEPSEEK_MODELS, ModelProvider } from '../types/chat';
import useApiKeys from '../hooks/useApiKeys';
import KeyIcon from '@mui/icons-material/Key';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  selectedProvider: ModelProvider;
  onProviderChange: (provider: ModelProvider) => void;
  onOpenApiKeyDialog: () => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  selectedModel, 
  onModelChange, 
  selectedProvider,
  onProviderChange,
  onOpenApiKeyDialog
}) => {
  const theme = useTheme();
  const { checkApiKeyAvailability } = useApiKeys();
  
  // Subscribe to API key changes
  const [, forceUpdate] = React.useState({});
  React.useEffect(() => {
    const handleApiKeyChange = () => forceUpdate({});
    window.addEventListener('api-keys-updated', handleApiKeyChange);
    return () => window.removeEventListener('api-keys-updated', handleApiKeyChange);
  }, []);

  const handleModelChange = (event: SelectChangeEvent) => {
    onModelChange(event.target.value);
  };

  const handleProviderChange = (event: SelectChangeEvent) => {
    onProviderChange(event.target.value as ModelProvider);
  };
  
  // Get appropriate models based on the provider
  const getModelsForProvider = (provider: ModelProvider) => {
    switch(provider) {
      case 'google':
        return GEMINI_MODELS;
      case 'openai':
        return OPENAI_MODELS;
      case 'xai':
        return XAI_MODELS;
      case 'deepseek':
        return DEEPSEEK_MODELS;
      default:
        return [];
    }
  };
  
  const availableModels = getModelsForProvider(selectedProvider);
  
  // Make sure we have a valid model selected for this provider
  React.useEffect(() => {
    const modelExists = availableModels.some(model => model.id === selectedModel);
    if (!modelExists && availableModels.length > 0) {
      // Select the first available model for this provider
      onModelChange(availableModels[0].id);
    }
  }, [selectedProvider, selectedModel, availableModels, onModelChange]);

  // Get provider display name
  const getProviderDisplayName = (provider: ModelProvider): string => {
    switch(provider) {
      case 'google':
        return 'Google AI';
      case 'openai':
        return 'OpenAI';
      case 'xai':
        return 'xAI';
      case 'deepseek':
        return 'DeepSeek';
      default:
        return provider;
    }
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Provider Selector */}
      <FormControl size="small">
        <InputLabel id="provider-select-label">Provider</InputLabel>
        <Select
          labelId="provider-select-label"
          id="provider-select"
          value={selectedProvider}
          label="Provider"
          onChange={handleProviderChange}
          sx={{ 
            bgcolor: 'background.default',
            minWidth: 200,
            '& .MuiSelect-select': { 
              py: 1.2
            } 
          }}
        >
          {(['google', 'openai', 'xai', 'deepseek'] as ModelProvider[]).map((provider) => (
            <MenuItem key={provider} value={provider}>
              {getProviderDisplayName(provider)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Model Selector */}
      <FormControl size="small">
        <InputLabel id="model-select-label">Model</InputLabel>
        <Select
          labelId="model-select-label"
          id="model-select"
          value={selectedModel}
          label="Model"
          onChange={handleModelChange}
          sx={{ 
            bgcolor: 'background.default',
            '& .MuiSelect-select': { 
              display: 'flex', 
              alignItems: 'center',
              py: 1.2
            } 
          }}
          renderValue={(selected) => {
            const model = availableModels.find(m => m.id === selected);
            return model ? model.name : selected;
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: 400,
                overflowY: 'auto',
              },
            },
          }}
        >
          {availableModels.map((model) => (
            <MenuItem 
              key={model.id} 
              value={model.id}
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start',
                py: 1,
                px: 2
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 'medium',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  {model.name}
                  <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                    {model.capabilities.map(capability => (
                      <Tooltip key={capability} title={`Supports ${capability}`}>
                        <Chip 
                          label={capability} 
                          size="small" 
                          sx={{ 
                            height: 20, 
                            '& .MuiChip-label': { 
                              px: 1, 
                              fontSize: '0.65rem',
                              fontWeight: 'bold'
                            }
                          }} 
                          variant="outlined"
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {!checkApiKeyAvailability(selectedProvider) && (
        <Alert 
          severity="warning" 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            '& .MuiAlert-icon': {
              mt: 0
            }
          }}
          action={
            <Button
              size="small"
              onClick={onOpenApiKeyDialog}
              sx={{ textTransform: 'none' }}
            >
              Set API Key
            </Button>
          }
        >
          API key not set for {getProviderDisplayName(selectedProvider)}
        </Alert>
      )}
    </Box>
  );
};

export default ModelSelector; 