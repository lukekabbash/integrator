import React, { useState } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Slider,
  styled,
  Divider,
} from '@mui/material';

const SidebarContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
  gap: theme.spacing(2),
}));

const Section = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const SettingsSidebar = () => {
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o');
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState('');

  const providers = {
    openai: [
      'gpt-4o',
      'gpt-4o-mini',
      'o1-mini',
      'o3-mini'
    ],
    google: [
      'gemini-2.0-pro-exp-02-05',
      'gemini-2.0-flash-thinking-exp-01-21',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ],
    anthropic: [
      'claude-3-5-sonnet-latest'
    ],
    xai: [
      'grok-2-latest'
    ],
    perplexity: [
      'sonar',
      'sonar-pro',
      'sonar-reasoning-pro'
    ],
    deepseek: [
      'deepseek-chat',
      'deepseek-reasoner'
    ]
  };

  // When provider changes, set the first model of that provider as default
  React.useEffect(() => {
    if (providers[provider]?.length > 0) {
      setModel(providers[provider][0]);
    }
  }, [provider]);

  return (
    <SidebarContainer>
      <Typography variant="h6">Settings</Typography>
      <Divider />

      <Section>
        <FormControl fullWidth>
          <InputLabel>Provider</InputLabel>
          <Select
            value={provider}
            label="Provider"
            onChange={(e) => setProvider(e.target.value)}
          >
            {Object.keys(providers).map((p) => (
              <MenuItem key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Section>

      <Section>
        <FormControl fullWidth>
          <InputLabel>Model</InputLabel>
          <Select
            value={model}
            label="Model"
            onChange={(e) => setModel(e.target.value)}
          >
            {providers[provider].map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Section>

      <Section>
        <Typography gutterBottom>Temperature: {temperature}</Typography>
        <Slider
          value={temperature}
          onChange={(e, value) => setTemperature(value)}
          min={0}
          max={1}
          step={0.1}
        />
      </Section>

      <Section>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="System Prompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
        />
      </Section>
    </SidebarContainer>
  );
};

export default SettingsSidebar; 