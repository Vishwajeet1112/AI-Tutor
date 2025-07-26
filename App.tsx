
import React, { useRef, useEffect, useState } from 'react';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { MicButton } from './components/MicButton';
import { ChatBubble } from './components/ChatBubble';
import { LogoIcon } from './components/Icons';

const App: React.FC = () => {
  const {
    status,
    conversation,
    currentTranscript,
    error,
    isSupported,
    toggleListening,
    startConversation,
  } = useVoiceAssistant();
  
  const [sessionActive, setSessionActive] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  const handleStartSession = () => {
    if (!isSupported || error) return;
    setSessionActive(true);
    startConversation();
  };

  const getStatusMessage = (): string => {
    switch (status) {
      case 'idle':
        return 'Click the mic to speak.';
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Thinking...';
      case 'speaking':
        return 'Speaking...';
      default:
        return 'Welcome!';
    }
  };

  const getFooterErrorMessage = (): string => {
    if (!error) return '';
    if (error.includes('API Key')) {
        return 'Configuration Error: API key not found.';
    }
    if (error.includes('Microphone')) {
        return 'Error: Microphone permission denied.';
    }
    return 'Connection Error: Please try again.';
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans p-4">
      <header className="flex items-center justify-center p-4 border-b border-slate-700">
        <LogoIcon />
        <h1 className="text-2xl font-bold ml-3">AI English Tutor</h1>
      </header>
      
      {!sessionActive ? (
        <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <h2 className="text-3xl font-bold mb-3 text-slate-100">Ready to Practice Your English?</h2>
            <p className="text-lg text-slate-400 mb-8 max-w-md">
                Click the button below to start a voice conversation with Echo, your friendly AI tutor.
            </p>
            <button
                onClick={handleStartSession}
                disabled={!isSupported || status === 'processing' || !!error}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-full text-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-400 disabled:bg-slate-500 disabled:cursor-not-allowed shadow-xl"
            >
                {status === 'processing' ? 'Initializing...' : 'Start Lesson'}
            </button>
            {!isSupported && (
                <p className="text-red-400 mt-6">
                    Voice recognition is not supported on this browser. Please try Chrome or Edge.
                </p>
            )}
             {error && (
                 <div className="mt-8 p-4 bg-red-900/50 border border-red-700 rounded-lg max-w-xl text-left">
                    <h3 className="font-bold text-red-300 mb-2">Application Error</h3>
                    <p className="text-red-300/90 text-sm whitespace-pre-wrap">{error}</p>
                 </div>
            )}
        </main>
      ) : (
        <>
          <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
            {conversation.map((msg, index) => (
              <ChatBubble key={index} message={msg} />
            ))}
            {isSupported && status === 'listening' && currentTranscript && (
               <div className="flex justify-end">
                 <div className="bg-blue-600/50 text-white p-3 rounded-lg rounded-br-none max-w-xl animate-pulse">
                    <p className="italic">{currentTranscript}</p>
                 </div>
               </div>
            )}
          </main>

          <footer className="flex flex-col items-center justify-center p-4 space-y-4">
            <p className="text-lg text-slate-300 h-7 transition-opacity duration-300 text-center">
              {error && status !== 'processing' ? (
                  <span className="text-red-400">{getFooterErrorMessage()}</span>
              ) : (
                 isSupported ? getStatusMessage() : "Voice recognition is not supported in your browser."
              )}
            </p>
            {isSupported && (
                <MicButton
                    status={status}
                    onClick={toggleListening}
                />
            )}
          </footer>
        </>
      )}
    </div>
  );
};

export default App;
