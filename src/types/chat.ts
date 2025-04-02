export type MessageRole = 'user' | 'model' | 'assistant';
export type ModelProvider = 'google' | 'openai' | 'xai' | 'deepseek';

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  isLoading?: boolean;
  provider?: ModelProvider;
  modelName?: string;
  reasoningContent?: string;  // For DeepSeek
  thinkingContent?: string;   // For Gemini
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  modelName: string;
  provider: ModelProvider;
  systemPrompt: string;
}

export interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isResponding: boolean;
}

export interface Model {
  id: string;
  name: string;
  description: string;
  provider: ModelProvider;
  capabilities: string[];
}

export interface SystemPrompt {
  name: string;
  prompt: string;
}

// Gemini models
export const GEMINI_MODELS: Model[] = [
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Next generation features, speed, thinking, realtime streaming, and multimodal generation',
    provider: 'google',
    capabilities: ['Audio', 'Images', 'Videos', 'Text']
  },
  {
    id: 'gemini-2.5-pro-exp-03-25',
    name: 'Gemini 2.5 Pro Experimental',
    description: 'Enhanced thinking and reasoning, multimodal understanding, advanced coding, and more',
    provider: 'google',
    capabilities: ['Audio', 'Images', 'Videos', 'Text']
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    description: 'Cost efficiency and low latency',
    provider: 'google',
    capabilities: ['Audio', 'Images', 'Videos', 'Text']
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Fast and versatile performance across a diverse variety of tasks',
    provider: 'google',
    capabilities: ['Audio', 'Images', 'Videos', 'Text']
  },
  {
    id: 'gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash 8B',
    description: 'High volume and lower intelligence tasks',
    provider: 'google',
    capabilities: ['Audio', 'Images', 'Videos', 'Text']
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Complex reasoning tasks requiring more intelligence',
    provider: 'google',
    capabilities: ['Audio', 'Images', 'Videos', 'Text']
  }
];

// OpenAI models
export const OPENAI_MODELS: Model[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable multimodal model, optimized for chat and image understanding',
    provider: 'openai',
    capabilities: ['Text', 'Images']
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Smaller, faster version of GPT-4o with excellent performance',
    provider: 'openai',
    capabilities: ['Text', 'Images']
  }
];

// xAI models
export const XAI_MODELS: Model[] = [
  {
    id: 'grok-2-latest',
    name: 'Grok 2',
    description: 'Latest model from xAI with strong reasoning capabilities',
    provider: 'xai',
    capabilities: ['Text']
  },
  {
    id: 'grok-2-vision-latest',
    name: 'Grok 2 Vision',
    description: 'Multimodal model from xAI capable of understanding images',
    provider: 'xai',
    capabilities: ['Text', 'Images']
  }
];

// DeepSeek models
export const DEEPSEEK_MODELS: Model[] = [
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    description: 'DeepSeek-V3 chat model with strong general capabilities',
    provider: 'deepseek',
    capabilities: ['Text']
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek Reasoner',
    description: 'DeepSeek-R1 with advanced reasoning and Chain of Thought capabilities',
    provider: 'deepseek',
    capabilities: ['Text', 'Reasoning']
  }
];

// All models combined
export const ALL_MODELS: Model[] = [
  ...GEMINI_MODELS, 
  ...OPENAI_MODELS, 
  ...XAI_MODELS,
  ...DEEPSEEK_MODELS
]; 