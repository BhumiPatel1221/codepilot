'use client';

import React, { useState, useRef } from 'react';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FilePlus,
  FolderPlus,
  MoreHorizontal,
  Trash2,
  Edit3,
  Search,
  GitBranch,
  RefreshCw,
} from 'lucide-react';
import type { Collaborator, FileNode } from '@/features/ide-workspace/types';

interface Props {
  files: FileNode[];
  setFiles: React.Dispatch<React.SetStateAction<FileNode[]>>;
  activeFileId?: string;
  onOpenFile: (file: FileNode) => void;
  collaborators: Collaborator[];
  isReadOnly?: boolean;
}

const fileIconColor: Record<string, string> = {
  typescript: '#3178c6',
  javascript: '#f1e05a',
  python: '#3776ab',
  json: '#f59e0b',
  markdown: '#94a3b8',
  plaintext: '#94a3b8',
};

function FileIcon({ language, name }: { language?: string; name: string }) {
  const ext = name.split('.').pop() ?? '';
  const lang =
    language ??
    (ext === 'ts'
      ? 'typescript'
      : ext === 'js'
        ? 'javascript'
        : ext === 'py'
          ? 'python'
          : ext === 'json'
            ? 'json'
            : ext === 'md'
              ? 'markdown'
              : 'plaintext');
  return (
    <File size={13} style={{ color: fileIconColor[lang] ?? '#94a3b8' }} className="flex-shrink-0" />
  );
}

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  activeFileId?: string;
  onOpenFile: (file: FileNode) => void;
  collaborators: Collaborator[];
  onUpdateFiles: (updater: (files: FileNode[]) => FileNode[]) => void;
}

function TreeNode({
  node,
  depth,
  activeFileId,
  onOpenFile,
  collaborators,
  onUpdateFiles,
}: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(node.isOpen ?? false);
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const renameRef = useRef<HTMLInputElement>(null);

  const activeCollabsInFile = collaborators.filter((c) => c.currentFile === node.id && c.isActive);

  const handleRename = () => {
    if (renameValue.trim() && renameValue !== node.name) {
      onUpdateFiles((prev) => {
        const renameNode = (nodes: FileNode[]): FileNode[] => {
          return nodes.map((n) => {
            if (n.id === node.id) {
              return { ...n, name: renameValue.trim() };
            }
            if (n.children) {
              return { ...n, children: renameNode(n.children) };
            }
            return n;
          });
        };
        return renameNode(prev);
      });
    }
    setIsRenaming(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', node.id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === node.id || node.type !== 'folder') return;
    
    onUpdateFiles((prev) => {
      let draggedNode: FileNode | null = null;
      const removeNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.filter(n => {
          if (n.id === draggedId) {
            draggedNode = n;
            return false;
          }
          return true;
        }).map(n => {
          if (n.children) return { ...n, children: removeNode(n.children) };
          return n;
        });
      };
      
      let newFiles = removeNode(prev);
      if (draggedNode) {
        const insertNode = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(n => {
            if (n.id === node.id) {
              return { ...n, children: [...(n.children || []), draggedNode!] };
            }
            if (n.children) return { ...n, children: insertNode(n.children) };
            return n;
          });
        };
        newFiles = insertNode(newFiles);
        setIsOpen(true);
      }
      return newFiles;
    });
  };

  if (node.type === 'folder') {
    return (
      <div>
        <div
          draggable
          onDragStart={handleDragStart}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="file-tree-item group flex items-center gap-1 px-2 py-0.5 cursor-pointer rounded-sm select-none"
          style={{ paddingLeft: `${8 + depth * 12}px` }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-muted-foreground flex-shrink-0">
            {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
          <span className="text-muted-foreground flex-shrink-0">
            {isOpen ? (
              <FolderOpen size={13} className="text-[#f59e0b]" />
            ) : (
              <Folder size={13} className="text-[#f59e0b]" />
            )}
          </span>
          {isRenaming ? (
            <input
              ref={renameRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
              className="flex-1 text-sm bg-input border border-ring rounded px-1 text-foreground focus:outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm text-foreground font-medium truncate flex-1">{node.name}</span>
          )}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 flex-shrink-0"
            >
              <MoreHorizontal size={11} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-0.5 bg-card border border-border rounded-lg shadow-dropdown z-50 overflow-hidden animate-scale-in w-36">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRenaming(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors duration-100"
                >
                  <Edit3 size={11} className="text-muted-foreground" />
                  Rename
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onUpdateFiles((prev) => {
                      const removeNode = (nodes: FileNode[]): FileNode[] => {
                        return nodes.filter(n => n.id !== node.id).map(n => {
                          if (n.children) return { ...n, children: removeNode(n.children) };
                          return n;
                        });
                      };
                      return removeNode(prev);
                    });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-100"
                >
                  <Trash2 size={11} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        {isOpen && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                activeFileId={activeFileId}
                onOpenFile={onOpenFile}
                collaborators={collaborators}
                onUpdateFiles={onUpdateFiles}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`file-tree-item group flex items-center gap-1.5 px-2 py-0.5 cursor-pointer rounded-sm select-none ${
        activeFileId === node.id ? 'active' : ''
      }`}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
      onClick={() => onOpenFile(node)}
    >
      <FileIcon language={node.language} name={node.name} />
      {isRenaming ? (
        <input
          ref={renameRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') setIsRenaming(false);
          }}
          className="flex-1 text-sm bg-input border border-ring rounded px-1 text-foreground focus:outline-none"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="text-sm text-foreground truncate flex-1">{node.name}</span>
      )}

      {/* Collaborator presence dots */}
      {activeCollabsInFile.length > 0 && (
        <div className="flex -space-x-0.5 flex-shrink-0">
          {activeCollabsInFile.slice(0, 2).map((c) => (
            <div
              key={`dot-${c.id}`}
              className="w-1.5 h-1.5 rounded-full border border-ide-sidebar"
              style={{ backgroundColor: c.color }}
              title={c.name}
            />
          ))}
        </div>
      )}

      <div className="relative flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
        >
          <MoreHorizontal size={11} />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-0.5 bg-card border border-border rounded-lg shadow-dropdown z-50 overflow-hidden animate-scale-in w-36">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors duration-100"
            >
              <Edit3 size={11} className="text-muted-foreground" />
              Rename
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onUpdateFiles((prev) => {
                  const removeNode = (nodes: FileNode[]): FileNode[] => {
                    return nodes.filter(n => n.id !== node.id).map(n => {
                      if (n.children) return { ...n, children: removeNode(n.children) };
                      return n;
                    });
                  };
                  return removeNode(prev);
                });
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-100"
            >
              <Trash2 size={11} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type SidebarTab = 'explorer' | 'search' | 'git';

export default function FileExplorer({
  files,
  setFiles,
  activeFileId,
  onOpenFile,
  collaborators,
  isReadOnly,
}: Props) {
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('explorer');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateNode = (type: 'file' | 'folder') => {
    const name = window.prompt(`Enter ${type} name:`, `new_${type}${type === 'file' ? '.js' : ''}`);
    if (!name) return;

    let language = 'javascript';
    if (type === 'file') {
      const ext = name.split('.').pop()?.toLowerCase();
      if (ext === 'ts') language = 'typescript';
      else if (ext === 'py') language = 'python';
      else if (ext === 'java') language = 'java';
      else if (ext === 'cpp') language = 'cpp';
      else if (ext === 'json') language = 'json';
      else if (ext === 'md') language = 'markdown';
      else if (ext === 'txt') language = 'plaintext';
    }

    const newNode: FileNode = {
      id: `${type}-${Date.now()}`,
      name,
      type,
      ...(type === 'folder' ? { isOpen: false, children: [] } : { content: '', language })
    };
    setFiles(prev => [newNode, ...prev]);
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId) return;

    setFiles((prev) => {
      let draggedNode: FileNode | null = null;
      const checkRoot = prev.find(n => n.id === draggedId);
      if (checkRoot) return prev;

      const removeNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.filter(n => {
          if (n.id === draggedId) {
            draggedNode = n;
            return false;
          }
          return true;
        }).map(n => {
          if (n.children) return { ...n, children: removeNode(n.children) };
          return n;
        });
      };
      const newFiles = removeNode(prev);
      if (draggedNode) {
        return [...newFiles, draggedNode];
      }
      return newFiles;
    });
  };

  return (
    <div
      className="absolute z-40 h-full md:relative w-[280px] md:w-[220px] xl:w-[240px] flex-shrink-0 flex flex-col border-r ide-scrollbar overflow-hidden monochrome-panel bg-background shadow-2xl md:shadow-none"
      style={{ borderColor: 'var(--ide-sidebar-border)' }}
    >
      {/* Tab strip */}
      <div
        className="flex items-center border-b flex-shrink-0"
        style={{ borderColor: 'var(--ide-sidebar-border)' }}
      >
        {(
          [
            { key: 'explorer', icon: <FolderOpen size={14} />, label: 'Explorer' },
            { key: 'search', icon: <Search size={14} />, label: 'Search' },
            { key: 'git', icon: <GitBranch size={14} />, label: 'Git' },
          ] as const
        ).map((tab) => (
          <button
            key={`sidebar-tab-${tab.key}`}
            onClick={() => setSidebarTab(tab.key)}
            className={`flex-1 flex items-center justify-center py-2 transition-all duration-150 ${
              sidebarTab === tab.key
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
            }`}
            title={tab.label}
          >
            {tab.icon}
          </button>
        ))}
      </div>

      {sidebarTab === 'explorer' && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 flex-shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Explorer
            </span>
            {!isReadOnly && (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => handleCreateNode('file')}
                  className="ide-btn w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-all duration-150"
                  title="New file"
                >
                  <FilePlus size={13} />
                </button>
                <button
                  onClick={() => handleCreateNode('folder')}
                  className="ide-btn w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-all duration-150"
                  title="New folder"
                >
                  <FolderPlus size={13} />
                </button>
                <button
                  className="ide-btn w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-all duration-150"
                  title="Refresh"
                >
                  <RefreshCw size={11} />
                </button>
              </div>
            )}
          </div>

          {/* File tree */}
          <div 
            className="flex-1 overflow-y-auto ide-scrollbar py-1"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleRootDrop}
          >
            {files.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                activeFileId={activeFileId}
                onOpenFile={onOpenFile}
                collaborators={collaborators}
                onUpdateFiles={(updater) => setFiles(updater)}
              />
            ))}
          </div>

          {/* Collaborator presence */}
          <div
            className="border-t px-3 py-2 flex-shrink-0"
            style={{ borderColor: 'var(--ide-sidebar-border)' }}
          >
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Online now
            </div>
            <div className="space-y-1.5">
              {collaborators.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <div className="relative">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.avatar}
                    </div>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-ide-sidebar ${
                        c.isActive ? 'bg-primary' : 'bg-muted-foreground'
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-foreground truncate">{c.name}</div>
                    {c.isActive && c.currentFile && (
                      <div className="text-xs text-muted-foreground truncate">
                        {c.currentFile === 'file-main'
                          ? 'main.ts'
                          : c.currentFile === 'file-users'
                            ? 'users.ts'
                            : 'viewing...'}
                      </div>
                    )}
                  </div>
                  {c.isActive && (
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-pulse-soft flex-shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {sidebarTab === 'search' && (
        <div className="flex-1 flex flex-col p-3 gap-3">
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-7 pr-3 py-1.5 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-150"
            />
          </div>
          {searchQuery ? (
            <div className="text-xs text-muted-foreground">
              Searching for{' '}
              <span className="text-foreground font-medium">&quot;{searchQuery}&quot;</span>...
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-8">
              Type to search across all files
            </div>
          )}
        </div>
      )}

      {sidebarTab === 'git' && (
        <div className="flex-1 flex flex-col p-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Source Control
          </div>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch size={12} className="text-muted-foreground" />
            <span className="text-sm text-foreground font-medium">main</span>
            <span className="text-xs text-muted-foreground ml-auto">↑ 2 ↓ 0</span>
          </div>
          <div className="space-y-1">
            {[].map((f: { name: string; status: string; color: string }) => (
              <div
                key={`git-${f.name}`}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted transition-colors duration-100"
              >
                <span className={`text-xs font-bold ${f.color}`}>{f.status}</span>
                <span className="text-sm text-foreground font-mono">{f.name}</span>
              </div>
            ))}
          </div>
          <button className="mt-3 w-full btn-primary py-1.5 rounded-lg text-sm font-medium">
            Commit changes
          </button>
        </div>
      )}
    </div>
  );
}
