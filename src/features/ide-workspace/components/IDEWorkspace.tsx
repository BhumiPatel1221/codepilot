'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import IDETopBar from './IDETopBar';
import FileExplorer from './FileExplorer';
import EditorArea from './EditorArea';
import AIPanel from './AIPanel';
import BottomPanel from './BottomPanel';

import { initialFiles } from '@/features/ide-workspace/data';
import type { EditorTab, FileNode, Collaborator } from '@/features/ide-workspace/types';
import { useAuth } from '@/context/AuthContext';
import { io, Socket } from 'socket.io-client';

export default function IDEWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workspaceId = searchParams.get('id');
  const { user } = useAuth();
  
  const [localSessionId] = useState(() => `local-${Math.random().toString(36).substring(2, 9)}`);
  const effectiveWorkspaceId = workspaceId || localSessionId;

  const [files, setFiles] = useState<FileNode[]>(initialFiles);
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState('');
  const [workspaceMeta, setWorkspaceMeta] = useState<any>(null);
  const [socket, setSocket] = useState<any>(null);
  
  const [isDark, setIsDark] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(true);
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [runOutput, setRunOutput] = useState<string[]>([]);
  const [bottomTab, setBottomTab] = useState<'terminal' | 'problems' | 'output' | 'chat'>('terminal');
  const [bottomPanelHeight, setBottomPanelHeight] = useState(250);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('TypeScript');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  // Load workspace data
  useEffect(() => {
    if (!workspaceId) {
      // If no ID, setup a default tab from initialFiles
      if (tabs.length === 0 && initialFiles[0]?.children?.[0]) {
        const file = initialFiles[0].children[0];
        setTabs([{
          id: `tab-${file.id}`,
          fileId: file.id,
          name: file.name,
          language: file.language || 'typescript',
          content: file.content || '',
          isDirty: false
        }]);
        setActiveTabId(`tab-${file.id}`);
      }
      return;
    }

    const fetchWorkspace = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/workspace/${workspaceId}`);
        if (!res.ok) throw new Error('Workspace not found');
        const data = await res.json();
        setWorkspaceMeta(data);
        
        if (data.files && data.files.length > 0) {
          setFiles(data.files);
          // Open first file if no tabs open
          if (tabs.length === 0) {
            let firstFile = data.files[0];
            while (firstFile.type === 'folder' && firstFile.children?.length) {
              firstFile = firstFile.children[0];
            }
            if (firstFile.type === 'file') {
              setTabs([{
                id: `tab-${firstFile.id}`,
                fileId: firstFile.id,
                name: firstFile.name,
                language: firstFile.language || 'typescript',
                content: firstFile.content || '',
                isDirty: false
              }]);
              setActiveTabId(`tab-${firstFile.id}`);
            }
          }
        }
        if (data.collaborators) {
          setCollaborators(data.collaborators);
        }
        if (data.language) {
          setSelectedLanguage(data.language);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchWorkspace();
  }, [workspaceId]); // Only run on workspaceId change

  const isReadOnly = workspaceMeta?.ownerId !== user?.id && 
                     workspaceMeta?.collaborators?.find((c: any) => c.id === user?.id)?.role === 'viewer';

  const saveWorkspace = useCallback(async (currentFiles: FileNode[], currentLang: string) => {
    if (!workspaceId || !workspaceMeta || isReadOnly) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/save-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...workspaceMeta,
          workspaceId: workspaceId,
          files: currentFiles,
          language: currentLang,
        })
      });

      if (socket) {
        socket.emit('workspace:files:update', { roomId: workspaceId, files: currentFiles });
      }
    } catch (e) {
      console.error('Failed to save workspace:', e);
    }
  }, [workspaceId, workspaceMeta]);

  useEffect(() => {
    if (!workspaceId || !workspaceMeta) return;
    const handler = setTimeout(() => {
      saveWorkspace(files, selectedLanguage);
    }, 2000);
    return () => clearTimeout(handler);
  }, [files, selectedLanguage, saveWorkspace, workspaceId, workspaceMeta, socket, isReadOnly]);

  // Socket setup
  useEffect(() => {
    if (!effectiveWorkspaceId) return;
    const newSocket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}`, {
      withCredentials: true,
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('room:join', { roomId: effectiveWorkspaceId, user: user || { id: 'anonymous' } });
    });

    newSocket.on('workspace:files:update', (data: { roomId: string, files: FileNode[] }) => {
      if (data.roomId === effectiveWorkspaceId && data.files) {
        setFiles(data.files);
      }
    });

    newSocket.on('terminal:output', (data: { executionId: string, stream: string, chunk: string }) => {
      setRunOutput(prev => {
        const text = data.chunk.replace(/\r/g, '');
        const lines = text.split('\n');
        // Prevent appending just an empty array element if text ends with \n
        if (lines.length > 0 && lines[lines.length - 1] === '') {
          lines.pop();
        }
        return [...prev, ...lines];
      });
    });

    newSocket.on('presence:update', (data: { roomId: string, user?: any, userId?: string, status: string }) => {
      if (data.roomId === effectiveWorkspaceId) {
        setCollaborators(prev => {
          if (data.status === 'joined' && data.user) {
            // Add user if they aren't already in the list
            if (!prev.find(c => c.id === data.user.id)) {
              // Usually the backend holds the full collaborator record with role. 
              // We'll append them temporarily if not there.
              return [...prev, { ...data.user, isActive: true }];
            }
            // If they are there, update their active status
            return prev.map(c => c.id === data.user.id ? { ...c, isActive: true } : c);
          } else if ((data.status === 'left' || data.status === 'disconnected') && (data.userId || data.user?.id)) {
            const leftId = data.userId || data.user?.id;
            return prev.map(c => c.id === leftId ? { ...c, isActive: false } : c);
          }
          return prev;
        });
      }
    });

    newSocket.on('workspace:collaborator:added', (data: { roomId: string, collaborator: any }) => {
      if (data.roomId === effectiveWorkspaceId && data.collaborator) {
        setCollaborators(prev => {
          if (prev.find(c => c.id === data.collaborator.id)) return prev;
          return [...prev, { ...data.collaborator, isActive: true }];
        });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [effectiveWorkspaceId, user]);

  // Theme setup
  useEffect(() => {
    const saved = localStorage.getItem('codepilot-theme');
    if (saved === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('codepilot-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('codepilot-theme', 'light');
    }
  };

  const openFile = useCallback(
    (file: FileNode) => {
      if (file.type !== 'file') return;
      const existing = tabs.find((t) => t.fileId === file.id);
      if (existing) {
        setActiveTabId(existing.id);
        return;
      }
      const newTab: EditorTab = {
        id: `tab-${file.id}`,
        fileId: file.id,
        name: file.name,
        language: file.language ?? 'plaintext',
        content: file.content ?? '',
        isDirty: false,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
    },
    [tabs]
  );

  const closeTab = useCallback(
    (tabId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === tabId);
        const next = prev.filter((t) => t.id !== tabId);
        if (activeTabId === tabId && next.length > 0) {
          const newActive = next[Math.max(0, idx - 1)];
          setActiveTabId(newActive.id);
        }
        return next;
      });
    },
    [activeTabId]
  );

  // Update files tree when content changes
  const updateFileTreeContent = (nodes: FileNode[], fileId: string, content: string): FileNode[] => {
    return nodes.map(node => {
      if (node.id === fileId) {
        return { ...node, content };
      }
      if (node.children) {
        return { ...node, children: updateFileTreeContent(node.children, fileId, content) };
      }
      return node;
    });
  };

  const updateContent = useCallback((tabId: string, content: string) => {
    setTabs((prev) => prev.map((t) => {
      if (t.id === tabId) {
        setFiles(f => updateFileTreeContent(f, t.fileId, content));
        return { ...t, content, isDirty: true };
      }
      return t;
    }));
  }, []);

  const findFilePath = (nodes: FileNode[], targetId: string, currentPath = ''): string | null => {
    for (const node of nodes) {
      const nodePath = currentPath ? `${currentPath}/${node.name}` : node.name;
      if (node.id === targetId) return nodePath;
      if (node.children) {
        const found = findFilePath(node.children, targetId, nodePath);
        if (found) return found;
      }
    }
    return null;
  };

  const runInTerminal = useCallback(() => {
    const activeTabObj = tabs.find(t => t.id === activeTabId);
    if (!activeTabObj) return;

    const activeFilePath = findFilePath(files, activeTabObj.fileId) || activeTabObj.name;
    const ext = activeFilePath.split('.').pop()?.toLowerCase();
    
    let cmd = '';
    if (ext === 'java') {
      const className = activeFilePath.split('/').pop()?.replace('.java', '');
      cmd = `javac ${activeFilePath} && java ${className}`;
    } else if (ext === 'py') {
      cmd = `python ${activeFilePath}`;
    } else if (ext === 'cpp') {
      cmd = `g++ ${activeFilePath} && ./a.out`;
    } else if (ext === 'js') {
      cmd = `node ${activeFilePath}`;
    } else if (ext === 'ts') {
      cmd = `npx ts-node ${activeFilePath}`;
    } else {
      cmd = `./${activeFilePath}`;
    }

    if (socket && effectiveWorkspaceId) {
      socket.emit('pty:data', `${cmd}\r`);
      setBottomTab('terminal'); // Ensure terminal tab is focused
    }
  }, [tabs, activeTabId, files, socket, effectiveWorkspaceId]);

  const runCode = async () => {
    if (isRunning) return;
    const activeTabObj = tabs.find(t => t.id === activeTabId);
    if (!activeTabObj) return;

    const activeFilePath = findFilePath(files, activeTabObj.fileId) || activeTabObj.name;

    setIsRunning(true);
    setBottomTab('output');
    setRunOutput(['> Starting execution container...']);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLanguage.toLowerCase(),
          code: activeTabObj.content,
          files: files,
          activeFilePath: activeFilePath,
          roomId: effectiveWorkspaceId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Execution failed');

      setRunOutput(prev => [
        ...prev, 
        '',
        `> Process exited with code ${data.exitCode} (${data.durationMs}ms)`
      ]);
    } catch (error: any) {
      setRunOutput(prev => [...prev, '', `> Error: ${error.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunTerminalCommand = async (command: string): Promise<string[]> => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'terminal',
          code: '',
          files: files,
          activeFilePath: command
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Execution failed');

      const newOutput: string[] = [];
      if (data.stdout) newOutput.push(...data.stdout.split('\n'));
      if (data.stderr) newOutput.push(...data.stderr.split('\n'));
      
      return newOutput.length > 0 ? newOutput : ['(no output)'];
    } catch (error: any) {
      return [`Error: ${error.message}`];
    }
  };

  const activeTabObj = tabs.find((t) => t.id === activeTabId);

  useEffect(() => {
    if (activeTabObj?.language) {
      setSelectedLanguage(activeTabObj.language);
    }
  }, [activeTabObj?.language]);

  return (
    <div
      className={`flex flex-col h-screen overflow-hidden bg-background text-foreground ${isDark ? 'dark' : ''}`}
    >
      <IDETopBar
        isDark={isDark}
        toggleTheme={toggleTheme}
        isRunning={isRunning}
        onRun={runCode}
        collaborators={collaborators}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        isAIPanelOpen={isAIPanelOpen}
        setIsAIPanelOpen={setIsAIPanelOpen}
        isExplorerOpen={isExplorerOpen}
        setIsExplorerOpen={setIsExplorerOpen}
        workspaceId={workspaceId}
        workspaceName={workspaceMeta?.name}
        isReadOnly={isReadOnly}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {/* File explorer */}
        {isExplorerOpen && (
          <FileExplorer
            files={files}
            setFiles={setFiles}
            activeFileId={activeTabObj?.fileId}
            onOpenFile={openFile}
            collaborators={collaborators}
            isReadOnly={isReadOnly}
          />
        )}

        {/* Editor + Bottom panel */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <EditorArea
            tabs={tabs}
            activeTabId={activeTabId}
            setActiveTabId={setActiveTabId}
            closeTab={closeTab}
            updateContent={updateContent}
            collaborators={collaborators}
            isDark={isDark}
            isReadOnly={isReadOnly}
          />
          <BottomPanel
            activeTab={bottomTab}
            setActiveTab={setBottomTab}
            isRunning={isRunning}
            runOutput={runOutput}
            height={bottomPanelHeight}
            setHeight={setBottomPanelHeight}
            isDark={isDark}
            onRunTerminalCommand={handleRunTerminalCommand}
            terminalHistory={terminalHistory}
            setTerminalHistory={setTerminalHistory}
            socket={socket}
            workspaceId={effectiveWorkspaceId}
            files={files}
            language={selectedLanguage}
            onRunInTerminal={runInTerminal}
          />
        </div>

        {/* AI panel */}
        {isAIPanelOpen && (
          <AIPanel activeFile={activeTabObj} isDark={isDark} onClose={() => setIsAIPanelOpen(false)} />
        )}
      </div>
    </div>
  );
}
