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

export default function SupportPage() {
  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  
  // `messages` holds the full conversation history. We initialize it with a friendly greeting.
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hi! I'm the Platform Support AI. How can I help you today? I can assist with finding your way around, explaining how mentorships work, or answering technical questions about the platform."
    }
  ]);
  
  // Tracks the current text inside the input box
  const [inputValue, setInputValue] = useState('');
  
  // Tracks if we are waiting for the AI to respond, used to disable the input/button
  const [isLoading, setIsLoading] = useState(false);

  // Reference to the bottom of the chat to auto-scroll when new messages arrive
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // AUTO-SCROLL EFFECT
  // ---------------------------------------------------------------------------
  // Every time the `messages` array changes, scroll the chat container to the bottom.
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
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
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden mt-4">
      
      {/* --- HEADER --- */}
      <div className="bg-slate-900 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Back Button (using history.back) */}
          <button onClick={() => window.history.back()} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-1.5 sm:gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Support AI
          </h1>
        </div>
      </div>

      {/* --- CHAT AREA --- */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-slate-50">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex gap-3 sm:gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className="flex-shrink-0">
                {isUser ? (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs sm:text-sm">
                    ME
                  </div>
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 shadow-sm text-sm sm:text-base ${
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
          <div className="flex gap-3 sm:gap-4 flex-row">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white opacity-50 animate-pulse">
               <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
               </svg>
            </div>
            <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-sm p-3 sm:p-4 shadow-sm flex items-center gap-1.5 sm:gap-2">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-300 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
      </div>

      {/* --- INPUT AREA --- */}
      <div className="bg-white p-3 sm:p-4 border-t border-slate-200 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder={isLoading ? "AI is thinking..." : "Ask a question about the platform..."}
            className="w-full bg-slate-50 border border-slate-300 rounded-full py-3 sm:py-4 pl-4 sm:pl-6 pr-14 sm:pr-16 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-1.5 sm:right-2 w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        <p className="text-center text-[10px] sm:text-xs text-slate-400 mt-2 sm:mt-3 px-2">
          Support AI provides general guidance. For account issues, contact an admin directly.
        </p>
      </div>
      
    </div>
  );
}
