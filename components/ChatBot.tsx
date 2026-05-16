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
      content: "Hey! I'm **FlowBot** ✨ — your personal finance AI. I can see all your real transactions, categories, and events. Ask me anything!",
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
      setTimeout(() => inputRef.current?.focus(), 350);
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
    setMessages((prev) => [...prev, { role: "user", content: trimmed, timestamp: new Date() }]);
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
        { role: "bot", content: data.response ?? data.error ?? "Sorry, something went wrong.", timestamp: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Connection error — please try again.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const renderText = (text: string) => {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i} className="text-[#4edea3] font-semibold">{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    );
  };

  return (
    <>
      {/* ── Mobile backdrop scrim ── */}
      <div
        onClick={() => setIsOpen(false)}
        className={`md:hidden fixed inset-0 z-[48] transition-all duration-500 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      />

      {/* ── Toggle Button — bottom right, both mobile & desktop ── */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        id="flowbot-toggle"
        aria-label="Open FlowBot"
        className={`fixed bottom-[88px] md:bottom-8 right-4 md:right-8 z-[49] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? "border border-[#4edea3]/30 rotate-0"
            : "border border-[#4edea3]/30 hover:scale-105"
        }`}
        style={{
          background: isOpen ? "rgba(53,52,54,0.9)" : "rgba(78,222,163,0.15)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: isOpen ? "none" : "0 0 32px rgba(78,222,163,0.3)",
          animation: isOpen ? "none" : "chatPulse 2.5s ease-in-out infinite",
        }}
      >
        <span className="material-symbols-outlined text-[26px] text-[#4edea3]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {isOpen ? "close" : "auto_awesome"}
        </span>
      </button>

      {/* ── Glass Chat Panel ── */}
      <div
        className={`fixed z-[49] flex flex-col overflow-hidden transition-all duration-500 ease-out
          top-[8%] left-4 right-4 bottom-[84px] rounded-[28px]
          md:top-auto md:bottom-28 md:left-auto md:right-8 md:w-[420px] md:h-[560px]
          ${isOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
        style={{
          background: "rgba(10, 15, 30, 0.78)",
          backdropFilter: "blur(60px) saturate(180%)",
          WebkitBackdropFilter: "blur(60px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 -8px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 0.5px rgba(255,255,255,0.04) inset",
        }}
      >
        {/* Top shine line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />


        {/* Header */}
        <div
          className="flex-shrink-0 flex items-center gap-3 px-5 py-4 border-b"
          style={{
            borderColor: "rgba(255,255,255,0.07)",
            background: "linear-gradient(to bottom, rgba(78,222,163,0.05), transparent)",
          }}
        >
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #4edea3, #00a572)",
              boxShadow: "0 0 20px rgba(78,222,163,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          >
            <span className="material-symbols-outlined text-[18px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-[Space_Grotesk] text-sm font-bold text-[#e4e2e4] tracking-wide leading-none">FlowBot</p>
            <p className="font-[Manrope] text-[10px] mt-0.5" style={{ color: "rgba(78,222,163,0.65)" }}>
              AI Finance Assistant · Gemini 2.5
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: "rgba(78,222,163,0.1)", border: "1px solid rgba(78,222,163,0.2)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"
              style={{ animation: "livePulse 2s ease-in-out infinite", boxShadow: "0 0 6px rgba(78,222,163,0.8)" }}
            />
            <span className="font-[Space_Grotesk] text-[9px] text-[#4edea3] uppercase tracking-[0.12em] font-bold">Live</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0" style={{ scrollbarWidth: "none" }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "bot" && (
                <div
                  className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
                  style={{ background: "rgba(78,222,163,0.12)", border: "1px solid rgba(78,222,163,0.2)" }}
                >
                  <span className="material-symbols-outlined text-[13px] text-[#4edea3]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    auto_awesome
                  </span>
                </div>
              )}
              <div
                className="max-w-[78%] px-4 py-2.5 text-sm font-[Manrope] leading-relaxed"
                style={msg.role === "user" ? {
                  background: "rgba(78,222,163,0.12)",
                  border: "1px solid rgba(78,222,163,0.2)",
                  borderRadius: "18px 18px 4px 18px",
                  color: "#e4e2e4",
                  boxShadow: "inset 0 1px 0 rgba(78,222,163,0.15)",
                } : {
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "18px 18px 18px 4px",
                  color: "#c6c6cd",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                {renderText(msg.content)}
                <p className="text-[9px] text-[#45464d] mt-1.5 text-right font-[Space_Grotesk]">
                  {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(78,222,163,0.12)", border: "1px solid rgba(78,222,163,0.2)" }}>
                <span className="material-symbols-outlined text-[13px] text-[#4edea3]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <div className="px-4 py-3 flex items-center gap-1.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px 18px 18px 4px" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          {showSuggestions && messages.length === 1 && (
            <div className="space-y-2 pt-1">
              <p className="text-[9px] font-[Space_Grotesk] font-bold text-[#45464d] uppercase tracking-[0.1em]">Try asking:</p>
              {SUGGESTED.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-[#909097] hover:text-[#4edea3] font-[Manrope] transition-all"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "14px",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(78,222,163,0.06)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(78,222,163,0.2)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="flex-shrink-0 p-4 border-t"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: "linear-gradient(to top, rgba(0,0,0,0.25), transparent)" }}
        >
          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5 transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}
          >
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
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#4edea3] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              style={{ background: "rgba(78,222,163,0.2)", border: "1px solid rgba(78,222,163,0.3)", boxShadow: "0 0 12px rgba(78,222,163,0.15)" }}
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </div>
          <p className="text-[9px] font-[Space_Grotesk] text-[#45464d] text-center mt-2 tracking-wide">
            Reads your real data · Powered by Gemini 2.5 Flash Lite
          </p>
        </div>

        {/* Bottom shine */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <style>{`
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 0 32px rgba(78,222,163,0.3); }
          50% { box-shadow: 0 0 55px rgba(78,222,163,0.55); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </>
  );
}
