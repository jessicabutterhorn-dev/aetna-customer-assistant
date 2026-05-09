import React, { useState, useRef } from "react";

const FILE_LABEL = {
  "Plans-Overview.md": "Plans Overview",
  "Coverage-Details.md": "Coverage Details",
  "Pricing.md": "Pricing",
  "Eligibility.md": "Eligibility",
  "Exclusions-Limitations.md": "Exclusions & Limitations",
  "FAQs.md": "FAQs",
};

const FILE_COLOR = {
  "Plans-Overview.md": "bg-blue-100 text-blue-800",
  "Coverage-Details.md": "bg-green-100 text-green-800",
  "Pricing.md": "bg-yellow-100 text-yellow-800",
  "Eligibility.md": "bg-purple-100 text-purple-800",
  "Exclusions-Limitations.md": "bg-red-100 text-red-800",
  "FAQs.md": "bg-orange-100 text-orange-800",
};

const SAMPLE_QUESTIONS = [
  "What are the monthly premiums for Missouri Medicare Advantage plans?",
  "What is the maximum out-of-pocket limit?",
  "Do these plans include dental coverage?",
  "What are the eligibility requirements?",
];

function SourceCard({ source }) {
  const colorClass = FILE_COLOR[source.file] || "bg-gray-100 text-gray-800";
  const label = FILE_LABEL[source.file] || source.label || source.file;

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
          {label}
        </span>
      </div>
      {source.excerpt && (
        <p className="text-sm text-gray-600 italic leading-relaxed">
          &ldquo;{source.excerpt}&rdquo;
        </p>
      )}
    </div>
  );
}

function ResultCard({ question, answer, sources }) {
  return (
    <div className="mt-6 space-y-4 animate-fadeIn">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Your Question</p>
        <p className="text-gray-800 font-medium">{question}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-3">Answer</p>
        <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">{answer}</div>
      </div>

      {sources && sources.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Sources ({sources.length})
          </p>
          <div className="space-y-2">
            {sources.map((src, i) => (
              <SourceCard key={i} source={src} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  async function handleSubmit(e) {
    e?.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ask-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResult({ question: q, answer: data.answer, sources: data.sources });
    } catch (err) {
      setError(err.message || "Failed to get an answer. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSample(q) {
    setQuestion(q);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-600 mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Aetna Missouri Medicare Assistant</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Ask anything about Aetna&rsquo;s 34 Missouri Medicare plans &mdash; answers sourced directly from plan documents.
          </p>
        </div>

        {/* Question form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <form onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about Missouri Aetna plans..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-400">Press Enter to submit &middot; Shift+Enter for newline</p>
              <button
                type="submit"
                disabled={!question.trim() || loading}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ask
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Sample questions */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSample(q)}
                  className="text-xs bg-gray-50 hover:bg-purple-50 hover:text-purple-700 text-gray-600 border border-gray-200 hover:border-purple-200 px-3 py-1.5 rounded-full transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
            <div className="inline-flex items-center gap-3 text-gray-500">
              <svg className="animate-spin w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Searching plan documents&hellip;</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <ResultCard question={result.question} answer={result.answer} sources={result.sources} />
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Answers sourced from official Aetna Missouri plan documents &middot; For enrollment help call{" "}
          <a href="tel:18008237734" className="underline hover:text-gray-600">1-800-Medicare</a>
        </p>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}
