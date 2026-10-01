import React, { useState, useEffect, useRef } from 'react';
import { customerAPI } from '../services/api';
import { MessageSquare, X, Send, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', parts: ['Hello! I am your AI Financial Assistant. How can I help you manage your budget, analyze your transactions, or build your savings today?'] }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto Scroll
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async (e, textMessage = null) => {
    if (e) e.preventDefault();
    const query = textMessage || input;
    if (!query.trim()) return;

    // Append User Message
    const updatedMessages = [...messages, { role: 'user', parts: [query] }];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await customerAPI.chat(query);
      setMessages([...updatedMessages, { role: 'model', parts: [response.data.response] }]);
    } catch (err) {
      console.error(err);
      setMessages([...updatedMessages, { 
        role: 'model', 
        parts: ['Sorry, I had trouble reaching the core banking server. Please try again in a few moments.'] 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickChips = [
    "How can I save money?",
    "Explain the 50/30/20 rule",
    "What are your interest rates?",
    "How do I spot fraud?"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center gap-2 glow-teal border border-teal-400/20"
        >
          <MessageSquare className="w-6 h-6 animate-pulse" />
          <span className="text-xs font-semibold pr-1">Ask Assistant</span>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="w-[380px] h-[520px] rounded-2xl glass-panel flex flex-flow flex-col border border-slate-700 shadow-2xl overflow-hidden flex flex-col justify-between">
          {/* Header */}
          <div className="bg-slate-800/80 px-4 py-3.5 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <div>
                <h3 className="text-sm font-bold text-white">AI Financial Assistant</h3>
                <span className="text-[10px] text-teal-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3 h-3" /> Online & Secure
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Ledger */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-900/40">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-teal-700 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                  }`}
                >
                  {msg.parts[0]}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-teal-400 rounded-2xl rounded-bl-none px-4 py-3 text-xs border border-slate-700 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  Analyzing...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestion Chips (Only show when not loading) */}
          {!loading && messages.length <= 2 && (
            <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800 flex flex-wrap gap-1.5">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleSend(e, chip)}
                  className="text-[10px] text-teal-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-600 rounded-full px-2.5 py-1 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => handleSend(e)}
            className="p-3 bg-slate-800/90 border-t border-slate-700 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about savings, budgeting, etc."
              disabled={loading}
              className="flex-1 bg-slate-900 text-xs text-white placeholder-slate-500 rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-teal-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
