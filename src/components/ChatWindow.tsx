import React, { useRef, useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  useTheme, 
  Divider, 
  Switch, 
  FormControlLabel,
  Tooltip,
  Stack
} from '@mui/material';
import { Message, ChatSession, ModelProvider } from '../types/chat';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

interface ChatWindowProps {
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  activeSessionId: string | null;
  messages: Message[];
  isLoading: boolean;
  modelName: string;
  provider: ModelProvider;
  systemPrompt: string;
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  onModelChange: (modelId: string) => void;
  onProviderChange: (provider: ModelProvider) => void;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (sessionId: string) => void;
  onSystemPromptChange: (prompt: string) => void;
  onBranchSession: (sessionId: string, messageId: string) => ChatSession | null;
  onUpdateMessage?: (messageId: string, content: string) => void;
  onRegenerateFromMessage?: (messageId: string, content: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  sessions,
  activeSession,
  activeSessionId,
  messages,
  isLoading,
  modelName,
  provider,
  systemPrompt,
  onSendMessage,
  onClearChat,
  onModelChange,
  onProviderChange,
  onSessionSelect,
  onNewChat,
  onDeleteChat,
  onSystemPromptChange,
  onBranchSession,
  onUpdateMessage,
  onRegenerateFromMessage
}) => {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editMessageText, setEditMessageText] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleEditMessage = (messageId: string, content: string, branch: boolean) => {
    // If branching, create a new session with the same content up to the selected message
    if (branch && activeSession && activeSessionId) {
      // Use the branchSession function to create a new session with history
      const branchedSession = onBranchSession(activeSessionId, messageId);
      if (branchedSession) {
        // Put the current message content in the input to be sent in the new session
        setEditMessageText(content);
        setIsEditing(true);
        setEditingMessageId(messageId);
      }
    } else {
      // Regular edit - just put the message in the input
      setEditMessageText(content);
      setIsEditing(true);
      setEditingMessageId(messageId);
    }
  };

  // Clear editing state after sending a message
  useEffect(() => {
    if (isEditing && !isLoading) {
      setIsEditing(false);
      setEditMessageText('');
      setEditingMessageId(null);
    }
  }, [isLoading, isEditing]);

  // When a message is updated directly in the bubble, we need to trigger a regeneration of the AI response
  const handleUpdateMessage = (messageId: string, newContent: string) => {
    if (onRegenerateFromMessage) {
      // Use the regenerateFromMessage function to update and regenerate responses
      onRegenerateFromMessage(messageId, newContent);
    } else if (onUpdateMessage) {
      // Fall back to just updating the message if regeneration is not available
      onUpdateMessage(messageId, newContent);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Left Sidebar - Chat History */}
      <LeftSidebar 
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={onSessionSelect}
        onNewChat={onNewChat}
        onDeleteChat={onDeleteChat}
      />

      {/* Main Chat Area */}
      <Box
        sx={{ 
          flexGrow: 1, 
          height: '100vh',
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          mx: 'auto',
          maxWidth: '1200px',
          width: '100%',
          pl: { xs: 2, md: 4 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            borderRadius: 0,
            bgcolor: 'background.default',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top gradient overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '210px',
              background: (theme) => `linear-gradient(to bottom, ${theme.palette.background.default} 30%, transparent)`,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* Bottom gradient overlay */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '160px',
              background: (theme) => `linear-gradient(to top, ${theme.palette.background.default} 30%, transparent)`,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* Header */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              py: 1,
              display: 'flex',
              justifyContent: 'center',
              background: 'transparent',
            }}
          >
            <Box
              sx={{
                py: 1.5,
                px: 2.5,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgb(32, 32, 32)',
                borderRadius: '8px',
                maxWidth: 'min(400px, 80%)',
              }}
            >
              <Typography 
                variant="h6" 
                fontWeight="medium" 
                color="text.primary"
                sx={{
                  fontSize: '1.1rem',
                  letterSpacing: '0.01em',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'center',
                  wordBreak: 'break-word',
                }}
              >
                {activeSession?.title || 'New Chat'}
              </Typography>
            </Box>
          </Box>

          {/* Messages container */}
          <Box
            ref={messagesEndRef}
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              position: 'relative',
              pt: '210px',
              mt: '-210px',
            }}
          >
            {messages.length === 0 ? (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: 0.7,
                  gap: 2,
                }}
              >
                <Box>
                  <Typography 
                    variant="h2" 
                    color="text.primary" 
                    sx={{ fontSize: '5rem', opacity: 0.7 }}
                  >
                    G
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  Start a conversation with Gemini AI
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '80%', textAlign: 'center' }}>
                  Ask me anything about code, math, science, or general knowledge. I'm powered by Gemini models.
                </Typography>
              </Box>
            ) : (
              <>
                {messages.map((message, index) => (
                  <ChatBubble 
                    key={message.id}
                    message={message}
                    isLatest={index === messages.length - 1}
                    onEditMessage={message.role === 'user' ? handleEditMessage : undefined}
                    onUpdateMessage={message.role === 'user' ? handleUpdateMessage : undefined}
                    isEditing={editingMessageId === message.id}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </Box>

          {/* Input area */}
          <Box 
            sx={{ 
              position: 'relative',
              zIndex: 2,
              py: 1,
              px: 2,
              background: 'transparent',
            }}
          >
            <ChatInput 
              onSendMessage={onSendMessage}
              isLoading={isLoading}
              onClearChat={onClearChat}
              initialMessage={editMessageText}
              isEditing={isEditing}
            />
          </Box>
        </Paper>
      </Box>

      {/* Right Sidebar - Settings */}
      <RightSidebar
        modelName={modelName}
        provider={provider}
        systemPrompt={systemPrompt}
        onModelChange={onModelChange}
        onSystemPromptChange={onSystemPromptChange}
        onProviderChange={onProviderChange}
      />
    </Box>
  );
};

export default ChatWindow; 