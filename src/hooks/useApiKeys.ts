import { useState, useEffect } from 'react';
import { ModelProvider } from '../types/chat';

interface ApiKeys {
  google?: string;
  openai?: string;
  xai?: string;
  deepseek?: string;
}

const STORAGE_KEY = 'api_keys';

// Utility function to get API keys synchronously
export const getStoredApiKey = (provider: ModelProvider): string | undefined => {
  const savedKeys = localStorage.getItem(STORAGE_KEY);
  if (savedKeys) {
    const keys = JSON.parse(savedKeys) as ApiKeys;
    return keys[provider];
  }
  return undefined;
};

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});

  useEffect(() => {
    // Load API keys from localStorage when hook is initialized
    const savedKeys = localStorage.getItem(STORAGE_KEY);
    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys));
    }
  }, []);

  const getApiKey = (provider: ModelProvider): string | undefined => {
    return apiKeys[provider];
  };

  const hasApiKey = (provider: ModelProvider): boolean => {
    return !!apiKeys[provider];
  };

  const checkApiKeyAvailability = (provider: ModelProvider): boolean => {
    const key = apiKeys[provider];
    return !!key && key.length > 0;
  };

  const updateApiKeys = (newKeys: ApiKeys) => {
    setApiKeys(newKeys);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newKeys));
  };

  return {
    apiKeys,
    getApiKey,
    hasApiKey,
    checkApiKeyAvailability,
    updateApiKeys
  };
};

export default useApiKeys; 