'use client'; // Client Component because it manages chat state and user inputs

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { getAIResponse } from './actions';

/**
 * Message Interface
 * Represents a single message in the chat timeline.
 */
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function MatchmakerPage() {
  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  
  // Stores the entire conversation history. We initialize it with a greeting from the AI.
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI Matchmaker. Tell me a bit about what you want to learn, your current skill level, and any specific goals you have. I'll help pair you with the perfect mentor!"
    }
  ]);
  
  // Tracks the current text inside the input box
  const [inputValue, setInputValue] = useState('');
  
  // Tracks if we are waiting for the AI to respond, used to disable the input/button
  const [isLoading, setIsLoading] = useState(false);

  // Reference to the bottom of the chat to auto-scroll when new messages arrive
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // AUTO-SCROLL EFFECT
  // ---------------------------------------------------------------------------
  // Every time the `messages` array changes, scroll to the bottom smoothly.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ---------------------------------------------------------------------------
  // EVENT HANDLERS
  // ---------------------------------------------------------------------------
  
  /**
   * handleSendMessage
   * 
   * Triggered when the user clicks 'Send' or presses 'Enter'.
   * It pushes the user's message to local state and calls the separated Server Action.
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // 1. Create the new user message object
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim()
    };

    // 2. Append to UI immediately, lock input, clear box
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInputValue(''); 
    setIsLoading(true); 

    try {
      // 3. Call the separated AI Server Action from actions.ts
      // We pass the new message and the entire conversation history (mapped to standard roles)
      const historyContext = currentMessages.map(msg => ({ role: msg.role, content: msg.content }));
      
      const aiResponseText = await getAIResponse(userMessage.content, historyContext);
      
      // 4. Append AI response to UI
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponseText
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Failed to fetch AI response:", error);
      // Optional: Add error handling UI state here later
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER UI
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* --- HEADER --- */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <Link href="/user/search" className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Matchmaker
          </h1>
        </div>
        <div className="text-xs text-indigo-300 font-medium uppercase tracking-wider bg-indigo-900/50 px-3 py-1 rounded-full border border-indigo-700/50">
          Beta
        </div>
      </div>

      {/* --- CHAT AREA --- */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className="flex-shrink-0">
                {isUser ? (
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                    ME
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                isUser 
                  ? 'bg-blue-600 text-white rounded-tr-sm' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
              
            </div>
          );
        })}
        
        {/* Loading Indicator (Shown only when awaiting AI response) */}
        {isLoading && (
          <div className="flex gap-4 flex-row">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white opacity-50 animate-pulse">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
               </svg>
            </div>
            <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}

        {/* Invisible div to attach the scroll-to-bottom ref */}
        <div ref={messagesEndRef} />
      </div>

      {/* --- INPUT AREA --- */}
      <div className="bg-white p-4 border-t border-slate-200 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder={isLoading ? "AI is thinking..." : "Describe what you want to learn..."}
            className="w-full bg-slate-50 border border-slate-300 rounded-full py-4 pl-6 pr-16 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-3">
          AI Matchmaker can make mistakes. Verify mentor profiles before committing.
        </p>
      </div>
      
    </div>
  );
}
