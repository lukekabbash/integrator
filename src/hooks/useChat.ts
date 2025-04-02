import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, ChatSession, MessageRole, ALL_MODELS, Model, ModelProvider, SystemPrompt } from '../types/chat';
import { generateStreamingResponse, checkModelAvailability } from '../services/geminiService';
import { generateOpenAIStreamingResponse, checkOpenAIModelAvailability } from '../services/openaiService';

// Default system prompt
const DEFAULT_SYSTEM_PROMPT = "You are a helpful, accurate, and friendly AI assistant. You provide detailed and thoughtful responses to user queries while striving to be as accurate and unbiased as possible. When you don't know something or aren't sure, you admit it clearly rather than making something up. You can assist with a wide range of tasks including answering questions, providing explanations, generating creative content, and more.";

// Local storage keys
const STORAGE_KEY_SESSIONS = 'ai_chat_sessions';
const STORAGE_KEY_ACTIVE_SESSION = 'ai_active_session_id';
const STORAGE_KEY_STREAMING = 'ai_streaming_enabled';
const STORAGE_KEY_STREAMING_SPEED = 'ai_streaming_speed';
const STORAGE_KEY_PROVIDER = 'ai_selected_provider';
const STORAGE_KEY_TEMPERATURE = 'chat_temperature';
const STORAGE_KEY_MAX_TOKENS = 'chat_max_tokens';
const STORAGE_KEY_SYSTEM_PROMPTS = 'chat_system_prompts';

// Helper function to serialize dates properly when saving to localStorage
const serializeSessions = (sessions: ChatSession[]): string => {
  return JSON.stringify(sessions);
};

// Helper function to deserialize dates when loading from localStorage
const deserializeSessions = (sessionsData: string): ChatSession[] => {
  try {
    const data = JSON.parse(sessionsData);
    return data.map((session: any) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      messages: session.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })),
      // Ensure provider is set (for backward compatibility)
      provider: session.provider || 'google'
    }));
  } catch (error) {
    console.error('Error deserializing sessions:', error);
    return [];
  }
};

// Check if the selected model supports system prompts
const supportsSystemPrompt = (modelName: string, provider: ModelProvider): boolean => {
  // Models that don't support system prompts
  const nonSupportedModels: string[] = [
    // Gemini models that don't support system instructions
    'gemini-1.5-flash-8b'
  ];
  
  return !nonSupportedModels.includes(modelName);
};

const getEffectiveSystemPrompt = (modelName: string, systemPrompt: string, provider: ModelProvider): string | undefined => {
  if (!supportsSystemPrompt(modelName, provider)) {
    return undefined; // Don't use system prompt for non-supported models
  }
  return systemPrompt;
};

// Get model details from ID
const getModelDetails = (modelId: string): Model | undefined => {
  return ALL_MODELS.find(model => model.id === modelId);
};

// Get provider from model ID
const getProviderFromModelId = (modelId: string): ModelProvider => {
  const model = getModelDetails(modelId);
  return model?.provider || 'google'; // Default to google if not found
};

// Streaming speeds (in ms) - lower is faster
const STREAMING_SPEEDS = {
  SLOW: 100,
  NORMAL: 50,
  FAST: 15,
  VERY_FAST: 5,
};

// Default system prompts
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

interface ModelCapability {
  available: boolean;
  supportsStreaming: boolean;
}

export const useChat = () => {
  const defaultModel = ALL_MODELS[0].id;
  const defaultProvider = getProviderFromModelId(defaultModel);
  
  // Load sessions from localStorage or use default
  const loadSavedSessions = (): ChatSession[] => {
    const savedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (savedSessions) {
      const sessions = deserializeSessions(savedSessions);
      return sessions.length > 0 ? sessions : getDefaultSession();
    }
    return getDefaultSession();
  };
  
  // Load provider preference
  const loadSavedProvider = (): ModelProvider => {
    const savedProvider = localStorage.getItem(STORAGE_KEY_PROVIDER);
    return (savedProvider as ModelProvider) || defaultProvider;
  };
  
  // Create default session
  const getDefaultSession = (): ChatSession[] => {
    return [{
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      modelName: defaultModel,
      provider: defaultProvider,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
    }];
  };
  
  // Load active session ID from localStorage or use first session
  const loadSavedActiveSessionId = (sessions: ChatSession[]): string => {
    const savedActiveSessionId = localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
    if (savedActiveSessionId && sessions.some(session => session.id === savedActiveSessionId)) {
      return savedActiveSessionId;
    }
    return sessions[0].id;
  };
  
  // Load streaming preference from localStorage
  const loadStreamingPreference = (): boolean => {
    const savedPreference = localStorage.getItem(STORAGE_KEY_STREAMING);
    return savedPreference !== null ? savedPreference === 'true' : true;
  };
  
  // Load streaming speed preference from localStorage
  const loadStreamingSpeedPreference = (): number => {
    const savedSpeed = localStorage.getItem(STORAGE_KEY_STREAMING_SPEED);
    return savedSpeed !== null ? parseInt(savedSpeed, 10) : STREAMING_SPEEDS.VERY_FAST;
  };
  
  // Load temperature preference from localStorage
  const loadTemperaturePreference = (): number => {
    const savedTemp = localStorage.getItem(STORAGE_KEY_TEMPERATURE);
    return savedTemp !== null ? parseFloat(savedTemp) : 0.7;
  };

  // Load max tokens preference from localStorage
  const loadMaxTokensPreference = (): number => {
    const savedTokens = localStorage.getItem(STORAGE_KEY_MAX_TOKENS);
    return savedTokens !== null ? parseInt(savedTokens, 10) : 2048;
  };
  
  // Load system prompts from localStorage
  const loadSavedSystemPrompts = (): SystemPrompt[] => {
    const savedPrompts = localStorage.getItem(STORAGE_KEY_SYSTEM_PROMPTS);
    return savedPrompts ? JSON.parse(savedPrompts) : DEFAULT_SYSTEM_PROMPTS;
  };
  
  // State for model capabilities
  const [modelCapabilities, setModelCapabilities] = useState<Record<string, ModelCapability>>({});
  
  // State for streaming
  const [streamingEnabled, setStreamingEnabled] = useState<boolean>(loadStreamingPreference());
  const [streamingSpeed, setStreamingSpeed] = useState<number>(loadStreamingSpeedPreference());
  
  // Other states
  const [sessions, setSessions] = useState<ChatSession[]>(loadSavedSessions);
  const [activeSessionId, setActiveSessionId] = useState<string>(loadSavedActiveSessionId(sessions));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider>(loadSavedProvider());
  const [temperature, setTemperature] = useState<number>(loadTemperaturePreference());
  const [maxOutputTokens, setMaxOutputTokens] = useState<number>(loadMaxTokensPreference());
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>(loadSavedSystemPrompts());

  // Find active session
  const activeSession = sessions.find(session => session.id === activeSessionId) || null;
  
  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SESSIONS, serializeSessions(sessions));
  }, [sessions]);
  
  // Save active session ID to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, activeSessionId);
  }, [activeSessionId]);
  
  // Save streaming preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STREAMING, String(streamingEnabled));
  }, [streamingEnabled]);
  
  // Save streaming speed to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STREAMING_SPEED, String(streamingSpeed));
  }, [streamingSpeed]);
  
  // Save provider preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROVIDER, selectedProvider);
  }, [selectedProvider]);

  // Save temperature to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TEMPERATURE, String(temperature));
  }, [temperature]);

  // Save max tokens to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MAX_TOKENS, String(maxOutputTokens));
  }, [maxOutputTokens]);

  // Save system prompts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SYSTEM_PROMPTS, JSON.stringify(systemPrompts));
  }, [systemPrompts]);

  // Check which models are available and their streaming capabilities
  useEffect(() => {
    const checkModels = async () => {
      const modelChecks = await Promise.all(
        ALL_MODELS.map(async (model) => {
          // Different check based on provider
          let capabilities;
          if (model.provider === 'google') {
            capabilities = await checkModelAvailability(model.id);
          } else if (['openai', 'deepseek'].includes(model.provider)) {
            // OpenAI and DeepSeek use OpenAI-compatible SDK
            capabilities = await checkOpenAIModelAvailability(model.id);
          } else if (model.provider === 'xai') {
            // xAI models should be available with the existing key
            try {
              capabilities = await checkOpenAIModelAvailability(model.id);
            } catch (error) {
              console.warn('Error checking XAI model availability:', error);
              // Consider XAI models available even if check fails
              capabilities = { available: true, supportsStreaming: true };
            }
          } else {
            // For unsupported providers, assume not available
            capabilities = { available: false, supportsStreaming: false };
          }
          
          return { 
            id: model.id, 
            capabilities
          };
        })
      );

      // Update model capabilities state
      const capabilities: Record<string, {available: boolean, supportsStreaming: boolean}> = {};
      modelChecks.forEach(result => {
        capabilities[result.id] = result.capabilities;
      });
      setModelCapabilities(capabilities);
      
      // If no models are available, set a default capability
      if (Object.values(capabilities).every(cap => !cap.available)) {
        console.error("No models available, falling back to default model");
        setModelCapabilities({
          [defaultModel]: { available: true, supportsStreaming: true }
        });
      }
    };

    checkModels();
  }, [defaultModel]);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      modelName: activeSession?.modelName || defaultModel,
      provider: activeSession?.provider || selectedProvider,
      systemPrompt: activeSession?.systemPrompt || DEFAULT_SYSTEM_PROMPT,
    };

    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    return newSession;
  }, [activeSession, defaultModel, selectedProvider]);

  // Create a new session with history from another session up to a specific message
  const branchSession = useCallback((sessionId: string, messageId: string): ChatSession | null => {
    // Find source session
    const sourceSession = sessions.find(s => s.id === sessionId);
    if (!sourceSession) return null;
    
    // Find message index
    const messageIndex = sourceSession.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex < 0) return null;
    
    // Create new session with copied properties
    const newSession: ChatSession = {
      id: uuidv4(),
      title: `Branched from ${sourceSession.title.slice(0, 20)}...`,
      messages: sourceSession.messages.slice(0, messageIndex).map(msg => ({
        ...msg,
        id: uuidv4() // Generate new IDs for the copied messages
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      modelName: sourceSession.modelName,
      provider: sourceSession.provider,
      systemPrompt: sourceSession.systemPrompt,
    };
    
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    return newSession;
  }, [sessions]);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const updatedSessions = prev.filter(session => session.id !== sessionId);
      
      // If deleting the active session, select another one
      if (sessionId === activeSessionId) {
        if (updatedSessions.length > 0) {
          setActiveSessionId(updatedSessions[0].id);
        } else {
          // If no sessions left, create a new one
          const newSession = {
            id: uuidv4(),
            title: 'New Chat',
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            modelName: defaultModel,
            provider: selectedProvider,
            systemPrompt: DEFAULT_SYSTEM_PROMPT,
          };
          setActiveSessionId(newSession.id);
          return [newSession];
        }
      }
      
      return updatedSessions;
    });
  }, [activeSessionId, defaultModel, selectedProvider]);

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const updateSessionTitle = useCallback((sessionId: string, title: string) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, title, updatedAt: new Date() } 
          : session
      )
    );
  }, []);

  const addMessage = useCallback((content: string, role: MessageRole) => {
    if (!activeSessionId) return null;
    
    const newMessage: Message = {
      id: uuidv4(),
      content,
      role,
      timestamp: new Date(),
    };

    setSessions(prev => 
      prev.map(session => 
        session.id === activeSessionId
          ? {
              ...session,
              messages: [...session.messages, newMessage],
              updatedAt: new Date(),
              // Update title if it's the first user message and still default
              title: role === 'user' && session.title === 'New Chat' && session.messages.length === 0
                ? content.slice(0, 30) + (content.length > 30 ? '...' : '')
                : session.title
            }
          : session
      )
    );

    return newMessage;
  }, [activeSessionId]);

  const updateMessage = useCallback((messageId: string, content: string) => {
    if (!activeSessionId) return;
    
    setSessions(prev => 
      prev.map(session => 
        session.id === activeSessionId
          ? {
              ...session,
              messages: session.messages.map(msg =>
                msg.id === messageId ? { ...msg, content } : msg
              ),
              updatedAt: new Date()
            }
          : session
      )
    );
  }, [activeSessionId]);

  // Generate a response using the appropriate service based on the provider
  const generateResponse = useCallback(
    async (messages: Message[], modelName: string, provider: ModelProvider, systemPrompt?: string, onChunk?: (chunk: string) => void) => {
      const effectiveSystemPrompt = getEffectiveSystemPrompt(modelName, systemPrompt || '', provider);
      
      // Choose the right service based on provider
      if (provider === 'google') {
        // Use Gemini streaming service
        if (onChunk) {
          return generateStreamingResponse(
            messages, 
            onChunk, 
            modelName, 
            effectiveSystemPrompt,
            {
              temperature,
              maxOutputTokens,
            }
          );
        } else {
          // For non-streaming, we'll use streaming anyway but collect the full response
          let fullResponse = '';
          await generateStreamingResponse(
            messages,
            (chunk) => { fullResponse += chunk; },
            modelName,
            effectiveSystemPrompt,
            {
              temperature,
              maxOutputTokens,
            }
          );
          return fullResponse;
        }
      } else if (['openai', 'deepseek'].includes(provider)) {
        // OpenAI and DeepSeek use OpenAI-compatible SDK
        return generateOpenAIStreamingResponse(
          messages,
          onChunk || ((chunk) => {}),
          modelName,
          effectiveSystemPrompt,
          {
            temperature,
            max_tokens: maxOutputTokens,
          }
        );
      } else if (provider === 'xai') {
        // Handle xAI models (Grok) specifically with OpenAI SDK
        console.log("Using xAI API for model:", modelName);
        return generateOpenAIStreamingResponse(
          messages,
          onChunk || ((chunk) => {}),
          modelName,
          effectiveSystemPrompt,
          {
            temperature,
            max_tokens: maxOutputTokens,
          }
        );
      } else {
        throw new Error(`Provider ${provider} not supported`);
      }
    },
    [temperature, maxOutputTokens]
  );

  // Move sendMessage above regenerateFromMessage
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !activeSession) return;

      // Add user message
      const userMessage = addMessage(content, 'user');
      if (!userMessage) return;

      // Add a placeholder for the AI response
      const aiMessageId = uuidv4();
      setSessions(prev => 
        prev.map(session => 
          session.id === activeSessionId
            ? {
                ...session,
                messages: [
                  ...session.messages,
                  {
                    id: aiMessageId,
                    content: '',
                    role: 'model',
                    timestamp: new Date(),
                    isLoading: true,
                    provider: session.provider,
                    modelName: session.modelName
                  },
                ],
                updatedAt: new Date()
              }
            : session
        )
      );

      setIsLoading(true);
      setError(null);

      try {
        let fullResponse = '';
        
        // Use streaming with direct updates
        await generateResponse(
          [...activeSession.messages, userMessage],
          activeSession.modelName,
          activeSession.provider,
          activeSession.systemPrompt,
          (chunk) => {
            fullResponse += chunk;
            // Immediately update UI - crucial for xAI streaming
            updateMessage(aiMessageId, fullResponse);
          }
        );

        // Update the message to remove loading state
        setSessions(prev => 
          prev.map(session => 
            session.id === activeSessionId
              ? {
                  ...session,
                  messages: session.messages.map(msg =>
                    msg.id === aiMessageId ? { 
                      ...msg, 
                      isLoading: false,
                      provider: session.provider,
                      modelName: session.modelName
                    } : msg
                  ),
                  updatedAt: new Date()
                }
              : session
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        
        // Update the message to show error
        setSessions(prev => 
          prev.map(session => 
            session.id === activeSessionId
              ? {
                  ...session,
                  messages: session.messages.map(msg =>
                    msg.id === aiMessageId 
                      ? { 
                          ...msg, 
                          content: 'Sorry, there was an error generating a response. Please try again.',
                          isLoading: false 
                        } 
                      : msg
                  ),
                  updatedAt: new Date()
                }
              : session
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeSession, activeSessionId, addMessage, updateMessage, generateResponse]
  );

  // Regenerate AI responses from a specific message onwards
  const regenerateFromMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!activeSessionId || !activeSession) return;
    
    // Find the index of the message to edit
    const messageIndex = activeSession.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex < 0) return;
    
    // Update the message with new content
    const updatedMessages = [...activeSession.messages];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      content: newContent
    };
    
    // Remove all AI responses after this message
    const currentSession = {
      ...activeSession,
      messages: updatedMessages.filter((msg, idx) => 
        idx <= messageIndex || (idx > messageIndex && msg.role === 'user')
      )
    };
    
    setSessions(prev => 
      prev.map(session => 
        session.id === activeSessionId ? currentSession : session
      )
    );
    
    // If the edited message is a user message, generate a new AI response
    if (updatedMessages[messageIndex].role === 'user') {
      // Add a placeholder for the AI response
      const aiMessageId = uuidv4();
      setSessions(prev => 
        prev.map(session => 
          session.id === activeSessionId
            ? {
                ...session,
                messages: [
                  ...session.messages,
                  {
                    id: aiMessageId,
                    content: '',
                    role: 'model',
                    timestamp: new Date(),
                    isLoading: true,
                    provider: session.provider,
                    modelName: session.modelName
                  },
                ],
                updatedAt: new Date()
              }
            : session
        )
      );
      
      setIsLoading(true);
      setError(null);
      
      try {
        let fullResponse = '';
        
        // Direct streaming with simple callback
        await generateResponse(
          currentSession.messages,
          currentSession.modelName,
          currentSession.provider,
          currentSession.systemPrompt,
          (chunk) => {
            // Immediately update UI with each chunk
            fullResponse += chunk;
            updateMessage(aiMessageId, fullResponse);
          }
        );

        // Update the message to remove loading state
        setSessions(prev => 
          prev.map(session => 
            session.id === activeSessionId
              ? {
                  ...session,
                  messages: session.messages.map(msg =>
                    msg.id === aiMessageId ? { 
                      ...msg, 
                      isLoading: false,
                      provider: session.provider,
                      modelName: session.modelName
                    } : msg
                  ),
                  updatedAt: new Date()
                }
              : session
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        
        // Update the message to show error
        setSessions(prev => 
          prev.map(session => 
            session.id === activeSessionId
              ? {
                  ...session,
                  messages: session.messages.map(msg =>
                    msg.id === aiMessageId 
                      ? { 
                          ...msg, 
                          content: 'Sorry, there was an error generating a response. Please try again.',
                          isLoading: false 
                        } 
                      : msg
                  ),
                  updatedAt: new Date()
                }
              : session
          )
        );
      } finally {
        setIsLoading(false);
      }
    }
  }, [activeSession, activeSessionId, generateResponse, updateMessage]);

  // Toggle streaming
  const toggleStreaming = useCallback(() => {
    setStreamingEnabled((prev: boolean) => !prev);
  }, []);
  
  // Set streaming speed
  const setStreamingSpeedPreference = useCallback((speed: number) => {
    setStreamingSpeed(speed);
  }, []);

  // Change provider
  const changeProvider = useCallback((newProvider: ModelProvider) => {
    setSelectedProvider(newProvider);
    
    // If active session exists, update its provider
    if (activeSessionId) {
      setSessions(prev =>
        prev.map(session =>
          session.id === activeSessionId
            ? { ...session, provider: newProvider, updatedAt: new Date() }
            : session
        )
      );
    }
  }, [activeSessionId]);

  const changeTemperature = (newTemp: number) => {
    setTemperature(newTemp);
  };

  const changeMaxOutputTokens = (newTokens: number) => {
    setMaxOutputTokens(newTokens);
  };

  const updateSystemPrompts = useCallback((prompts: SystemPrompt[]) => {
    setSystemPrompts(prompts);
  }, []);

  return {
    sessions,
    activeSession,
    activeSessionId,
    messages: activeSession?.messages || [],
    isLoading,
    error,
    modelName: activeSession?.modelName || defaultModel,
    provider: activeSession?.provider || selectedProvider,
    systemPrompt: activeSession?.systemPrompt || DEFAULT_SYSTEM_PROMPT,
    selectedProvider,
    temperature,
    maxOutputTokens,
    sendMessage,
    clearChat: () => {
      setSessions(prev =>
        prev.map(session =>
          session.id === activeSessionId
            ? { ...session, messages: [], updatedAt: new Date() }
            : session
        )
      );
    },
    changeModel: (newModel: string) => {
      const newProvider = getProviderFromModelId(newModel);
      
      setSessions(prev =>
        prev.map(session =>
          session.id === activeSessionId
            ? { 
                ...session, 
                modelName: newModel, 
                provider: newProvider,
                updatedAt: new Date() 
              }
            : session
        )
      );
      
      // Also update the selected provider
      setSelectedProvider(newProvider);
    },
    createNewSession,
    deleteSession,
    selectSession,
    updateSystemPrompt: (prompt: string) => {
      setSessions(prev =>
        prev.map(session =>
          session.id === activeSessionId
            ? { ...session, systemPrompt: prompt, updatedAt: new Date() }
            : session
        )
      );
    },
    branchSession,
    updateMessage,
    regenerateFromMessage,
    changeProvider,
    changeTemperature,
    changeMaxOutputTokens,
    systemPrompts,
    updateSystemPrompts,
  };
};

export default useChat; 