'use client';

import React, { useState, useEffect } from 'react';

const lines = [
  '// CodePilot — AI Collaborative IDE',
  '',
  'import { createWorkspace } from "@codepilot/sdk";',
  'import { AIAssistant } from "@codepilot/ai";',
  '',
  'const workspace = await createWorkspace({',
  '  name: "my-project",',
  '  runtime: "typescript",',
  '  collaborators: ["priya", "marcus"],',
  '});',
  '',
  '// AI explains your code instantly',
  'const ai = new AIAssistant({ context: workspace });',
  'const explanation = await ai.explain(selectedCode);',
];

export default function AuthCodePreview() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible < lines?.length) {
      const t = setTimeout(() => setVisible((v) => v + 1), 80 + visible * 10);
      return () => clearTimeout(t);
    }
  }, [visible]);

  return (
    <div
      className="w-full max-w-md rounded-xl overflow-hidden border shadow-modal"
      style={{ borderColor: '#2a2a3a', background: '#12121a' }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b"
        style={{ borderColor: '#2a2a3a', background: '#0d0d10' }}
      >
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-[11px] text-[#4a5568] font-mono ml-2">workspace.ts</span>
      </div>
      <div className="p-4 font-mono text-[11px] leading-[1.75] min-h-[200px]">
        {lines?.slice(0, visible)?.map((line, i) => (
          <div key={`auth-line-${i}`} className="flex">
            <span className="w-5 text-right mr-3 text-[#3a3a4a] select-none flex-shrink-0">
              {i + 1}
            </span>
            <span
              className={
                line?.startsWith('//')
                  ? 'text-[#585b70]'
                  : line?.startsWith('import')
                    ? 'text-[#89b4fa]'
                    : line?.includes('"')
                      ? 'text-[#a6e3a1]'
                      : line?.includes(':')
                        ? 'text-[#cdd6f4]'
                        : 'text-[#cdd6f4]'
              }
            >
              {line || '\u00A0'}
              {i === visible - 1 && visible < lines?.length && (
                <span className="inline-block w-[2px] h-[12px] bg-[#cba6f7] ml-0.5 align-middle animate-blink" />
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
