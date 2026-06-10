'use client';

import '@xterm/xterm/css/xterm.css';

import React, { useRef, useState, useEffect } from 'react';
import {
  Terminal,
  AlertCircle,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
  Play,
  Plus,
  Trash,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  author: string;
  avatar: string;
  color: string;
  content: string;
  time: string;
}

interface Props {
  activeTab: 'terminal' | 'problems' | 'output' | 'chat';
  setActiveTab: (t: 'terminal' | 'problems' | 'output' | 'chat') => void;
  isRunning: boolean;
  runOutput: string[];
  height: number;
  setHeight: (h: number) => void;
  isDark: boolean;
  onRunTerminalCommand?: (cmd: string) => Promise<string[]>;
  terminalHistory: string[];
  setTerminalHistory: React.Dispatch<React.SetStateAction<string[]>>;
  socket?: any;
  workspaceId?: string;
  files?: any[];
  language?: string;
  onRunInTerminal?: () => void;
}

import { useAuth } from '@/context/AuthContext';

const initialChatMessages: ChatMessage[] = [];

export default function BottomPanel({
  activeTab,
  setActiveTab,
  isRunning,
  runOutput,
  height,
  setHeight,
  isDark: _isDark,
  onRunTerminalCommand,
  terminalHistory,
  setTerminalHistory,
  socket,
  workspaceId,
  files,
  language,
  onRunInTerminal,
}: Props) {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [problems, setProblems] = useState<{
    id: string;
    severity: 'error' | 'warning' | 'info';
    file: string;
    line: number;
    col: number;
    message: string;
    rule: string;
  }[]>([]);
  const ptyBufferRef = useRef('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef(activeTab);
  const isResizing = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);

  const [isTerminalReady, setIsTerminalReady] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<any>(null);
  const fitAddonInstance = useRef<any>(null);

  useEffect(() => {
    if (activeTab === 'terminal' && terminalRef.current && !termInstance.current) {
      Promise.all([
        import('@xterm/xterm'),
        import('@xterm/addon-fit')
      ]).then(([{ Terminal }, { FitAddon }]) => {
        const term = new Terminal({
          theme: {
            background: 'transparent',
            foreground: '#cdd6f4',
            cursor: '#cba6f7',
          },
          fontFamily: 'monospace',
          fontSize: 12,
          cursorBlink: true,
        });
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current!);
        fitAddon.fit();

        termInstance.current = term;
        fitAddonInstance.current = fitAddon;
        setIsTerminalReady(true);
      });
    }
  }, [activeTab]);

  // Handle socket binding separately
  useEffect(() => {
    const term = termInstance.current;
    if (term && socket && workspaceId && isTerminalReady) {
      const onDataDisposable = term.onData((data: string) => {
        socket.emit('pty:data', data);
      });

      socket.emit('pty:stop');
      socket.emit('pty:start', { workspaceId, files, language: language || 'typescript' });

      const onSocketData = (data: string) => {
        term.write(data);
        
        // Parse for compiler errors
        const cleanText = data.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
        ptyBufferRef.current += cleanText;
        const lines = ptyBufferRef.current.split('\n');
        
        if (lines.length > 1) {
          ptyBufferRef.current = lines.pop() || '';
          
          const newProblems: any[] = [];
          const regex = /([a-zA-Z0-9_.-]+):(\d+):(?:(\d+):)?\s+(fatal error|error|warning):\s+(.*)/i;
          
          lines.forEach(line => {
            const match = line.match(regex);
            if (match) {
              newProblems.push({
                id: `prob-${Date.now()}-${Math.random()}`,
                severity: match[4].toLowerCase().includes('error') ? 'error' : 'warning',
                file: match[1],
                line: parseInt(match[2]),
                col: match[3] ? parseInt(match[3]) : 1,
                message: match[5],
                rule: 'compiler'
              });
            }
          });
          
          if (newProblems.length > 0) {
            setProblems(prev => {
              // Deduplicate
              const all = [...prev, ...newProblems];
              const unique = Array.from(new Map(all.map(item => [`${item.file}:${item.line}:${item.message}`, item])).values());
              return unique;
            });
          }
        }
      };

      const onConnect = () => {
        socket.emit('pty:stop');
        socket.emit('pty:start', { workspaceId, files, language: language || 'typescript' });
      };

      socket.on('pty:data', onSocketData);
      socket.on('connect', onConnect); // Auto-reconnect terminal on network drop

      return () => {
        onDataDisposable.dispose();
        socket.off('pty:data', onSocketData);
        socket.off('connect', onConnect);
      };
    }
  }, [socket, workspaceId, language, isTerminalReady]); // Deliberately omitting `files` so it doesn't restart PTY on save

  useEffect(() => {
    const handleResize = () => {
      if (fitAddonInstance.current && activeTab === 'terminal') {
        fitAddonInstance.current.fit();
        const dims = fitAddonInstance.current.proposeDimensions();
        if (dims && socket) socket.emit('pty:resize', { cols: dims.cols, rows: dims.rows });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab, socket]);

  useEffect(() => {
    if (fitAddonInstance.current && activeTab === 'terminal') {
      setTimeout(() => {
        fitAddonInstance.current.fit();
        const dims = fitAddonInstance.current.proposeDimensions();
        if (dims && socket) socket.emit('pty:resize', { cols: dims.cols, rows: dims.rows });
      }, 50);
    }
  }, [height, activeTab, socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    activeTabRef.current = activeTab;
    if (activeTab === 'chat') {
      setHasUnreadChat(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!socket) return;
    
    const handleChatMessage = (data: any) => {
      // Prevent duplicates if we already added it locally
      setChatMessages(prev => {
        if (prev.find(m => m.id === data.id)) return prev;
        
        // If we are not currently viewing the chat tab, show the unread dot
        if (activeTabRef.current !== 'chat') {
          setHasUnreadChat(true);
        }
        
        return [...prev, data];
      });
    };
    
    socket.on('chat:message', handleChatMessage);
    
    return () => {
      socket.off('chat:message', handleChatMessage);
    };
  }, [socket]);

  useEffect(() => {
    // Parse runOutput for errors when Run is used
    if (runOutput.length === 0) {
      setProblems([]);
      return;
    }
    
    const newProblems: any[] = [];
    const regex = /([a-zA-Z0-9_.-]+):(\d+):(?:(\d+):)?\s+(fatal error|error|warning):\s+(.*)/i;
    
    runOutput.forEach(line => {
      const match = line.match(regex);
      if (match) {
        newProblems.push({
          id: `prob-run-${Date.now()}-${Math.random()}`,
          severity: match[4].toLowerCase().includes('error') ? 'error' : 'warning',
          file: match[1],
          line: parseInt(match[2]),
          col: match[3] ? parseInt(match[3]) : 1,
          message: match[5],
          rule: 'compiler'
        });
      }
    });
    
    if (newProblems.length > 0) {
      setProblems(prev => {
        const all = [...prev, ...newProblems];
        const unique = Array.from(new Map(all.map(item => [`${item.file}:${item.line}:${item.message}`, item])).values());
        return unique;
      });
    }
  }, [runOutput]);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const delta = startY.current - e.clientY;
    const newH = Math.min(500, Math.max(120, startH.current + delta));
    setHeight(newH);
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizing.current = true;
    startY.current = e.clientY;
    startH.current = height;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: `cm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      author: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You',
      avatar: user ? (user.user_metadata?.full_name?.substring(0, 2).toUpperCase() || 'U') : 'U',
      color: '#6366f1',
      content: chatInput.trim(),
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    };

    // Add locally for instant feedback
    setChatMessages((prev) => [...prev, msg]);
    setChatInput('');

    // Broadcast to other collaborators
    if (socket && workspaceId) {
      socket.emit('chat:send', { roomId: workspaceId, message: msg });
    }
  };

  const runTerminalCommand = async () => {
    if (!terminalInput.trim()) return;
    const cmd = terminalInput;
    setTerminalInput('');
    setTerminalHistory((prev) => [...prev, `$ ${cmd}`]);

    if (onRunTerminalCommand) {
      const output = await onRunTerminalCommand(cmd);
      setTerminalHistory((prev) => [...prev, ...output]);
    } else {
      setTerminalHistory((prev) => [...prev, `→  command executed`]);
    }
  };

  const restartTerminal = () => {
    if (socket && workspaceId) {
      termInstance.current?.clear();
      termInstance.current?.writeln('\r\n[Starting new terminal session...]\r\n');
      setProblems([]); // Clear problems on restart
      socket.emit('pty:stop');
      setTimeout(() => {
        socket.emit('pty:start', { workspaceId, files, language: language || 'typescript' });
      }, 100);
    }
  };

  const closeTerminal = () => {
    if (socket) {
      termInstance.current?.clear();
      socket.emit('pty:stop');
      termInstance.current?.writeln('\r\n[Terminal process stopped. Click + to restart]\r\n');
    }
  };

  const errorCount = problems.filter((p) => p.severity === 'error').length;
  const warnCount = problems.filter((p) => p.severity === 'warning').length;

  const tabs = [
    { key: 'terminal' as const, icon: <Terminal size={13} />, label: 'Terminal' },
    {
      key: 'output' as const,
      icon: <FileText size={13} />,
      label: 'Output',
      badge: isRunning ? '●' : undefined,
    },
    {
      key: 'problems' as const,
      icon: <AlertCircle size={13} />,
      label: 'Problems',
      badge: errorCount > 0 ? String(errorCount) : undefined,
      badgeColor: 'text-red-500',
    },
    {
      key: 'chat' as const,
      icon: <MessageSquare size={13} />,
      label: 'Chat',
      badge: hasUnreadChat ? '●' : undefined,
      badgeColor: 'text-green-500',
    },
  ];

  return (
    <div
      className="flex flex-col flex-shrink-0 border-t monochrome-panel !border-x-0 !border-b-0 !rounded-none"
      style={{
        height: isCollapsed ? '36px' : `${height}px`,
        transition: 'height 0.2s ease',
      }}
    >
      {/* Resize handle */}
      {!isCollapsed && (
        <div
          className="h-1 cursor-ns-resize flex-shrink-0 hover:bg-primary/30 transition-colors duration-150"
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Tab bar */}
      <div
        className="flex items-center border-b flex-shrink-0"
        style={{ borderColor: 'var(--ide-panel-border)' }}
      >
        <div className="flex items-stretch flex-1 overflow-x-auto tab-scrollbar">
          {tabs.map((tab) => (
            <button
              key={`bottom-tab-${tab.key}`}
              onClick={() => {
                setActiveTab(tab.key);
                if (isCollapsed) setIsCollapsed(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap border-r transition-all duration-200 ${activeTab === tab.key && !isCollapsed
                  ? 'text-primary bg-background/50 border-b-2 border-b-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground border-b-2 border-b-transparent'
                }`}
              style={{ borderRightColor: 'var(--ide-panel-border)' }}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span className={`text-xs font-bold ${tab.badgeColor ?? 'text-primary'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 px-2 flex-shrink-0">
          {isRunning && (
            <span className="flex items-center gap-1 text-xs text-[#8b5cf6]">
              <Loader2 size={10} className="animate-spin" />
              Running
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ide-btn w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-all duration-150"
          >
            {isCollapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Panel content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-hidden min-h-0">
          {/* Terminal */}
          <div
            className={`h-full flex flex-col terminal-scrollbar relative ${activeTab === 'terminal' ? '' : 'hidden'}`}
            style={{ background: 'var(--ide-terminal)', color: 'var(--ide-terminal-foreground)' }}
          >
            {/* Terminal Actions */}
            <div className="absolute top-2 right-4 flex items-center gap-1.5 z-10 opacity-40 hover:opacity-100 transition-opacity duration-200">
              {onRunInTerminal && (
                <button
                  onClick={onRunInTerminal}
                  title="Run Active File in Terminal"
                  className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                >
                  <Play size={14} className="text-[#a6e3a1]" />
                </button>
              )}
              <button
                onClick={restartTerminal}
                title="New Terminal"
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
              >
                <Plus size={14} className="text-[#cdd6f4]" />
              </button>
              <button
                onClick={closeTerminal}
                title="Close Terminal"
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
              >
                <Trash size={14} className="text-[#f38ba8]" />
              </button>
            </div>
            <div className="flex-1 w-full h-full p-2" ref={terminalRef} />
          </div>

          {/* Output */}
          <div
            className={`h-full overflow-y-auto terminal-scrollbar p-3 font-mono text-sm leading-relaxed ${activeTab === 'output' ? '' : 'hidden'}`}
            style={{ background: 'var(--ide-terminal)', color: 'var(--ide-terminal-foreground)' }}
          >
            {runOutput.length === 0 && !isRunning && (
              <div className="text-[#4a5568] italic">
                No output yet — click Run to execute your code
              </div>
            )}
            {isRunning && runOutput.length === 0 && (
              <div className="flex items-center gap-2 text-[#cba6f7]">
                <Loader2 size={12} className="animate-spin" />
                Initializing execution environment...
              </div>
            )}
            {runOutput.map((line, i) => {
              const isSuccess = line.startsWith('✓');
              const isError = line.startsWith('✗') || line.toLowerCase().includes('error');
              const isInfo = line.startsWith('>') || line.startsWith('→') || line.startsWith('←');
              const isCommand = line.startsWith('$');
              return (
                <div
                  key={`output-${i}`}
                  className={`mb-0.5 ${isSuccess
                      ? 'text-[#a6e3a1]'
                      : isError
                        ? 'text-[#f38ba8]'
                        : isInfo
                          ? 'text-[#89b4fa]'
                          : isCommand
                            ? 'text-[#cba6f7]'
                            : 'text-[#cdd6f4]'
                    }`}
                >
                  {line || '\u00A0'}
                </div>
              );
            })}
          </div>

          {/* Problems */}
          {activeTab === 'problems' && (
            <div className="h-full overflow-y-auto ide-scrollbar">
              {problems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <CheckCircle2 size={20} className="text-accent mb-2" />
                  <p className="text-sm text-muted-foreground">No problems detected</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 px-3 py-2 border-b border-border text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 text-red-500">
                      <XCircle size={11} />
                      {errorCount} error{errorCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1 text-amber-500">
                      <AlertCircle size={11} />
                      {warnCount} warning{warnCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {problems.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-start gap-2.5 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border/50 transition-colors duration-100"
                    >
                      {p.severity === 'error' ? (
                        <XCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                      ) : p.severity === 'warning' ? (
                        <AlertCircle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Info size={13} className="text-primary flex-shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground leading-relaxed">{p.message}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground font-mono">{p.file}</span>
                          <span className="text-xs text-muted-foreground">
                            Ln {p.line}, Col {p.col}
                          </span>
                          <span className="text-xs text-muted-foreground/60">{p.rule}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat */}
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto ide-scrollbar p-3 space-y-3 min-h-0">
                {chatMessages.map((msg) => {
                  const currentUserAuthor = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You';
                  const isMe = msg.author === currentUserAuthor;

                  return (
                    <div key={msg.id} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5 shadow-sm"
                        style={{ backgroundColor: msg.color }}
                      >
                        {msg.avatar}
                      </div>
                      <div className={`min-w-0 max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className="text-xs font-semibold text-foreground">{isMe ? 'You' : msg.author}</span>
                          <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                        </div>
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-muted text-foreground rounded-tl-sm'
                          }`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <div
                className="flex items-center gap-2 px-3 py-2 border-t flex-shrink-0"
                style={{ borderColor: 'var(--ide-panel-border)' }}
              >
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') sendChat();
                  }}
                  placeholder="Message the team..."
                  className="flex-1 text-sm bg-background border border-input rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-150"
                />
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim()}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all duration-150 flex-shrink-0"
                >
                  <Send size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
