import { ModelProvider } from '../types/chat';

// Check if the selected model supports system prompts
export const supportsSystemPrompt = (modelName: string, provider: ModelProvider): boolean => {
  // Models that don't support system prompts
  const nonSupportedModels: string[] = [
    // Gemini models that don't support system instructions
    'gemini-1.5-flash-8b'
  ];
  
  // Provider-specific checks
  if (provider === 'google') {
    return !nonSupportedModels.includes(modelName);
  }
  
  // OpenAI, DeepSeek, and xAI models all support system prompts
  if (['openai', 'deepseek', 'xai'].includes(provider)) {
    return true;
  }
  
  // Default to not supporting system prompts for unknown providers
  return false;
};

// Get the base model name without version suffixes
export const getBaseModelName = (modelName: string): string => {
  if (modelName.startsWith('grok-')) {
    return modelName.replace('-latest', '');
  }
  return modelName;
};

// Get provider for a given model
export const getProviderForModel = (modelName: string): ModelProvider => {
  if (modelName.startsWith('grok-')) {
    return 'xai';
  } else if (modelName.startsWith('deepseek-')) {
    return 'deepseek';
  }
  return 'openai';
};

// Get model-specific configuration
export const getModelConfig = (modelName: string) => {
  const baseConfig = {
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 4096,
  };

  // Model-specific adjustments
  if (modelName.startsWith('grok-')) {
    return {
      ...baseConfig,
      temperature: 0.8, // Grok models work better with slightly higher temperature
    };
  } else if (modelName === 'deepseek-reasoner') {
    return {
      ...baseConfig,
      temperature: 0.5, // Lower temperature for more focused reasoning
    };
  }

  return baseConfig;
};

// Check if a model supports streaming
export const supportsStreaming = (modelName: string): boolean => {
  // Currently all our models support streaming
  return true;
};

// Get maximum context length for a model
export const getMaxContextLength = (modelName: string): number => {
  if (modelName.startsWith('grok-')) {
    return 8192;
  } else if (modelName.startsWith('deepseek-')) {
    return 4096;
  }
  return 4096; // Default for other models
}; 