import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Typography,
  Button,
  FormHelperText,
  useTheme,
  useMediaQuery,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Slider,
  Divider
} from '@mui/material';
import Edit from '@mui/icons-material/Edit';
import Add from '@mui/icons-material/Add';
import Delete from '@mui/icons-material/Delete';
import KeyIcon from '@mui/icons-material/Key';
import { ModelProvider } from '../types/chat';
import { supportsSystemPrompt } from '../utils/modelUtils';
import ModelSelector from './ModelSelector';
import ApiKeyManager from './ApiKeyManager';

interface SystemPrompt {
  name: string;
  prompt: string;
}

interface RightSidebarProps {
  modelName: string;
  provider: ModelProvider;
  systemPrompt: string;
  temperature: number;
  maxOutputTokens: number;
  onModelChange: (modelId: string) => void;
  onSystemPromptChange: (prompt: string) => void;
  onProviderChange?: (provider: ModelProvider) => void;
  onTemperatureChange: (value: number) => void;
  onMaxOutputTokensChange: (value: number) => void;
  systemPrompts?: SystemPrompt[];
  onSystemPromptsChange?: (prompts: SystemPrompt[]) => void;
}

const DEFAULT_SYSTEM_PROMPTS: SystemPrompt[] = [
  {
    name: "Default Assistant",
    prompt: "You are a helpful, accurate, and friendly AI assistant. You provide detailed and thoughtful responses while being accurate and unbiased."
  },
  {
    name: "Code Expert",
    prompt: "You are an expert programmer with deep knowledge of software development best practices, design patterns, and modern frameworks."
  },
  {
    name: "Creative Writer",
    prompt: "You are a creative writing assistant skilled in storytelling, character development, and engaging narrative techniques."
  }
];

const RightSidebar: React.FC<RightSidebarProps> = ({
  modelName,
  provider,
  systemPrompt,
  temperature,
  maxOutputTokens,
  onModelChange,
  onSystemPromptChange,
  onProviderChange,
  onTemperatureChange,
  onMaxOutputTokensChange,
  systemPrompts = DEFAULT_SYSTEM_PROMPTS,
  onSystemPromptsChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showSystemPromptWarning, setShowSystemPromptWarning] = useState<boolean>(!supportsSystemPrompt(modelName, provider));
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number>(0);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [isNewPrompt, setIsNewPrompt] = useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  
  useEffect(() => {
    setShowSystemPromptWarning(!supportsSystemPrompt(modelName, provider));
  }, [modelName, provider]);

  useEffect(() => {
    // Find and set the selected prompt index based on the current systemPrompt
    const index = systemPrompts.findIndex(p => p.prompt === systemPrompt);
    if (index !== -1) {
      setSelectedPromptIndex(index);
    }
  }, [systemPrompt, systemPrompts]);

  const handleEditPrompt = (index: number) => {
    setSelectedPromptIndex(index);
    setEditingPrompt(systemPrompts[index]);
    setIsNewPrompt(false);
    setEditModalOpen(true);
  };

  const handleAddNewPrompt = () => {
    setEditingPrompt({ name: '', prompt: '' });
    setIsNewPrompt(true);
    setEditModalOpen(true);
  };

  const handleDeletePrompt = (index: number) => {
    const newPrompts = systemPrompts.filter((_, i) => i !== index);
    onSystemPromptsChange?.(newPrompts);
    if (index === selectedPromptIndex) {
      // If we deleted the selected prompt, select the first one
      setSelectedPromptIndex(0);
      onSystemPromptChange(newPrompts[0]?.prompt || '');
    }
  };

  const handleSavePrompt = () => {
    if (editingPrompt) {
      let newPrompts: SystemPrompt[];
      if (isNewPrompt) {
        newPrompts = [...systemPrompts, editingPrompt];
        setSelectedPromptIndex(newPrompts.length - 1);
      } else {
        newPrompts = [...systemPrompts];
        newPrompts[selectedPromptIndex] = editingPrompt;
      }
      onSystemPromptsChange?.(newPrompts);
      onSystemPromptChange(editingPrompt.prompt);
    }
    setEditModalOpen(false);
  };

  const getTemperatureLabel = (value: number) => {
    if (value <= 0.3) return 'More precise';
    if (value >= 0.7) return 'More creative';
    return 'Balanced';
  };

  return (
    <>
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
          gap: isMobile ? 3 : 4 
        }}>
          <Box>
            <Typography 
              variant={isMobile ? "subtitle2" : "subtitle1"}
              sx={{ fontWeight: 'medium', mb: 2 }}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography 
                variant={isMobile ? "subtitle2" : "subtitle1"}
                sx={{ fontWeight: 'medium' }}
              >
                System Prompt
              </Typography>
              <IconButton
                size="small"
                onClick={handleAddNewPrompt}
                sx={{ ml: 1 }}
              >
                <Add fontSize="small" />
              </IconButton>
            </Box>

            {showSystemPromptWarning && (
              <Alert severity="info" sx={{ mb: 2 }}>
                This model doesn't support system prompts
              </Alert>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <Select
                value={selectedPromptIndex}
                onChange={(e) => {
                  const index = e.target.value as number;
                  setSelectedPromptIndex(index);
                  onSystemPromptChange(systemPrompts[index].prompt);
                }}
                size={isMobile ? "small" : "medium"}
                disabled={showSystemPromptWarning}
              >
                {systemPrompts.map((prompt, index) => (
                  <MenuItem 
                    key={index} 
                    value={index}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pr: 1
                    }}
                  >
                    <span>{prompt.name}</span>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Display selected prompt with actions */}
            <Box sx={{ 
              bgcolor: 'background.default',
              p: 1.5,
              borderRadius: 1,
              position: 'relative'
            }}>
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  color: 'text.secondary',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {systemPrompts[selectedPromptIndex]?.prompt || ''}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                justifyContent: 'flex-end',
                borderTop: 1,
                borderColor: 'divider',
                pt: 1
              }}>
                <IconButton
                  size="small"
                  onClick={() => handleEditPrompt(selectedPromptIndex)}
                  disabled={showSystemPromptWarning}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDeletePrompt(selectedPromptIndex)}
                  disabled={showSystemPromptWarning || systemPrompts.length <= 1}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* Parameters Section */}
          <Box>
            <Typography 
              variant={isMobile ? "subtitle2" : "subtitle1"}
              sx={{ fontWeight: 'medium', mb: 1 }}
            >
              Parameters
            </Typography>
            
            {/* Temperature Slider */}
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>Temperature</span>
                <span>{getTemperatureLabel(temperature)}</span>
              </Typography>
              <Slider
                value={temperature}
                onChange={(_, value) => onTemperatureChange(value as number)}
                min={0.1}
                max={1.0}
                step={0.1}
                marks={[
                  { value: 0.1, label: '0.1' },
                  { value: 0.5, label: '0.5' },
                  { value: 1.0, label: '1.0' }
                ]}
                sx={{ 
                  '& .MuiSlider-markLabel': {
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }
                }}
              />
              <FormHelperText sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem', mt: 1 }}>
                Controls randomness of responses
              </FormHelperText>
            </Box>
            
            {/* Max Output Tokens Slider */}
            <Box>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>Max Output Tokens</span>
                <span>{maxOutputTokens}</span>
              </Typography>
              <Slider
                value={maxOutputTokens}
                onChange={(_, value) => onMaxOutputTokensChange(value as number)}
                min={512}
                max={8192}
                step={512}
                marks={[
                  { value: 512, label: '512' },
                  { value: 2048, label: '2K' },
                  { value: 4096, label: '4K' },
                  { value: 8192, label: '8K' }
                ]}
                sx={{ 
                  '& .MuiSlider-markLabel': {
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }
                }}
              />
              <FormHelperText sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem', mt: 1 }}>
                Limits length of AI responses
              </FormHelperText>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* API Key Management */}
          <Box>
            <Button
              variant="text"
              startIcon={<KeyIcon />}
              onClick={() => setIsApiKeyDialogOpen(true)}
              fullWidth
              size={isMobile ? "small" : "medium"}
              sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                color: 'text.secondary',
                py: 1
              }}
            >
              Enter API Keys
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Edit/Add Prompt Modal */}
      <Dialog 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{isNewPrompt ? 'Add System Prompt' : 'Edit System Prompt'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={editingPrompt?.name || ''}
              onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, name: e.target.value } : null)}
              size={isMobile ? "small" : "medium"}
            />
            <TextField
              label="Prompt"
              fullWidth
              multiline
              rows={4}
              value={editingPrompt?.prompt || ''}
              onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, prompt: e.target.value } : null)}
              size={isMobile ? "small" : "medium"}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSavePrompt} 
            variant="contained"
            disabled={!editingPrompt?.name || !editingPrompt?.prompt}
          >
            {isNewPrompt ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* API Key Manager Dialog */}
      <ApiKeyManager
        open={isApiKeyDialogOpen}
        onClose={() => setIsApiKeyDialogOpen(false)}
      />
    </>
  );
};

export default RightSidebar; 