'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react';
import type { EditorTab } from '@/features/ide-workspace/types';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  timestamp: string;
}

interface Props {
  activeFile?: EditorTab;
  isDark: boolean;
  onClose: () => void;
}

const initialMessages: AIMessage[] = [];

export default function AIPanel({ activeFile, isDark: _isDark, onClose }: Props) {
  const [messages, setMessages] = useState<AIMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [width, setWidth] = useState(320);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const delta = startX.current - e.clientX;
    const newW = Math.min(800, Math.max(250, startW.current + delta));
    setWidth(newW);
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startW.current = width;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const streamMessage = async (userPrompt: string) => {
    if (isStreaming) return;

    const userMsg: AIMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: userPrompt,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    };

    const assistantId = `msg-a-${Date.now() + 1}`;
    const assistantMsg: AIMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    setInput('');

    // BACKEND INTEGRATION: POST /api/ai/chat — stream response from AI service
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          context: activeFile ? { fileName: activeFile.name, content: activeFile.content } : null
        })
      });

      if (!res.ok) throw new Error('Failed to fetch AI response');
      const data = await res.json();
      const responseText = data.response?.content || 'Sorry, I could not generate a response.';
      const words = responseText.split(' ');

      for (let i = 0; i < words.length; i++) {
        await new Promise((r) => setTimeout(r, 18 + (i % 3) * 8));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: words.slice(0, i + 1).join(' ') } : m
          )
        );
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: 'Error communicating with AI service.' } : m
        )
      );
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
    );
    setIsStreaming(false);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    streamMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderContent = (content: string) => {
    // Simple markdown-ish rendering
    const parts = content.split(/(`{3}[\s\S]*?`{3}|`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).replace(/^[a-z]+\n/, '');
        return (
          <pre
            key={`code-block-${i}`}
            className="bg-muted rounded-lg p-3 text-sm font-mono overflow-x-auto my-2 text-foreground border border-border"
          >
            {code}
          </pre>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={`inline-code-${i}`}
            className="bg-muted px-1 py-0.5 rounded text-sm font-mono text-primary"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={`bold-${i}`} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return (
        <span key={`text-${i}`}>
          {part.split('\n').map((line, li) => (
            <React.Fragment key={`line-${i}-${li}`}>
              {li > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </span>
      );
    });
  };

  return (
    <div
      className="absolute right-0 z-40 h-full md:relative flex-shrink-0 flex flex-col border-l monochrome-panel bg-background shadow-2xl md:shadow-none !border-y-0 !border-r-0 !rounded-none"
      style={{ width: `${width}px`, maxWidth: '100vw', borderColor: 'var(--ide-panel-border)' }}
    >
      {/* Resize handle */}
      <div
        className="absolute top-0 left-0 w-1 h-full cursor-ew-resize hover:bg-primary/30 transition-colors duration-150 z-50"
        onMouseDown={handleMouseDown}
      />
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: 'var(--ide-panel-border)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Sparkles size={13} className="text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">AI Assistant</div>
            <div className="text-xs text-muted-foreground">
              {activeFile ? `Context: ${activeFile.name}` : 'No file selected'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMessages(initialMessages)}
            className="ide-btn w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-all duration-150"
            title="Clear conversation"
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={onClose}
            className="ide-btn w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-all duration-150"
            title="Close AI panel"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto ide-scrollbar px-3 py-3 space-y-4 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {msg.role === 'assistant' ? (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles size={11} className="text-primary" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  PS
                </div>
              )}
            </div>

            {/* Bubble */}
            <div
              className={`group max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}
            >
              <div
                className={`rounded-xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'monochrome-card text-foreground rounded-tl-sm'
                }`}
              >
                {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                {msg.isStreaming && <span className="ai-stream-cursor" />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                {msg.role === 'assistant' && !msg.isStreaming && (
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all duration-150"
                  >
                    {copiedId === msg.id ? (
                      <Check size={10} className="text-accent" />
                    ) : (
                      <Copy size={10} />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="border-t p-3 flex-shrink-0"
        style={{ borderColor: 'var(--ide-panel-border)' }}
      >
        <div className="flex items-end gap-2 monochrome-card rounded-xl p-2 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all duration-200 shadow-sm">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your code..."
            rows={1}
            className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed"
            style={{ maxHeight: '80px', overflowY: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all duration-300 flex-shrink-0"
          >
            <Send size={12} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 text-center">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
