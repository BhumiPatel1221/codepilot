'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Play, Star, Lock, Globe, CheckCircle2, XCircle, AlertCircle, MoreHorizontal, Edit3, Trash2, Share2 } from 'lucide-react';
import type { WorkspaceData } from './HomepageContent';

interface Props {
  workspace: WorkspaceData;
  onRename: (ws: WorkspaceData) => void;
  onDelete: (ws: WorkspaceData) => void;
  onShare: (ws: WorkspaceData) => void;
}

const statusConfig = {
  success: {
    icon: <CheckCircle2 size={11} />,
    color: 'text-accent',
    bg: 'bg-accent/10',
    label: 'Passing',
  },
  error: {
    icon: <XCircle size={11} />,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950/30',
    label: 'Failed',
  },
  warning: {
    icon: <AlertCircle size={11} />,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    label: 'Warning',
  },
};

const languageColors: Record<string, string> = {
  typescript: '#3178c6',
  javascript: '#f1e05a',
  python: '#3776ab',
  java: '#b07219',
  cpp: '#f34b7d',
  rust: '#dea584',
};

export default function WorkspaceCard({ workspace, onRename, onDelete, onShare }: Props) {
  const [showMenu, setShowMenu] = React.useState(false);
  const languageColor = languageColors[workspace.language?.toLowerCase()] || '#94a3b8';
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Link href={`/ide-workspace?id=${workspace.id}`}>
      <div className="monochrome-card rounded-xl p-4 cursor-pointer group hover:-translate-y-1 hover:border-primary transition-all duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-semibold text-foreground truncate font-mono group-hover:text-primary transition-colors duration-150">
                {workspace.name}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {workspace.description || 'No description provided.'}
            </p>
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowMenu(!showMenu);
              }}
              className="ml-2 flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
            >
              <MoreHorizontal size={13} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-32 monochrome-card rounded-lg shadow-dropdown z-50 overflow-hidden animate-scale-in">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowMenu(false);
                    onShare(workspace);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors duration-100"
                >
                  <Share2 size={13} className="text-muted-foreground" />
                  Share
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowMenu(false);
                    onRename(workspace);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors duration-100"
                >
                  <Edit3 size={13} className="text-muted-foreground" />
                  Rename
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowMenu(false);
                    onDelete(workspace);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-100"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Language + status */}
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: languageColor }}
            />
            {workspace.language || 'TypeScript'}
          </span>
          <span className="text-muted-foreground/30">·</span>
          {workspace.visibility === 'private' ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock size={12} />
              Private
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Globe size={12} />
              Public
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          {/* Owner details */}
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full border-2 border-card flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 bg-primary"
              title={workspace.ownerName || 'User'}
            >
              {(workspace.ownerName || 'U').substring(0, 2).toUpperCase()}
            </div>
            <span className="text-xs text-muted-foreground">
              {workspace.ownerName || 'User'}
            </span>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDate(workspace.lastSavedAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
