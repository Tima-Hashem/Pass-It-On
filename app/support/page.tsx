'use client';

/**
 * Support AI Client Page
 * 
 * Interactive 24/7 Platform Concierge & Support Agent for PassItOn.
 * 
 * Features:
 * - Direct grounding in platform policies, Pay-It-Forward rules, and project submission guidelines.
 * - Quick FAQ topic starter chips for 1-tap questions.
 * - Deep navigation links directly in the message flow when relevant.
 * - Full conversation turn history with reactive loading indicators.
 * - Complies with React 19 rules (pure render, no Date.now in render).
 */

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { getSupportAIResponse, type SupportResponse } from './actions';
import {
  HelpCircle,
  ArrowLeft,
  Send,
  BookOpen,
  CheckCircle,
  ExternalLink,
  LifeBuoy,
} from 'lucide-react';

interface SupportMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedLinks?: { label: string; href: string }[];
}

const FAQ_STARTERS = [
  'How does the Pay-It-Forward mentorship model work?',
  'How do I submit my project code for mentor review?',
  'What are the requirements for earning a certificate?',
  'What happens if I owe mentorships to the community?',
];

export default function SupportPage() {
  // Conversation timeline state
  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: 'init-support-1',
      role: 'assistant',
      content:
        "Hi! I'm your PassItOn Platform Support AI. How can I assist you today? I can guide you through mentorship rules, project submissions, workspace milestones, or finding the right mentors.",
      suggestedLinks: [
        { label: 'My Dashboard', href: '/user/dashboard' },
        { label: 'AI Matchmaker', href: '/user/matchmaker' },
      ],
    },
  ]);

  // Input & state controls
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll ref and message counter for unique IDs without impure render calls
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const msgCounterRef = useRef(1);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  /**
   * Submits user message to the server-side Support AI
   */
  const submitMessage = async (textToSend: string) => {
  if (!textToSend.trim() || isLoading) return;

  msgCounterRef.current += 1;

  const userMessage: SupportMessage = {
    id: `support-user-${msgCounterRef.current}`,
    role: 'user',
    content: textToSend.trim(),
  };

  const currentMessages = [...messages, userMessage];

  setMessages(currentMessages);
  setInputValue('');
  setIsLoading(true);

  msgCounterRef.current += 1;

  const aiMessageId = `support-ai-${msgCounterRef.current}`;

  setMessages((prev) => [
    ...prev,
    {
      id: aiMessageId,
      role: 'assistant',
      content: '',
    },
  ]);

  try {
    const historyContext = currentMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await fetch('/api/support', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage: userMessage.content,
        messageHistory: historyContext,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error('Support AI streaming request failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    let accumulatedText = '';
    let suggestedLinks: { label: string; href: string }[] = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        const lines = event.split('\n');

        let eventType = 'message';
        let data = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          }

          if (line.startsWith('data: ')) {
            data += line.slice(6);
          }
        }

        if (!data) continue;

        const parsed = JSON.parse(data);

        if (eventType === 'links') {
          if (Array.isArray(parsed)) {
            suggestedLinks = parsed;
          }
          continue;
        }

        if (typeof parsed === 'string') {
          accumulatedText += parsed;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    content: accumulatedText,
                  }
                : msg
            )
          );
        }
      }
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === aiMessageId
          ? {
              ...msg,
              content:
                accumulatedText ||
                'I am here to assist you with any questions about PassItOn!',
              suggestedLinks,
            }
          : msg
      )
    );
  } catch (error) {
    console.error(
      'Failed to fetch streaming support AI response:',
      error
    );

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === aiMessageId
          ? {
              ...msg,
              content:
                'I ran into an issue retrieving the latest platform documentation. Please check your Dashboard or try asking again!',
            }
          : msg
      )
    );
  } finally {
    setIsLoading(false);
  }
};

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage(inputValue);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Header Bar */}
      <div className="bg-slate-900 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/user/dashboard"
            id="back-to-dashboard-btn"
            className="text-slate-400 hover:text-white transition-colors p-1 -ml-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-indigo-400" />
              Platform Support AI
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              24/7 intelligent assistance for mentorship workflows, submissions, and platform rules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/user/matchmaker"
            className="text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Looking for a Mentor?
          </Link>
        </div>
      </div>

      {/* Messages Timeline */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar Icon */}
              <div className="flex-shrink-0">
                {isUser ? (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-800 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                    YOU
                  </div>
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Message Bubble + Suggested Quick Navigation */}
              <div
                className={`space-y-2.5 max-w-[85%] sm:max-w-[80%] ${
                  isUser ? 'items-end text-right' : 'items-start'
                }`}
              >
                <div
                  className={`rounded-2xl p-4 shadow-xs text-sm sm:text-base leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs text-left'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  {!isUser && isLoading && msg.id === messages[messages.length - 1]?.id && (
  <div className="mb-2 text-sm text-gray-500 animate-pulse">
    PassItOn AI is responding…
  </div>
)}
                  <div className="max-w-none">
  <ReactMarkdown>{msg.content}</ReactMarkdown>
</div>
                </div>

                {/* Helpful Navigation Badges */}
                {msg.suggestedLinks && msg.suggestedLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {msg.suggestedLinks.map((link, idx) => (
                      <Link
                        key={idx}
                        href={link.href}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{link.label}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 sm:gap-4 flex-row items-center">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center opacity-70 animate-pulse">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-xs p-3.5 shadow-xs flex items-center gap-2 text-xs font-medium">
              <span>Checking platform knowledge</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Starter Suggestions & Input Form */}
      <div className="bg-white border-t border-slate-200 p-3 sm:p-4 space-y-3 flex-shrink-0">
        {/* Quick FAQ Starter chips */}
        {messages.length <= 3 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 flex-shrink-0">
              <BookOpen className="w-3 h-3" /> Popular Topics:
            </span>
            {FAQ_STARTERS.map((starter, i) => (
              <button
                key={i}
                type="button"
                onClick={() => submitMessage(starter)}
                disabled={isLoading}
                className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-3 py-1 rounded-full whitespace-nowrap transition-colors border border-slate-200 hover:border-indigo-200 disabled:opacity-50 cursor-pointer"
              >
                {starter}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input
            id="support-user-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder={isLoading ? "Analyzing your question..." : "Ask anything about PassItOn, submissions, or rules..."}
            className="w-full bg-slate-50 border border-slate-300 rounded-full py-3 sm:py-3.5 pl-4 sm:pl-6 pr-14 sm:pr-16 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
          />
          <button
            id="support-send-btn"
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-1.5 sm:right-2 w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-400">
          Support AI is available 24/7 to answer questions and guide your learning journey.
        </p>
      </div>
    </div>
  );
}
