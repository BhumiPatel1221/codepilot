'use client';

import React, { useRef, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { Collaborator, EditorTab } from '@/features/ide-workspace/types';

interface Props {
  tab: EditorTab;
  isDark: boolean;
  onChange: (val: string | undefined) => void;
  collaborators: Collaborator[];
  isReadOnly?: boolean;
}

export default function MonacoEditorWrapper({ tab, isDark, onChange, collaborators, isReadOnly }: Props) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;

      // Configure TypeScript defaults
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2022,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: 'React',
        allowJs: true,
        typeRoots: ['node_modules/@types'],
      });

      // Add collaborator decorations
      // BACKEND INTEGRATION: Subscribe to Supabase Realtime channel for cursor positions
      collaborators.forEach((c) => {
        if (!c.cursor) return;
        editor.deltaDecorations(
          [],
          [
            {
              range: new monaco.Range(c.cursor.line, 1, c.cursor.line, 1),
              options: {
                isWholeLine: true,
                className: '',
                glyphMarginClassName: '',
                after: {
                  content: ` ${c.name}`,
                  inlineClassName: 'collaborator-label',
                },
                linesDecorationsClassName: `collaborator-line-decoration`,
              },
            },
          ]
        );
      });

      // Focus editor
      editor.focus();
    },
    [collaborators]
  );

  return (
    <Editor
      height="100%"
      language={tab.language === 'markdown' ? 'markdown' : tab.language}
      value={tab.content}
      theme={isDark ? 'vs-dark' : 'vs'}
      onChange={onChange}
      onMount={handleMount}
      options={{
        fontSize: 13,
        fontFamily: 'var(--font-mono), "JetBrains Mono", "Fira Code", monospace',
        fontLigatures: true,
        lineHeight: 1.7,
        minimap: { enabled: true, scale: 1, renderCharacters: false },
        scrollBeyondLastLine: false,
        wordWrap: 'off',
        tabSize: 2,
        insertSpaces: true,
        renderLineHighlight: 'gutter',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        padding: { top: 12, bottom: 12 },
        lineNumbers: 'on',
        lineNumbersMinChars: 3,
        glyphMargin: true,
        folding: true,
        foldingStrategy: 'indentation',
        showFoldingControls: 'mouseover',
        bracketPairColorization: { enabled: true },
        guides: {
          bracketPairs: true,
          indentation: true,
        },
        suggest: {
          showKeywords: true,
          showSnippets: true,
          showClasses: true,
          showFunctions: true,
          showVariables: true,
        },
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false,
        },
        parameterHints: { enabled: true },
        formatOnPaste: true,
        formatOnType: false,
        autoIndent: 'full',
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        renderWhitespace: 'none',
        contextmenu: true,
        mouseWheelZoom: true,
        accessibilitySupport: 'auto',
        readOnly: isReadOnly,
      }}
    />
  );
}
