'use client';

import React from 'react';
import { X, Circle, SplitSquareHorizontal } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { Collaborator, EditorTab } from '@/features/ide-workspace/types';

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import('./MonacoEditorWrapper'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-ide-editor">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={`loader-dot-${i}`}
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">Loading editor...</span>
      </div>
    </div>
  ),
});

interface Props {
  tabs: EditorTab[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  closeTab: (tabId: string, e: React.MouseEvent) => void;
  updateContent: (tabId: string, content: string) => void;
  collaborators: Collaborator[];
  isDark: boolean;
  isReadOnly?: boolean;
}

const langDisplayNames: Record<string, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
  json: 'JSON',
  markdown: 'Markdown',
  plaintext: 'Plain Text',
  rust: 'Rust',
};

export default function EditorArea({
  tabs,
  activeTabId,
  setActiveTabId,
  closeTab,
  updateContent,
  collaborators,
  isDark,
  isReadOnly,
}: Props) {
  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (tabs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-ide-editor text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
          <SplitSquareHorizontal size={28} className="text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-2">No files open</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Select a file from the explorer to start editing, or create a new file.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-ide-editor min-h-0">
      {/* Tab bar */}
      <div
        className="flex items-stretch border-b tab-scrollbar overflow-x-auto flex-shrink-0"
        style={{
          borderColor: 'var(--ide-tab-border)',
          background: 'var(--ide-tab-inactive)',
          minHeight: '36px',
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const collabsInTab = collaborators.filter(
            (c) => c.currentFile === tab.fileId && c.isActive
          );
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`tab-item group flex items-center gap-2 px-3 py-2 cursor-pointer border-r text-sm whitespace-nowrap flex-shrink-0 relative transition-all duration-200 ${
                isActive
                  ? 'bg-ide-editor text-primary border-b-2 border-b-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50 border-b-2 border-b-transparent'
              }`}
              style={{ borderRightColor: 'var(--ide-tab-border)' }}
            >
              {/* Collab dots */}
              {collabsInTab.length > 0 && (
                <div className="flex -space-x-0.5">
                  {collabsInTab.slice(0, 2).map((c) => (
                    <div
                      key={`tab-dot-${c.id}`}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                  ))}
                </div>
              )}
              <span className="font-mono">{tab.name}</span>
              {tab.isDirty && (
                <Circle size={6} className="fill-primary text-primary flex-shrink-0" />
              )}
              <button
                onClick={(e) => closeTab(tab.id, e)}
                className={`w-4 h-4 flex items-center justify-center rounded text-muted-foreground flex-shrink-0 transition-all duration-150 ${
                  isActive
                    ? 'opacity-100 hover:bg-muted hover:text-foreground'
                    : 'opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground'
                }`}
              >
                <X size={10} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Editor */}
      {activeTab && (
        <div className="flex-1 overflow-hidden relative min-h-0">
          <MonacoEditor
            key={activeTab.id}
            tab={activeTab}
            isDark={isDark}
            onChange={(val) => updateContent(activeTab.id, val ?? '')}
            collaborators={collaborators.filter(
              (c) => c.currentFile === activeTab.fileId && c.isActive
            )}
            isReadOnly={isReadOnly}
          />
        </div>
      )}

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-3 py-1 border-t flex-shrink-0"
        style={{ borderColor: 'var(--ide-tab-border)', background: 'var(--ide-tab-inactive)' }}
      >
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono">
            {langDisplayNames[activeTab?.language ?? 'plaintext'] ?? 'Plain Text'}
          </span>
          <span>UTF-8</span>
          <span>LF</span>
          {activeTab?.isDirty && <span className="text-amber-500 font-medium">● Unsaved</span>}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Ln 1, Col 1</span>
          <span>Spaces: 2</span>
          {activeTab && (
            <span className="font-mono">{activeTab.content.split('\n').length} lines</span>
          )}
        </div>
      </div>
    </div>
  );
}
