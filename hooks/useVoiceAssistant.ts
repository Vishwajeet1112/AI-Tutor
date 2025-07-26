
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Message, AssistantStatus, SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '../types';
import { sendMessageToAI, startChatSession } from '../services/geminiService';
import type { Content } from '@google/genai';

// Polyfill for cross-browser compatibility
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const useVoiceAssistant = () => {
  const [status, setStatus] = useState<AssistantStatus>('idle');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Ref to hold the latest conversation state to avoid dependency issues in callbacks.
  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;

  const isSupported = !!SpeechRecognition;

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
        window.speechSynthesis.cancel();
        setCurrentTranscript('');
        try {
            recognition.start();
        } catch (e) {
            // "InvalidStateError" means it's already started, which is fine.
            if (!(e instanceof DOMException && e.name === 'InvalidStateError')) {
                console.error("Error starting recognition:", e);
                 if (e instanceof DOMException && e.name === 'NotAllowedError') {
                    setError("Microphone permission has not been granted.");
                }
            }
        }
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    
    utterance.onstart = () => {
        setStatus('speaking');
    };
    utterance.onend = () => {
        // After the assistant speaks, automatically start listening.
        startListening();
    };
    utterance.onerror = (event) => {
        console.error("SpeechSynthesis Error:", event.error);
        setError("Sorry, I couldn't speak the response.");
        setStatus('idle');
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [startListening]);

  const processSpeech = useCallback(async (text: string) => {
    if (!text.trim()) {
        setStatus('idle');
        return;
    };

    const userMessage: Message = { role: 'user', text };

    const history: Content[] = conversationRef.current.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    setConversation(prev => [...prev, userMessage]);
    setStatus('processing');
    setError(null);

    try {
        const aiResponseText = await sendMessageToAI(text, history);
        const assistantMessage: Message = { role: 'assistant', text: aiResponseText };
        setConversation(prev => [...prev, assistantMessage]);
        speak(aiResponseText);
    } catch (e) {
        console.error("Error processing speech:", e);
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError("An unknown error occurred while processing your request.");
        }
        setStatus('idle');
    }
  }, [speak]);

  // Effect for setting up SpeechRecognition and initial chat session
  useEffect(() => {
    if (!isSupported) {
      setError("Voice recognition is not supported in this browser.");
      return;
    }

    try {
        startChatSession([]); 
    } catch (e) {
        console.error("Initial chat session failed:", e);
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError("Could not initialize the AI assistant.");
        }
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false; 

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setCurrentTranscript(interimTranscript);
      if(finalTranscript) {
        processSpeech(finalTranscript.trim());
      }
    };
    
    recognition.onaudiostart = () => {
        setStatus('listening');
        setError(null);
    };

    recognition.onend = () => {
      setStatus(currentStatus => (currentStatus === 'listening' ? 'idle' : currentStatus));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        // Not a critical error, just silence. Go idle.
      } else if (event.error === 'not-allowed') {
        setError("Microphone permission is not granted.");
      } else {
        setError(`Speech Recognition Error: ${event.error}`);
      }
      setStatus('idle');
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      window.speechSynthesis.cancel();
    }
  }, [isSupported, processSpeech]);

  const startConversation = useCallback(async () => {
    if (conversationRef.current.length > 0) return;
    
    setStatus('processing');
    setError(null);
    try {
        const openingLine = await sendMessageToAI(
            "Start our English lesson. Greet me warmly as 'Echo', your AI English Tutor, and ask a simple, friendly opening question, like 'what did you do today?' or 'what's your favorite hobby?'. Keep it concise.",
            []
        );
        
        const assistantMessage: Message = { role: 'assistant', text: openingLine };
        setConversation([assistantMessage]);
        speak(openingLine);

    } catch (e) {
        console.error("Failed to start conversation:", e);
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError("An unknown error occurred while starting the conversation.");
        }
        setStatus('idle');
    }
  }, [speak]);

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    
    if (status === 'listening') {
      recognition.stop();
    } else {
      startListening();
    }
  };

  return { status, conversation, currentTranscript, error, isSupported, toggleListening, startConversation };
};
