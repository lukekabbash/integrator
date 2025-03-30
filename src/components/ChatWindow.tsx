import React, { useRef, useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  useTheme, 
  useMediaQuery,
  IconButton,
  Drawer,
  Stack
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
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
            bgcolor: 'background.paper',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            borderBottom: 1,
            borderColor: 'divider',
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
          height: '100vh',
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          mx: 'auto',
          maxWidth: isMobile ? '100%' : '1200px',
          width: '100%',
          pl: isMobile ? 0 : 2,
          pr: isMobile ? 0 : 2,
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
          }}
        >
          {/* Messages container */}
          <Box
            ref={messagesEndRef}
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              px: { xs: 1, sm: 2 },
              py: 2,
              scrollBehavior: 'smooth',
              '& > *': {
                mb: isMobile ? 1 : 2,
                maxWidth: '100%',
              }
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
                    isLatest={index === messages.length - 1}
                    onEditMessage={message.role === 'user' ? handleEditMessage : undefined}
                    onUpdateMessage={message.role === 'user' ? handleUpdateMessage : undefined}
                    isEditing={editingMessageId === message.id}
                  />
                ))}
                {isLoading && (
                  <ChatBubble 
                    message={{ 
                      id: 'loading', 
                      role: 'model', 
                      content: '...', 
                      timestamp: new Date() 
                    }} 
                    isLatest={true}
                  />
                )}
              </>
            )}
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
      {isMobile ? (
        <Drawer
          anchor="right"
          open={rightSidebarOpen}
          onClose={() => setRightSidebarOpen(false)}
          PaperProps={{
            sx: {
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
            onModelChange={(model) => {
              onModelChange(model);
              setRightSidebarOpen(false);
            }}
            onSystemPromptChange={(prompt) => {
              onSystemPromptChange(prompt);
              setRightSidebarOpen(false);
            }}
            onProviderChange={onProviderChange}
          />
        </Drawer>
      ) : (
        <RightSidebar
          modelName={modelName}
          provider={provider}
          systemPrompt={systemPrompt}
          onModelChange={onModelChange}
          onSystemPromptChange={onSystemPromptChange}
          onProviderChange={onProviderChange}
        />
      )}
    </Box>
  );
};

export default ChatWindow; 