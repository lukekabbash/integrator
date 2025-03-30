import React from 'react';
import { Box } from '@mui/material';
import Layout from './components/Layout';
import ChatWindow from './components/ChatWindow';
import useChat from './hooks/useChat';

function App() {
  const { 
    sessions,
    activeSession,
    activeSessionId,
    messages, 
    isLoading, 
    modelName,
    selectedProvider,
    systemPrompt,
    sendMessage, 
    clearChat,
    changeModel,
    changeProvider,
    createNewSession,
    deleteSession,
    selectSession,
    updateSystemPrompt,
    branchSession,
    updateMessage,
    regenerateFromMessage
  } = useChat();

  return (
    <Layout>
      <Box 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%',
          position: 'relative'
        }}
      >
        <ChatWindow
          sessions={sessions}
          activeSession={activeSession}
          activeSessionId={activeSessionId}
          messages={messages}
          isLoading={isLoading}
          modelName={modelName}
          provider={selectedProvider}
          systemPrompt={systemPrompt}
          onSendMessage={sendMessage}
          onClearChat={clearChat}
          onModelChange={changeModel}
          onProviderChange={changeProvider}
          onSessionSelect={selectSession}
          onNewChat={createNewSession}
          onDeleteChat={deleteSession}
          onSystemPromptChange={updateSystemPrompt}
          onBranchSession={branchSession}
          onUpdateMessage={updateMessage}
          onRegenerateFromMessage={regenerateFromMessage}
        />
      </Box>
    </Layout>
  );
}

export default App;
