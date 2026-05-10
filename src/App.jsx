import React, { useState, useRef, useEffect } from "react";

const FILE_COLOR = {
  "Plans-Overview.md": "bg-blue-100 text-blue-800",
  "Coverage-Details.md": "bg-green-100 text-green-800",
  "Pricing.md": "bg-yellow-100 text-yellow-800",
  "Eligibility.md": "bg-purple-100 text-purple-800",
  "Exclusions-Limitations.md": "bg-red-100 text-red-800",
  "FAQs.md": "bg-orange-100 text-orange-800",
};

const FILE_LABEL = {
  "Plans-Overview.md": "Plans Overview",
  "Coverage-Details.md": "Coverage Details",
  "Pricing.md": "Pricing",
  "Eligibility.md": "Eligibility",
  "Exclusions-Limitations.md": "Exclusions & Limitations",
  "FAQs.md": "FAQs",
};

const SAMPLE_QUESTIONS = [
  "What county is the member in?",
  "Do you have the plan name or H-number?",
  "Does the member have Medicaid?",
  "Does the member have a chronic condition?",
  "What are the co-pays for specialist visits?",
  "What is the plan's deductible and out-of-pocket max?",
  "What prescription drugs are covered?",
  "Is this member eligible for a dual-eligible plan?",
];

function SourceChip({ source }) {
  const colorClass = FILE_COLOR[source.file] || "bg-gray-100 text-gray-800";
  const label = FILE_LABEL[source.file] || source.label || source.file;
  return (
    <details className="border border-gray-200 rounded-lg bg-white text-sm">
      <summary className={`cursor-pointer px-3 py-2 rounded-lg flex items-center gap-2 select-none`}>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>{label}</span>
        {source.excerpt && <span className="text-gray-400 text-xs truncate max-w-xs">{source.excerpt.slice(0, 60)}…</span>}
      </summary>
      {source.excerpt && (
        <p className="px-3 pb-3 pt-1 text-xs text-gray-600 italic leading-relaxed border-t border-gray-100 mt-1">
          &ldquo;{source.excerpt}&rdquo;
        </p>
      )}
    </details>
  );
}

function AssistantBubble({ content, sources }) {
  return (
    <div className="flex gap-3 items-start animate-fadeIn">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shadow-sm">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="flex-1 space-y-2 max-w-[85%]">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        {sources && sources.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-gray-400 font-medium px-1">Sources</p>
            {sources.map((src, i) => <SourceChip key={i} source={src} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function UserBubble({ content }) {
  return (
    <div className="flex justify-end animate-fadeIn">
      <div className="bg-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm max-w-[85%]">
        <p className="text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 items-start animate-fadeIn">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shadow-sm">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm the Aetna Missouri Medicare Assistant. I help with Aetna's 34 Missouri Medicare plans — premiums, coverage, co-pays, deductibles, eligibility, and more.\n\nTo give you the most accurate answer, I'll always verify the plan first. Please have the member's:\n• Plan name or H-number (e.g. H2663-021)\n• County of residence\n• Whether they have Medicaid\n\nWhat would you like to know?",
      sources: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(e) {
    e?.preventDefault();
    const content = input.trim();
    if (!content || loading) return;

    const userMessage = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const apiMessages = newMessages
        .filter((m) => m.role !== "assistant" || messages.indexOf(m) > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ask-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources || [] },
      ]);
    } catch (err) {
      setError(err.message || "Failed to get an answer. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleReset() {
    setMessages([
      {
        role: "assistant",
        content: "Hi! I'm the Aetna Missouri Medicare Assistant. I help with Aetna's 34 Missouri Medicare plans — premiums, coverage, co-pays, deductibles, eligibility, and more.\n\nTo give you the most accurate answer, I'll always verify the plan first. Please have the member's:\n• Plan name or H-number (e.g. H2663-021)\n• County of residence\n• Whether they have Medicaid\n\nWhat would you like to know?",
        sources: [],
      },
    ]);
    setInput("");
    setError(null);
  }

  function handleSample(q) {
    setInput(q);
    textareaRef.current?.focus();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">Aetna Missouri Medicare Assistant</h1>
            <p className="text-xs text-gray-500">34 Missouri Medicare plans · Answers from official documents</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-gray-500 hover:text-purple-600 border border-gray-200 hover:border-purple-300 px-3 py-1.5 rounded-lg transition-colors"
        >
          New chat
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-5">
          {messages.map((msg, i) =>
            msg.role === "user" ? (
              <UserBubble key={i} content={msg.content} />
            ) : (
              <AssistantBubble key={i} content={msg.content} sources={msg.sources} />
            )
          )}
          {loading && <TypingIndicator />}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 sticky bottom-0">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Sample questions — only show at start */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSample(q)}
                  className="text-xs bg-gray-50 hover:bg-purple-50 hover:text-purple-700 text-gray-600 border border-gray-200 hover:border-purple-200 px-3 py-1.5 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question…"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm leading-relaxed"
              style={{ maxHeight: "120px", overflowY: "auto" }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-11 h-11 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400">
            Enter to send · Shift+Enter for newline · For enrollment help call{" "}
            <a href="tel:18008237734" className="underline hover:text-gray-600">1-800-Medicare</a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
      `}</style>
    </div>
  );
}
