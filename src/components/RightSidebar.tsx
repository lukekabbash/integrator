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

export interface SystemPrompt {
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

export const DEFAULT_SYSTEM_PROMPTS: SystemPrompt[] = [
  {
    name: "Default Assistant",
    prompt: "You are a helpful, accurate, and friendly AI assistant. You provide detailed and thoughtful responses while being accurate and unbiased."
  },
  {
    name: "Code Expert",
    prompt: "You are an expert programmer with deep knowledge of software development best practices, design patterns, and modern frameworks. Provide clean, efficient code examples with explanations. Consider edge cases and performance optimizations in your solutions."
  },
  {
    name: "Creative Writer",
    prompt: "You are a creative writing assistant skilled in storytelling, character development, and engaging narrative techniques. Help craft vivid descriptions, compelling dialogue, and emotionally resonant stories across different genres and styles."
  },
  {
    name: "Technical Explainer",
    prompt: "You are a technical educator who excels at breaking down complex concepts into simple, understandable explanations. Use analogies, step-by-step reasoning, and visual descriptions to make difficult topics accessible to beginners while remaining technically accurate."
  },
  {
    name: "Business Consultant",
    prompt: "You are a strategic business consultant with expertise in market analysis, operational efficiency, and growth strategies. Provide actionable insights based on industry best practices, with practical recommendations that consider resource constraints and implementation challenges."
  },
  {
    name: "Academic Research",
    prompt: "You are a scholarly research assistant with knowledge across multiple academic disciplines. Provide well-structured, evidence-based responses with appropriate citations. Maintain academic rigor while explaining concepts clearly and highlighting different perspectives on complex topics."
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
  
  // Find the current prompt in systemPrompts when component mounts or when systemPrompt changes
  useEffect(() => {
    const findPromptIndex = () => {
      const index = systemPrompts.findIndex(p => p.prompt === systemPrompt);
      if (index !== -1) {
        setSelectedPromptIndex(index);
      } else if (systemPrompts.length > 0 && systemPrompt) {
        // If we can't find the exact match but have a systemPrompt, create a custom entry
        const customPrompt = {
          name: "Custom Prompt",
          prompt: systemPrompt
        };
        
        if (onSystemPromptsChange) {
          const newPrompts = [...systemPrompts, customPrompt];
          onSystemPromptsChange(newPrompts);
          setSelectedPromptIndex(newPrompts.length - 1);
        }
      }
    };
    
    findPromptIndex();
  }, [systemPrompts, systemPrompt, onSystemPromptsChange]);
  
  useEffect(() => {
    setShowSystemPromptWarning(!supportsSystemPrompt(modelName, provider));
  }, [modelName, provider]);

  const handleEditPrompt = (index: number) => {
    setSelectedPromptIndex(index);
    setEditingPrompt({...systemPrompts[index]});
    setIsNewPrompt(false);
    setEditModalOpen(true);
  };

  const handleAddNewPrompt = () => {
    setEditingPrompt({ name: '', prompt: '' });
    setIsNewPrompt(true);
    setEditModalOpen(true);
  };

  const handleDeletePrompt = (index: number) => {
    if (!onSystemPromptsChange) return;
    
    const newPrompts = systemPrompts.filter((_, i) => i !== index);
    onSystemPromptsChange(newPrompts);
    
    // If we deleted the selected prompt, select the first one
    if (index === selectedPromptIndex) {
      setSelectedPromptIndex(0);
      if (newPrompts.length > 0) {
        onSystemPromptChange(newPrompts[0]?.prompt || '');
      }
    } else if (index < selectedPromptIndex) {
      // Adjust the selected index if we deleted a prompt before it
      setSelectedPromptIndex(selectedPromptIndex - 1);
    }
  };

  const handleSavePrompt = () => {
    if (!editingPrompt || !onSystemPromptsChange) return;
    
    let newPrompts: SystemPrompt[];
    
    if (isNewPrompt) {
      newPrompts = [...systemPrompts, editingPrompt];
      setSelectedPromptIndex(newPrompts.length - 1);
    } else {
      newPrompts = [...systemPrompts];
      newPrompts[selectedPromptIndex] = editingPrompt;
    }
    
    onSystemPromptsChange(newPrompts);
    onSystemPromptChange(editingPrompt.prompt);
    setEditModalOpen(false);
  };

  const getTemperatureLabel = (value: number) => {
    if (value <= 0.3) return 'More precise';
    if (value >= 0.7) return 'More creative';
    return 'Balanced';
  };

  // System Prompt Edit Dialog
  const renderEditDialog = () => (
    <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isNewPrompt ? 'Add New System Prompt' : 'Edit System Prompt'}
      </DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          fullWidth
          margin="normal"
          value={editingPrompt?.name || ''}
          onChange={(e) => setEditingPrompt(prev => prev ? {...prev, name: e.target.value} : null)}
        />
        <TextField
          label="Prompt"
          fullWidth
          margin="normal"
          multiline
          rows={6}
          value={editingPrompt?.prompt || ''}
          onChange={(e) => setEditingPrompt(prev => prev ? {...prev, prompt: e.target.value} : null)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
        <Button 
          onClick={handleSavePrompt}
          disabled={!editingPrompt?.name || !editingPrompt?.prompt}
          variant="contained"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box
      sx={{
        width: { xs: '100%', sm: '320px' },
        height: '100%',
        borderLeft: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#444654',
            borderRadius: '10px',
            border: '2px solid transparent',
            backgroundClip: 'content-box',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#545567',
          },
        }}
      >
        <Box sx={{ 
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
              onOpenApiKeyDialog={() => setIsApiKeyDialogOpen(true)}
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
                disabled={showSystemPromptWarning}
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
                disabled={showSystemPromptWarning || systemPrompts.length === 0}
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
            {systemPrompts.length > 0 && (
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
            )}
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
            <Box>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>Temperature</span>
                <span>{temperature}</span>
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
            </Box>
          </Box>
        </Box>
      </Box>

      {/* API Key section at bottom */}
      <Box sx={{ 
        borderTop: 1, 
        borderColor: 'divider',
        p: 2,
        mt: 'auto'
      }}>
        <Button
          fullWidth
          startIcon={<KeyIcon />}
          onClick={() => setIsApiKeyDialogOpen(true)}
          sx={{
            justifyContent: 'flex-start',
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)'
            }
          }}
        >
          Edit API Keys
        </Button>
      </Box>

      {renderEditDialog()}

      <ApiKeyManager
        open={isApiKeyDialogOpen}
        onClose={() => setIsApiKeyDialogOpen(false)}
      />
    </Box>
  );
};

export default RightSidebar; 