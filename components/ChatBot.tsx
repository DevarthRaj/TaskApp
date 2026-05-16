"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

const SUGGESTED = [
  "How much did I spend this month?",
  "Which category costs me the most?",
  "How does this month compare to last?",
  "What's my biggest expense recently?",
  "Am I spending more than I earn?",
];

export default function ChatBot({ currentMonth }: { currentMonth?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content:
        "Hey! I'm **FlowBot** 👋 — your personal finance AI. I have access to all your transactions, categories, and events. Ask me anything about your money!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setShowSuggestions(false);
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed, timestamp: new Date() },
    ]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, context: { month: currentMonth } }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: data.response ?? data.error ?? "Sorry, something went wrong.",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "Connection error — please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Simple markdown-like bold renderer
  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <>
      {/* ── Floating Toggle Button ── */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        id="flowbot-toggle"
        aria-label="Open FlowBot"
        className={`fixed bottom-[88px] md:bottom-8 right-4 md:right-8 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_30px_rgba(78,222,163,0.35)] ${isOpen
          ? "bg-[#353436] border border-white/10 rotate-0"
          : "bg-[#4edea3]/20 border border-[#4edea3]/40 hover:bg-[#4edea3]/30 hover:shadow-[0_0_40px_rgba(78,222,163,0.5)]"
          }`}
        style={isOpen ? {} : { animation: "chatPulse 2.5s ease-in-out infinite" }}
      >
        <span className="material-symbols-outlined text-[26px] text-[#4edea3]" style={{ fontVariationSettings: isOpen ? "" : "'FILL' 1" }}>
          {isOpen ? "close" : "auto_awesome"}
        </span>
      </button>

      {/* ── Chat Panel ── */}
      <div
        className={`fixed z-50 flex flex-col transition-all duration-300 ease-out
          bottom-[168px] md:bottom-28 right-4 md:right-8
          w-[calc(100vw-32px)] md:w-[420px]
          max-h-[65vh] md:max-h-[540px]
          ${isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"}
          bg-[#0F172A]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden`}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-[#4edea3]/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4edea3] to-[#00a572] flex items-center justify-center shadow-[0_0_12px_rgba(78,222,163,0.4)]">
            <span className="material-symbols-outlined text-[16px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
          </div>
          <div>
            <p className="font-[Space_Grotesk] text-sm font-bold text-[#e4e2e4] leading-none">FlowBot</p>
            <p className="font-[Manrope] text-[10px] text-[#4edea3] mt-0.5">AI Finance Assistant · Powered by Gemini</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] shadow-[0_0_6px_rgba(78,222,163,0.8)]" />
            <span className="font-[Space_Grotesk] text-[9px] text-[#4edea3] uppercase tracking-[0.1em]">Live</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "bot" && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4edea3] to-[#00a572] flex-shrink-0 flex items-center justify-center mt-0.5 shadow-[0_0_8px_rgba(78,222,163,0.3)]">
                  <span className="material-symbols-outlined text-[11px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                    auto_awesome
                  </span>
                </div>
              )}
              <div
                className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm font-[Manrope] leading-relaxed ${msg.role === "user"
                  ? "bg-[#4edea3]/15 border border-[#4edea3]/20 text-[#e4e2e4] rounded-tr-sm"
                  : "bg-white/5 border border-white/5 text-[#c6c6cd] rounded-tl-sm"
                  }`}
              >
                {renderText(msg.content)}
                <p className="text-[9px] text-[#45464d] mt-1.5 text-right font-[Space_Grotesk]">
                  {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4edea3] to-[#00a572] flex-shrink-0 flex items-center justify-center shadow-[0_0_8px_rgba(78,222,163,0.3)]">
                <span className="material-symbols-outlined text-[11px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
              </div>
              <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          {/* Suggested questions */}
          {showSuggestions && messages.length === 1 && (
            <div className="space-y-2 pt-1">
              <p className="text-[9px] font-[Space_Grotesk] font-bold text-[#45464d] uppercase tracking-[0.1em] px-1">
                Try asking:
              </p>
              {SUGGESTED.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="w-full text-left px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-[#4edea3]/5 hover:border-[#4edea3]/20 transition-all text-xs text-[#909097] hover:text-[#4edea3] font-[Manrope]"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 p-3 border-t border-white/10 bg-[#131315]/50">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#4edea3]/30 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your finances…"
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-[#e4e2e4] font-[Manrope] placeholder-[#45464d] outline-none disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-lg bg-[#4edea3]/20 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3] hover:bg-[#4edea3]/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                send
              </span>
            </button>
          </div>
          <p className="text-[9px] font-[Space_Grotesk] text-[#45464d] text-center mt-2 tracking-wide">
            Reads your real data · Powered by Gemini 2.5 Flash Lite
          </p>
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(78,222,163,0.35); }
          50% { box-shadow: 0 0 50px rgba(78,222,163,0.6); }
        }
      `}</style>
    </>
  );
}
