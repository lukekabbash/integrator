import OpenAI from 'openai';
import { Message } from '../types/chat';

// Initialize the OpenAI client
const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: API_KEY as string,
  dangerouslyAllowBrowser: true // Allowing browser usage - in production, use a backend proxy
});

// Default model name
const DEFAULT_MODEL = 'gpt-4o-latest';

// OpenAI model configuration for optimal streaming performance
const getModelConfig = (modelName: string) => {
  // Base configuration for all models
  const baseConfig: {
    temperature: number;
    top_p: number;
    max_tokens: number;
  } = {
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 4096,
  };
  
  // Model-specific optimizations
  if (modelName === 'gpt-4o-mini') {
    return {
      ...baseConfig,
      // More tokens for the mini model since it's faster
      max_tokens: 8192,
    };
  } else if (modelName === 'gpt-4o-latest') {
    return {
      ...baseConfig,
      // Lower temperature for more precise responses
      temperature: 0.6,
    };
  }
  
  return baseConfig;
};

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
  modelName: string = DEFAULT_MODEL,
  systemPrompt?: string,
  streamingOptions?: { renderInterval?: number }
): Promise<string> => {
  try {
    const formattedMessages = formatMessagesForOpenAI(messages, systemPrompt);
    const config = getModelConfig(modelName);
    
    // Use custom render interval if provided, otherwise default to 5ms for super fast streaming
    const RENDER_INTERVAL = streamingOptions?.renderInterval || 5;
    console.log(`OpenAI streaming with render interval: ${RENDER_INTERVAL}ms, model: ${modelName}`);
    
    // For extremely fast streaming (5ms or less), use requestAnimationFrame for smooth rendering
    const useAnimationFrame = RENDER_INTERVAL <= 5;
    let animationFrameId: number | null = null;
    let pendingChunks: string[] = [];
    let bufferText = '';
    let lastRenderTime = Date.now();
    let fullResponse = '';
    
    if (useAnimationFrame) {
      // Set up animation frame rendering for smoother UI updates
      const renderPendingChunks = () => {
        if (pendingChunks.length > 0) {
          const text = pendingChunks.join('');
          onChunk(text);
          pendingChunks = [];
        }
        animationFrameId = requestAnimationFrame(renderPendingChunks);
      };
      animationFrameId = requestAnimationFrame(renderPendingChunks);
    }

    // Create a streaming completion
    const stream = await openai.chat.completions.create({
      model: modelName,
      messages: formattedMessages as OpenAI.ChatCompletionMessageParam[],
      temperature: config.temperature,
      top_p: config.top_p,
      max_tokens: config.max_tokens,
      stream: true,
    });
    
    // Process each chunk of the stream
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      
      if (content) {
        fullResponse += content;
        
        if (useAnimationFrame) {
          // For animation frame based rendering, collect chunks to be rendered on next frame
          pendingChunks.push(content);
        } else {
          // For interval based rendering
          bufferText += content;
          
          // For fast streaming but not animation frame, update on each chunk
          if (RENDER_INTERVAL <= 15) {
            onChunk(content);
          } else {
            // For slower streaming, batch updates based on time interval
            const currentTime = Date.now();
            if (currentTime - lastRenderTime > RENDER_INTERVAL) {
              if (bufferText) {
                onChunk(bufferText);
                bufferText = '';
                lastRenderTime = currentTime;
              }
            }
          }
        }
      }
    }
    
    // Clean up animation frame if it was used
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      
      // Make sure any final pending chunks are rendered
      if (pendingChunks.length > 0) {
        const text = pendingChunks.join('');
        onChunk(text);
      }
    }
    
    // Make sure to send any remaining buffered text for interval based rendering
    if (!useAnimationFrame && bufferText) {
      onChunk(bufferText);
    }
    
    return fullResponse;
  } catch (error) {
    console.error('Error generating OpenAI streaming response:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    
    throw error;
  }
};

// Check if OpenAI model is available
export const checkOpenAIModelAvailability = async (modelName: string): Promise<{available: boolean, supportsStreaming: boolean}> => {
  try {
    // Simple request to check if the model is available
    await openai.chat.completions.create({
      model: modelName,
      messages: [{ role: 'user', content: 'Hello' }] as OpenAI.ChatCompletionMessageParam[],
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