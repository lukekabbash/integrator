import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message } from '../types/chat';
import { getStoredApiKey } from '../hooks/useApiKeys';

// Initialize the Gemini API client with stored API key
const getGeminiClient = () => {
  const apiKey = getStoredApiKey('google');
  if (!apiKey) throw new Error('Google AI API key not found');
  return new GoogleGenerativeAI(apiKey);
};

// Default model name
const DEFAULT_MODEL = 'gemini-2.0-flash';

// Model configuration for faster streaming and optimal performance
const getGenerationConfig = (modelName: string) => {
  // Base configuration for all models
  const baseConfig: {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
    systemInstruction?: string;
  } = {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  };
  
  // Model-specific optimizations
  if (modelName.includes('flash')) {
    return {
      ...baseConfig,
      // Flash models can use a slightly higher temperature for creativity
      // while maintaining the fast response time
      temperature: 0.75,
    };
  } else if (modelName.includes('pro')) {
    return {
      ...baseConfig,
      // Pro models can handle larger outputs
      maxOutputTokens: 16384,
    };
  }
  
  return baseConfig;
};

export const initChat = async (
  modelName: string = DEFAULT_MODEL, 
  systemPrompt?: string
) => {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: modelName });
  const config = getGenerationConfig(modelName);
  
  // If system prompt is provided, include it in chat creation
  if (systemPrompt && systemPrompt.trim() !== '') {
    return model.startChat({
      generationConfig: config,
      systemInstruction: systemPrompt,
    });
  }
  
  return model.startChat({
    generationConfig: config
  });
};

export const generateResponse = async (
  messages: Message[], 
  modelName: string = DEFAULT_MODEL,
  systemPrompt?: string
) => {
  const chat = await initChat(modelName, systemPrompt);
  
  // Format messages for the Gemini API
  for (const message of messages.slice(0, -1)) {
    if (message.role === 'user') {
      await chat.sendMessage(message.content);
    }
  }

  // Generate response for the latest user message
  const latestUserMessage = messages.filter(msg => msg.role === 'user').pop();
  
  if (!latestUserMessage) {
    throw new Error('No user message found');
  }

  try {
    const response = await chat.sendMessage(latestUserMessage.content);
    const responseText = response.response.text();
    return responseText;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
};

export const generateStreamingResponse = async (
  messages: Message[], 
  onChunk: (chunk: string) => void,
  modelName: string,
  systemPrompt?: string,
  options?: {
    temperature?: number;
    maxOutputTokens?: number;
  }
) => {
  try {
    const { temperature = 0.7, maxOutputTokens = 2048 } = options || {};
    
    // Convert messages to Gemini format
    const geminiMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Add system prompt if provided
    if (systemPrompt) {
      geminiMessages.unshift({
        role: 'user',
        parts: [{ text: `System: ${systemPrompt}` }],
      });
    }

    // Initialize Gemini chat
    const chat = getGeminiClient().getGenerativeModel({ model: modelName }).startChat({
      generationConfig: {
        temperature,
        maxOutputTokens,
        topP: 0.8,
        topK: 40,
      },
      history: geminiMessages,
    });

    // Generate response with streaming
    const result = await chat.sendMessageStream(geminiMessages[geminiMessages.length - 1].parts[0].text);
    
    let fullResponse = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      onChunk(chunkText);
    }
    
    return fullResponse;
  } catch (error) {
    console.error('Error in Gemini streaming response:', error);
    throw error;
  }
};

// Enhanced function to check if model is available and supports streaming
export const checkModelAvailability = async (modelName: string): Promise<{available: boolean, supportsStreaming: boolean}> => {
  try {
    const model = getGeminiClient().getGenerativeModel({ model: modelName });
    // Try a simple test prompt
    await model.generateContent('Test prompt to check if the model is available.');
    
    // All Gemini models now support streaming
    return { available: true, supportsStreaming: true };
  } catch (error) {
    console.error(`Model ${modelName} not available:`, error);
    return { available: false, supportsStreaming: false };
  }
};

// New function to get content stream directly (not in a chat session)
export const getContentStream = async (
  prompt: string,
  onChunk: (chunk: string) => void,
  modelName: string = DEFAULT_MODEL,
  systemPrompt?: string
): Promise<string> => {
  try {
    const model = getGeminiClient().getGenerativeModel({ model: modelName });
    const config = getGenerationConfig(modelName);
    
    // Create content generation config
    const generationConfig = { ...config };
    
    // Create the request with proper structure for content generation
    const request: {
      contents: Array<{ role: string, parts: Array<{ text: string }> }>;
      generationConfig: typeof generationConfig;
      systemInstruction?: string;
    } = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig
    };
    
    // Add system instruction if provided
    if (systemPrompt && systemPrompt.trim() !== '') {
      request.systemInstruction = systemPrompt;
    }
    
    // Get the streaming response
    const streamingResponse = await model.generateContentStream(request);
    let fullResponse = '';
    
    // Process the stream chunks with direct delivery
    for await (const chunk of streamingResponse.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullResponse += chunkText;
        // Send each chunk directly to UI
        onChunk(chunkText);
      }
    }
    
    return fullResponse;
  } catch (error) {
    console.error('Error generating content stream:', error);
    throw error;
  }
}; 