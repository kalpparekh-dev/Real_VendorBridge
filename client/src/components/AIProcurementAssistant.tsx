import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Loader2,
  MessageCircle,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { chatWithAI } from '../api/ai';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  responseTimeMs?: number;
};

const suggestions = [
  'Executive summary',
  'This month spend',
  'Compare this month vs last month',
  'Show unpaid invoices',
  'High risk invoices',
  'Top vendors by spend',
  'Highest rated vendor',
  'Pending approvals',
];

const AIProcurementAssistant = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hi, I am VendorBridge AI v3. Ask me for executive insights, spend analysis, vendor performance, overdue invoices, high-risk invoices, approvals or procurement summary.',
    },
  ]);

  const copyMessage = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);

    setTimeout(() => {
      setCopiedIndex(null);
    }, 1200);
  };

  const sendMessage = async (customMessage?: string) => {
    const text = (customMessage || input).trim();

    if (!text || sending) return;

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: text,
      },
    ]);

    setInput('');
    setSending(true);

    try {
      const response = await chatWithAI(text);

      const answer =
        response?.data?.answer ||
        response?.answer ||
        'I could not find an answer for that.';

      const responseTimeMs =
        response?.data?.responseTimeMs || response?.responseTimeMs;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: answer,
          responseTimeMs,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, I could not connect to the AI assistant right now. Please try again.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-accent text-white shadow-xl transition hover:scale-105"
      >
        <MessageCircle size={24} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 flex h-[660px] w-[410px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl border border-border bg-bg-surface shadow-2xl"
          >
            <div className="border-b border-border bg-bg-elevated px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-accent/10 p-2 text-accent">
                    <Bot size={20} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      VendorBridge AI
                    </p>
                    <p className="text-xs text-text-muted">
                      Executive Procurement Copilot
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-text-muted hover:bg-bg-surface hover:text-text-primary"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl border border-border bg-bg-surface px-3 py-2">
                  <p className="text-text-muted">Mode</p>
                  <p className="mt-1 font-medium text-text-primary">AI v3</p>
                </div>

                <div className="rounded-xl border border-border bg-bg-surface px-3 py-2">
                  <p className="text-text-muted">Data</p>
                  <p className="mt-1 font-medium text-text-primary">Live DB</p>
                </div>

                <div className="rounded-xl border border-border bg-bg-surface px-3 py-2">
                  <p className="text-text-muted">Cost</p>
                  <p className="mt-1 font-medium text-text-primary">₹0 API</p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`group max-w-[88%] rounded-2xl px-4 py-3 text-sm ${
                      message.role === 'user'
                        ? 'bg-accent text-white'
                        : 'border border-border bg-bg-elevated text-text-primary'
                    }`}
                  >
                    <div className="whitespace-pre-line leading-relaxed">
                      {message.content}
                    </div>

                    {message.role === 'assistant' && (
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-2">
                        <div className="flex items-center gap-1 text-[11px] text-text-muted">
                          <Zap size={12} className="text-accent" />
                          {message.responseTimeMs
                            ? `${message.responseTimeMs}ms`
                            : 'Live insight'}
                        </div>

                        <button
                          onClick={() => copyMessage(message.content, index)}
                          className="flex items-center gap-1 text-[11px] text-text-muted hover:text-accent"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check size={12} />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-bg-elevated px-4 py-3 text-sm text-text-muted">
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing procurement data...
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border p-4">
              <div className="mb-3 flex items-center gap-2 text-xs text-text-muted">
                <Sparkles size={14} className="text-accent" />
                Suggested executive prompts
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs text-text-secondary hover:border-accent hover:text-accent"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendMessage();
                    }
                  }}
                  placeholder="Ask executive AI..."
                  className="flex-1 rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted"
                />

                <button
                  onClick={() => sendMessage()}
                  disabled={sending}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIProcurementAssistant;