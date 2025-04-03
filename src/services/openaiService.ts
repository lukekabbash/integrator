import OpenAI from 'openai';
import { Message } from '../types/chat';
import { getBaseModelName, getModelConfig } from '../utils/modelUtils';
import { getStoredApiKey } from '../hooks/useApiKeys';

// Initialize the OpenAI client with provider-specific configuration
const getOpenAIClient = (modelName: string) => {
  // Configure base URL and API key based on model provider
  if (modelName.startsWith('grok-')) {
    const apiKey = getStoredApiKey('xai');
    if (!apiKey) throw new Error('xAI API key not found');
    
    return new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.x.ai/v1",
      dangerouslyAllowBrowser: true
    });
  } else if (modelName.startsWith('deepseek-')) {
    const apiKey = getStoredApiKey('deepseek');
    if (!apiKey) throw new Error('DeepSeek API key not found');
    
    return new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.deepseek.com/v1",
      dangerouslyAllowBrowser: true
    });
  }

  // Default OpenAI configuration
  const apiKey = getStoredApiKey('openai');
  if (!apiKey) throw new Error('OpenAI API key not found');
  
  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });
};

// Default model name
const DEFAULT_MODEL = 'gpt-4o-latest';

// Helper function to format messages for OpenAI API
const formatMessagesForOpenAI = (messages: Message[], systemPrompt?: string): Array<OpenAI.ChatCompletionMessageParam> => {
  const openAIMessages: Array<OpenAI.ChatCompletionMessageParam> = [];
  
  // Add system message if provided
  if (systemPrompt && systemPrompt.trim() !== '') {
    openAIMessages.push({
      role: 'system',
      content: systemPrompt
    });
  }
  
  // Add user and assistant messages
  messages.forEach(message => {
    openAIMessages.push({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: message.content
    });
  });
  
  return openAIMessages;
};

// Generate streaming response from OpenAI
export const generateOpenAIStreamingResponse = async (
  messages: Message[],
  onChunk: (chunk: string) => void,
  modelName: string,
  systemPrompt?: string,
  options?: {
    temperature?: number;
    max_tokens?: number;
  }
) => {
  try {
    const { temperature = 0.7, max_tokens = 2048 } = options || {};
    
    // Convert messages to OpenAI format with proper typing
    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    // Add system prompt if provided and not empty
    if (systemPrompt && systemPrompt.trim()) {
      // For models that don't support system messages, prepend to first user message
      if (modelName.includes('grok') || modelName.includes('xai')) {
        const firstUserMessage = openaiMessages.find(msg => msg.role === 'user');
        if (firstUserMessage) {
          firstUserMessage.content = `[System: ${systemPrompt}]\n\nUser: ${firstUserMessage.content}`;
        }
      } else {
        // For models that support system messages, add as system message
        openaiMessages.unshift({
          role: 'system',
          content: systemPrompt,
        });
      }
    }

    console.log(`Sending request to ${modelName} with system prompt: ${systemPrompt ? 'Yes' : 'No'}`);
    
    // Make API request with streaming
    const response = await getOpenAIClient(modelName).chat.completions.create({
      model: modelName,
      messages: openaiMessages,
      temperature,
      max_tokens,
      stream: true,
    });

    let fullResponse = '';
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        onChunk(content);
      }
    }

    return fullResponse;
  } catch (error) {
    console.error('Error in OpenAI streaming response:', error);
    throw error;
  }
};

// Check if OpenAI model is available
export const checkOpenAIModelAvailability = async (modelName: string): Promise<{available: boolean, supportsStreaming: boolean}> => {
  try {
    // For Grok models, remove the '-latest' suffix
    const actualModelName = modelName.startsWith('grok-') ? modelName.replace('-latest', '') : modelName;
    
    // Simple request to check if the model is available
    await getOpenAIClient(modelName).chat.completions.create({
      model: actualModelName,
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    });
    
    // All OpenAI chat models support streaming
    return { available: true, supportsStreaming: true };
  } catch (error) {
    console.error(`OpenAI model ${modelName} not available:`, error);
    return { available: false, supportsStreaming: false };
  }
};

// Get a list of available OpenAI models
export const getOpenAIModels = () => {
  return [
    {
      id: 'gpt-4o-latest',
      name: 'GPT-4o (Latest)',
      description: 'Most capable multimodal model, optimized for chat and image understanding',
      capabilities: ['Text', 'Images'],
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      description: 'Smaller, faster version of GPT-4o with excellent performance',
      capabilities: ['Text', 'Images'],
    }
  ];
};

// Check if model supports system instructions
export const supportsSystemInstructions = (modelName: string): boolean => {
  // All current OpenAI chat models support system instructions
  return true;
}; 