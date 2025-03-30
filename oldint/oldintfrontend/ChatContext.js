import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const AIContext = createContext();

export function AIProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (content, provider, model, options) => {
    setIsLoading(true);
    setError(null);

    const newMessage = { role: 'user', content };
    setMessages(prev => [...prev, newMessage]);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          model,
          messages: [...messages, newMessage],
          options,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body.getReader();
      let assistantMessage = { role: 'assistant', content: '' };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (!data.done) {
              assistantMessage.content += data.content;
              setMessages(prev => [
                ...prev.slice(0, -1),
                newMessage,
                { ...assistantMessage }
              ]);
            }
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return (
    <AIContext.Provider value={{
      messages,
      isLoading,
      error,
      sendMessage,
      setMessages,
    }}>
      {children}
    </AIContext.Provider>
  );
}

export const useAI = () => useContext(AIContext); 