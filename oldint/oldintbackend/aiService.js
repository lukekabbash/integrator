import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';

// Define supported models with their API names
const MODEL_MAPPINGS = {
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'o1-mini': 'o1-mini',
    'o3-mini': 'o3-mini',
    'deepseek-chat': 'deepseek-chat',
    'deepseek-reasoner': 'deepseek-reasoner'
};

// Models that don't support system messages
const NO_SYSTEM_MESSAGE_MODELS = ['o1-mini'];

const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini', 'o1-mini', 'o3-mini'];
const GEMINI_MODELS = ['gemini-2.0-pro-exp-02-05', 'gemini-2.0-flash-thinking-exp-01-21', 'gemini-1.5-pro', 'gemini-1.5-flash'];
const ANTHROPIC_MODELS = ['claude-3-5-sonnet-latest'];
const XAI_MODELS = ['grok-2-latest'];
const PERPLEXITY_MODELS = ['sonar', 'sonar-pro', 'sonar-reasoning-pro'];
const DEEPSEEK_MODELS = ['deepseek-chat', 'deepseek-reasoner'];

// Export model lists for frontend use
export const supportedModels = {
    OpenAI: OPENAI_MODELS,
    xAI: XAI_MODELS,
    Google: GEMINI_MODELS,
    Anthropic: ANTHROPIC_MODELS,
    Perplexity: PERPLEXITY_MODELS,
    DeepSeek: DEEPSEEK_MODELS
};

class AIService {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.google = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.xaiApiKey = process.env.XAI_API_KEY;
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  }

  async streamResponse(provider, model, messages, options = {}) {
    const { temperature = 0.7, systemPrompt = '' } = options;
    
    switch (provider.toLowerCase()) {
      case 'openai':
        return this.streamOpenAI(model, messages, systemPrompt, temperature);
      case 'google':
        return this.streamGoogle(model, messages, systemPrompt, temperature);
      case 'anthropic':
        return this.streamAnthropic(model, messages, systemPrompt, temperature);
      case 'xai':
        return this.streamXAI(model, messages, systemPrompt, temperature);
      case 'perplexity':
        return this.streamPerplexity(model, messages, systemPrompt, temperature);
      case 'deepseek':
        return this.streamDeepseek(model, messages, systemPrompt, temperature);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async streamOpenAI(model, messages, systemPrompt, temperature) {
    const config = { apiKey: process.env.OPENAI_API_KEY };
    if (model.includes('o')) {
      config.baseURL = "https://api.x.ai/v1";
    }
    const openai = new OpenAI(config);

    // Prepare messages based on model support for system messages
    const formattedMessages = NO_SYSTEM_MESSAGE_MODELS.includes(model) 
      ? [{ role: "user", content: `${systemPrompt}\n\nUser: ${messages[messages.length - 1].content}` }]
      : [
          { role: "system", content: systemPrompt },
          ...messages
        ];

    const stream = await openai.chat.completions.create({
      model: MODEL_MAPPINGS[model] || model.replace('o', ''),
      messages: formattedMessages,
      temperature,
      stream: true,
    });

    return stream;
  }

  async streamGoogle(model, messages, systemPrompt, temperature) {
    const openai = new OpenAI({
      apiKey: process.env.GOOGLE_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    const stream = await openai.chat.completions.create({
      model,
      messages: formattedMessages,
      temperature,
      stream: true
    });

    return stream;
  }

  async streamAnthropic(model, messages, systemPrompt, temperature) {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const formattedMessages = [
      { role: "user", content: systemPrompt },
      { role: "assistant", content: "I understand and will act according to those instructions." },
      ...messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }))
    ];

    const stream = await anthropic.messages.create({
      model: model.replace('-latest', ''),
      messages: formattedMessages,
      temperature,
      stream: true,
      max_tokens: 4096
    });

    return stream;
  }

  async streamXAI(model, messages, systemPrompt, temperature) {
    const openai = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: "https://api.x.ai/v1"
    });

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    const stream = await openai.chat.completions.create({
      model: model.replace('-latest', ''),
      messages: formattedMessages,
      temperature,
      stream: true
    });

    return stream;
  }

  async streamPerplexity(model, messages, systemPrompt, temperature) {
    const openai = new OpenAI({
      apiKey: this.perplexityApiKey,
      baseURL: 'https://api.perplexity.ai'
    });

    // Format messages for Perplexity
    let formattedMessages = [];
    
    // Add system message if provided
    if (systemPrompt) {
      formattedMessages.push({ role: "system", content: systemPrompt });
    }

    // Add previous messages
    formattedMessages = [...formattedMessages, ...messages];

    const stream = await openai.chat.completions.create({
      model,
      messages: formattedMessages,
      temperature,
      stream: true
    });

    return stream;
  }

  async streamDeepseek(model, messages, systemPrompt, temperature) {
    const openai = new OpenAI({
      apiKey: this.deepseekApiKey,
      baseURL: "https://api.deepseek.com"
    });

    // Filter out any reasoning_content from previous messages
    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    const streamConfig = {
      model,
      messages: formattedMessages,
      stream: true,
      max_tokens: 4096
    };

    // Only add temperature for non-reasoner models
    if (model !== 'deepseek-reasoner' && temperature !== undefined) {
      streamConfig.temperature = temperature;
    }

    const stream = await openai.chat.completions.create(streamConfig);
    return stream;
  }
}

export default new AIService(); 