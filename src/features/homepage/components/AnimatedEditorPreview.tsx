'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

const codeLines = [
  {
    tokens: [
      { t: 'async', c: 'text-[#c792ea]' },
      { t: ' function ', c: 'text-[#82aaff]' },
      { t: 'fetchUserData', c: 'text-[#ffcb6b]' },
      { t: '(', c: 'text-foreground' },
      { t: 'userId', c: 'text-[#f78c6c]' },
      { t: ': ', c: 'text-foreground' },
      { t: 'string', c: 'text-[#c3e88d]' },
      { t: ') {', c: 'text-foreground' },
    ],
    indent: 0,
  },
  {
    tokens: [
      { t: '  const', c: 'text-[#c792ea]' },
      { t: ' response ', c: 'text-foreground' },
      { t: '= await', c: 'text-[#c792ea]' },
      { t: ' fetch(', c: 'text-foreground' },
    ],
    indent: 1,
  },
  {
    tokens: [
      { t: '    `', c: 'text-[#c3e88d]' },
      { t: '${API_BASE}', c: 'text-[#82aaff]' },
      { t: '/users/', c: 'text-[#c3e88d]' },
      { t: '${userId}', c: 'text-[#82aaff]' },
      { t: '`', c: 'text-[#c3e88d]' },
    ],
    indent: 2,
  },
  { tokens: [{ t: '  );', c: 'text-foreground' }], indent: 1 },
  { tokens: [], indent: 0 },
  {
    tokens: [
      { t: '  if ', c: 'text-[#c792ea]' },
      { t: '(!response.ok) {', c: 'text-foreground' },
    ],
    indent: 1,
  },
  {
    tokens: [
      { t: '    throw new ', c: 'text-[#c792ea]' },
      { t: 'Error', c: 'text-[#ffcb6b]' },
      { t: '(`HTTP ', c: 'text-[#c3e88d]' },
      { t: '${response.status}', c: 'text-[#82aaff]' },
      { t: '`);', c: 'text-[#c3e88d]' },
    ],
    indent: 2,
  },
  { tokens: [{ t: '  }', c: 'text-foreground' }], indent: 1 },
  { tokens: [], indent: 0 },
  {
    tokens: [
      { t: '  return ', c: 'text-[#c792ea]' },
      { t: 'response', c: 'text-foreground' },
      { t: '.json', c: 'text-[#82aaff]' },
      { t: '();', c: 'text-foreground' },
    ],
    indent: 1,
  },
  { tokens: [{ t: '}', c: 'text-foreground' }], indent: 0 },
];

interface Props {
  isDark: boolean;
}

export default function AnimatedEditorPreview({ isDark }: Props) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);

  useEffect(() => {
    if (visibleLines < codeLines.length) {
      const timer = setTimeout(
        () => {
          setVisibleLines((v) => v + 1);
        },
        120 + visibleLines * 15
      );
      return () => clearTimeout(timer);
    } else {
      const runTimer = setTimeout(() => {
        setIsRunning(true);
        setTimeout(() => {
          setIsRunning(false);
          setShowOutput(true);
        }, 1400);
      }, 600);
      return () => clearTimeout(runTimer);
    }
  }, [visibleLines]);

  return (
    <div className="relative">
      {/* Editor window */}
      <div
        className="rounded-2xl overflow-hidden shadow-modal border border-border"
        style={{ background: isDark ? '#0d0d10' : '#1e1e2e' }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{
            borderColor: isDark ? '#2a2a3a' : '#2a2a3a',
            background: isDark ? '#12121a' : '#181825',
          }}
        >
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-xs text-[#6c7086] font-mono">api.ts</span>
          <div className="ml-auto flex items-center gap-2">
            {isRunning ? (
              <span className="flex items-center gap-1.5 text-xs text-[#cba6f7]">
                <Loader2 size={11} className="animate-spin" />
                Running...
              </span>
            ) : showOutput ? (
              <span className="flex items-center gap-1.5 text-xs text-[#a6e3a1]">
                <CheckCircle2 size={11} />
                Passed
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-[#89b4fa]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#89b4fa] animate-pulse" />
                TypeScript
              </span>
            )}
          </div>
        </div>

        {/* Code area */}
        <div className="p-4 font-mono text-[12px] leading-[1.7] min-h-[220px]">
          {codeLines.slice(0, visibleLines).map((line, i) => (
            <div key={`preview-line-${i}`} className="flex items-start">
              <span className="w-6 text-right mr-4 text-[#4a4a5a] select-none flex-shrink-0">
                {i + 1}
              </span>
              <span>
                {line.tokens.map((token, ti) => (
                  <span key={`token-${i}-${ti}`} className={token.c}>
                    {token.t}
                  </span>
                ))}
                {i === visibleLines - 1 && visibleLines < codeLines.length && (
                  <span className="inline-block w-[2px] h-[13px] bg-[#cba6f7] ml-0.5 align-middle animate-blink" />
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Output panel */}
        {showOutput && (
          <div
            className="border-t px-4 py-3 animate-slide-up"
            style={{ borderColor: '#2a2a3a', background: '#0a0a0e' }}
          >
            <div className="text-[11px] text-[#6c7086] font-mono mb-2">OUTPUT</div>
            <div className="text-[12px] font-mono space-y-1">
              <div className="text-[#a6e3a1]">✓ Compilation successful (0.3s)</div>
              <div className="text-[#cdd6f4]">
                → Executing fetchUserData(&quot;usr-2847&quot;)...
              </div>
              <div className="text-[#89b4fa]">← Response: 200 OK — 47ms</div>
              <div className="text-[#a6e3a1]">✓ All assertions passed</div>
            </div>
          </div>
        )}
      </div>

      {/* Floating collaborator badge */}
      <div className="absolute -bottom-3 -right-3 flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5 shadow-dropdown animate-slide-up">
        <div className="flex -space-x-1">
          {['#6366f1', '#10b981', '#f59e0b'].map((c, i) => (
            <div
              key={`collab-avatar-${i}`}
              className="w-5 h-5 rounded-full border-2 border-card"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground font-medium">3 editing</span>
      </div>
    </div>
  );
}
