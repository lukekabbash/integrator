import React, { useRef, useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  useTheme, 
  useMediaQuery,
  IconButton,
  Drawer
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import { Message, ChatSession, ModelProvider, SystemPrompt } from '../types/chat';
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
  temperature: number;
  maxOutputTokens: number;
  systemPrompts: SystemPrompt[];
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  onModelChange: (modelId: string) => void;
  onProviderChange: (provider: ModelProvider) => void;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (sessionId: string) => void;
  onSystemPromptChange: (prompt: string) => void;
  onSystemPromptsChange: (prompts: SystemPrompt[]) => void;
  onBranchSession: (sessionId: string, messageId: string) => ChatSession | null;
  onUpdateMessage?: (messageId: string, content: string) => void;
  onRegenerateFromMessage?: (messageId: string, content: string) => void;
  onTemperatureChange: (value: number) => void;
  onMaxOutputTokensChange: (value: number) => void;
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
  temperature,
  maxOutputTokens,
  systemPrompts,
  onSendMessage,
  onClearChat,
  onModelChange,
  onProviderChange,
  onSessionSelect,
  onNewChat,
  onDeleteChat,
  onSystemPromptChange,
  onSystemPromptsChange,
  onBranchSession,
  onUpdateMessage,
  onRegenerateFromMessage,
  onTemperatureChange,
  onMaxOutputTokensChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editMessageText, setEditMessageText] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [inputHeight, setInputHeight] = useState(0);

  // Scroll to bottom whenever messages change or during loading
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };

    scrollToBottom();

    // Set up an interval during streaming to keep scrolling
    let scrollInterval: NodeJS.Timeout | null = null;
    if (isLoading) {
      scrollInterval = setInterval(scrollToBottom, 100);
    }

    return () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
      }
    };
  }, [messages, isLoading]);

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
      onRegenerateFromMessage(messageId, newContent);
    } else if (onUpdateMessage) {
      onUpdateMessage(messageId, newContent);
    }
  };

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle sending messages and ensure scroll
  const handleSendMessage = (message: string) => {
    onSendMessage(message);
    // Immediate scroll when sending
    setTimeout(scrollToBottom, 50);
  };

  const handleInputHeightChange = (height: number) => {
    setInputHeight(height);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Mobile Header */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '56px',
            bgcolor: 'background.default',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            borderBottom: 0,
          }}
        >
          <IconButton onClick={() => setLeftSidebarOpen(true)} size="small">
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            {activeSession?.title || 'New Chat'}
          </Typography>
          <IconButton onClick={() => setRightSidebarOpen(true)} size="small">
            <SettingsIcon />
          </IconButton>
        </Box>
      )}

      {/* Left Sidebar - Chat History */}
      {isMobile ? (
        <Drawer
          anchor="left"
          open={leftSidebarOpen}
          onClose={() => setLeftSidebarOpen(false)}
          PaperProps={{
            sx: {
              width: '100%',
              maxWidth: '320px',
              bgcolor: 'background.paper',
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
            <IconButton onClick={() => setLeftSidebarOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <LeftSidebar 
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSessionSelect={(id) => {
              onSessionSelect(id);
              setLeftSidebarOpen(false);
            }}
            onNewChat={() => {
              onNewChat();
              setLeftSidebarOpen(false);
            }}
            onDeleteChat={onDeleteChat}
          />
        </Drawer>
      ) : (
        <LeftSidebar 
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSessionSelect={onSessionSelect}
          onNewChat={onNewChat}
          onDeleteChat={onDeleteChat}
        />
      )}

      {/* Main Chat Area */}
      <Box
        sx={{ 
          flexGrow: 1, 
          height: isMobile ? 'calc(100vh - 56px)' : '100vh',
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          mx: 'auto',
          maxWidth: isMobile ? '100%' : '875px',
          width: '100%',
          pl: 0,
          pr: 0,
          pt: isMobile ? '56px' : 0,
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
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Title bar with improved gradients */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '48px',
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'transparent',
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                bgcolor: '#202123',
                borderRadius: '20px',
                px: 4,
                py: 1.5,
                minWidth: 'auto',
                maxWidth: '90%',
              }}
            >
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: '#fff',
                  fontWeight: 500,
                  textAlign: 'center',
                  opacity: 0.9,
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
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
              overflow: 'auto',
              position: 'relative',
              pb: isMobile ? '80px' : 0, // Fixed padding for mobile input
              scrollbarWidth: 'thin',
              scrollbarColor: '#444654 transparent',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              height: '100%',
              maxHeight: '100%',
              '&::-webkit-scrollbar': {
                width: '8px',
                position: 'absolute',
                right: 0,
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
                border: 'none',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#444654',
                borderRadius: '10px',
                border: '2px solid transparent',
                backgroundClip: 'content-box',
                '&:hover': {
                  background: '#545567',
                },
              },
              boxSizing: 'border-box',
            }}
          >
            <Box sx={{ 
              px: { xs: 1, sm: 4 },
              py: 2, 
              position: 'relative',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              {messages.length === 0 ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: 0.7,
                    gap: isMobile ? 1 : 2,
                  }}
                >
                  <Box>
                    <Box
                      component="img"
                      src="/INT LOGO2.png"
                      alt="AI Integrator Logo"
                      sx={{ 
                        width: isMobile ? '80px' : '120px',
                        height: 'auto',
                        opacity: 0.7
                      }}
                    />
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    Start a conversation with AI Integrator
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      maxWidth: '80%', 
                      textAlign: 'center',
                      fontSize: isMobile ? '0.875rem' : '1rem'
                    }}
                  >
                    Your models, your way.
                  </Typography>
                </Box>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <ChatBubble 
                      key={message.id}
                      message={message}
                      isLatest={index === messages.length - 1 && !isLoading}
                      onEditMessage={message.role === 'user' ? handleEditMessage : undefined}
                      onUpdateMessage={message.role === 'user' ? handleUpdateMessage : undefined}
                      isEditing={editingMessageId === message.id}
                    />
                  ))}
                  {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                    <ChatBubble 
                      message={{ 
                        id: 'loading', 
                        role: 'model', 
                        content: '', 
                        timestamp: new Date(),
                        isLoading: true
                      }} 
                      isLatest={true}
                    />
                  )}
                </>
              )}
            </Box>
          </Box>

          {/* Input area */}
          <Box 
            sx={{ 
              position: 'relative',
              zIndex: 2,
              py: isMobile ? 0.5 : 1,
              px: { xs: 1, sm: 2 },
              background: 'transparent',
              width: '100%',
            }}
          >
            <ChatInput 
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onClearChat={onClearChat}
              initialMessage={editMessageText}
              isEditing={isEditing}
              onHeightChange={handleInputHeightChange}
            />
          </Box>
        </Paper>
      </Box>

      {/* Right Sidebar - Settings */}
      {isMobile ? (
        <Drawer
          anchor="right"
          open={rightSidebarOpen}
          onClose={() => setRightSidebarOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: '100%',
              maxWidth: '320px',
              bgcolor: 'background.paper',
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
            <IconButton onClick={() => setRightSidebarOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <RightSidebar
            modelName={modelName}
            provider={provider}
            systemPrompt={systemPrompt}
            temperature={temperature}
            maxOutputTokens={maxOutputTokens}
            systemPrompts={systemPrompts}
            onModelChange={(model) => {
              onModelChange(model);
              setRightSidebarOpen(false);
            }}
            onSystemPromptChange={(prompt) => {
              onSystemPromptChange(prompt);
              setRightSidebarOpen(false);
            }}
            onSystemPromptsChange={onSystemPromptsChange}
            onProviderChange={onProviderChange}
            onTemperatureChange={onTemperatureChange}
            onMaxOutputTokensChange={onMaxOutputTokensChange}
          />
        </Drawer>
      ) : (
        <RightSidebar
          modelName={modelName}
          provider={provider}
          systemPrompt={systemPrompt}
          temperature={temperature}
          maxOutputTokens={maxOutputTokens}
          systemPrompts={systemPrompts}
          onModelChange={onModelChange}
          onSystemPromptChange={onSystemPromptChange}
          onSystemPromptsChange={onSystemPromptsChange}
          onProviderChange={onProviderChange}
          onTemperatureChange={onTemperatureChange}
          onMaxOutputTokensChange={onMaxOutputTokensChange}
        />
      )}
    </Box>
  );
};

export default ChatWindow; 