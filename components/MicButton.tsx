
import React from 'react';
import type { AssistantStatus } from '../types';
import { MicIcon, SpinnerIcon } from './Icons';

interface MicButtonProps {
  status: AssistantStatus;
  onClick: () => void;
}

export const MicButton: React.FC<MicButtonProps> = ({ status, onClick }) => {
  const isListening = status === 'listening';
  const isProcessing = status === 'processing';
  const isSpeaking = status === 'speaking';
  const isIdle = status === 'idle';

  const baseClasses = "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out transform focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-lg";
  
  const stateClasses = {
    idle: "bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-400",
    listening: "bg-red-600 text-white scale-110 focus:ring-red-400",
    processing: "bg-slate-600 text-white cursor-not-allowed focus:ring-slate-500",
    speaking: "bg-teal-600 text-white cursor-not-allowed focus:ring-teal-500",
  };

  return (
    <button
      onClick={onClick}
      disabled={isProcessing || isSpeaking}
      className={`${baseClasses} ${stateClasses[status]}`}
      aria-label={isListening ? 'Stop listening' : 'Start listening'}
    >
      {isListening && <div className="absolute inset-0 rounded-full bg-red-500 animate-ping"></div>}
      
      <div className="relative z-10">
        {isProcessing ? <SpinnerIcon /> : <MicIcon />}
      </div>
    </button>
  );
};
