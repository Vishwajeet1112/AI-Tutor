
import React from 'react';
import type { Message } from '../types';
import { UserIcon, AssistantIcon } from './Icons';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const bubbleClasses = isUser
    ? 'bg-blue-600 rounded-br-none'
    : 'bg-slate-700 rounded-bl-none';

  const containerClasses = isUser ? 'justify-end' : 'justify-start';

  return (
    <div className={`flex items-end gap-3 ${containerClasses}`}>
       {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
            <AssistantIcon />
        </div>
      )}
      <div className={`text-white p-4 rounded-xl max-w-lg md:max-w-xl shadow-md ${bubbleClasses}`}>
        <p className="text-base">{message.text}</p>
      </div>
       {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
            <UserIcon />
        </div>
      )}
    </div>
  );
};
