'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Play,
  Moon,
  Sun,
  Share2,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Zap,
  PanelLeft,
  Loader2,
  GitBranch,
  CheckCircle2,
} from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import type { Collaborator } from '@/features/ide-workspace/types';
import { useAuth } from '@/context/AuthContext';
import ShareWorkspaceModal from '@/components/ShareWorkspaceModal';

interface Props {
  isDark: boolean;
  toggleTheme: () => void;
  isRunning: boolean;
  onRun: () => void;
  collaborators: Collaborator[];
  selectedLanguage: string;
  setSelectedLanguage: (l: string) => void;
  isAIPanelOpen: boolean;
  setIsAIPanelOpen: (v: boolean) => void;
  isExplorerOpen: boolean;
  setIsExplorerOpen: (v: boolean) => void;
  workspaceId?: string | null;
  workspaceName?: string;
  isReadOnly?: boolean;
}

const languages = ['TypeScript', 'Python', 'JavaScript', 'Java', 'C++', 'Rust'];

export default function IDETopBar({
  isDark,
  toggleTheme,
  isRunning,
  onRun,
  collaborators,
  selectedLanguage,
  setSelectedLanguage,
  isAIPanelOpen,
  setIsAIPanelOpen,
  isExplorerOpen,
  setIsExplorerOpen,
  workspaceId,
  workspaceName,
}: Props) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const activeCollabs = collaborators.filter((c) => c.isActive);

  return (
    <header className="monochrome-panel flex items-center gap-2 px-3 h-12 border-b flex-shrink-0 relative z-30 border-b-border/50">
      {/* Left: Logo + workspace */}
      <div className="flex items-center gap-2 min-w-0">
        <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
          <AppLogo size={20} />
          <span className="text-sm font-semibold text-foreground hidden sm:block">CodePilot</span>
        </Link>
        <span className="text-border hidden sm:block">/</span>
        <span className="text-sm font-medium text-foreground truncate hidden sm:block max-w-[140px]" title={workspaceName || 'Untitled Workspace'}>
          {workspaceName || 'Untitled Workspace'}
        </span>
        <span className="flex items-center gap-1 text-xs text-accent bg-accent/10 px-1.5 py-0.5 rounded-full flex-shrink-0 hidden sm:flex">
          <CheckCircle2 size={9} />
          Saved
        </span>
      </div>

      {/* Explorer toggle */}
      <button
        onClick={() => setIsExplorerOpen(!isExplorerOpen)}
        className={`ide-btn w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 ${
          isExplorerOpen
            ? 'text-primary bg-primary/10'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Toggle file explorer"
      >
        <PanelLeft size={14} />
      </button>

      {/* Center: Run controls */}
      <div className="flex-1 flex items-center justify-center gap-2">
        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="ide-btn flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground border border-border hover:border-border/60 transition-all duration-150"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor:
                  selectedLanguage === 'TypeScript'
                    ? '#3178c6'
                    : selectedLanguage === 'Python'
                      ? '#3776ab'
                      : selectedLanguage === 'JavaScript'
                        ? '#f1e05a'
                        : selectedLanguage === 'Java'
                          ? '#b07219'
                          : selectedLanguage === 'C++'
                            ? '#f34b7d'
                            : '#dea584',
              }}
            />
            {selectedLanguage}
            <ChevronDown size={11} />
          </button>
          {showLangMenu && (
            <div className="absolute top-full left-0 mt-1 monochrome-card rounded-lg shadow-dropdown z-50 overflow-hidden animate-scale-in min-w-[130px]">
              {languages.map((lang) => (
                <button
                  key={`lang-opt-${lang}`}
                  onClick={() => {
                    setSelectedLanguage(lang);
                    setShowLangMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted transition-colors duration-100 ${
                    selectedLanguage === lang ? 'text-primary font-medium' : 'text-foreground'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Run button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-150 ${
            isRunning
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-accent text-accent-foreground hover:opacity-90 active:scale-95 glow-accent'
          }`}
        >
          {isRunning ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              <span className="hidden sm:inline">Running...</span>
            </>
          ) : (
            <>
              <Play size={12} className="fill-current" />
              <span className="hidden sm:inline">Run</span>
            </>
          )}
        </button>

        {/* Git branch */}
        <button className="ide-btn hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-foreground border border-border hover:border-border/60 transition-all duration-150">
          <GitBranch size={12} />
          <span className="hidden lg:block">main</span>
        </button>
      </div>

      {/* Right: Collaborators + actions */}
      <div className="flex items-center gap-2">
        {/* Live collaborators */}
        <div className="hidden md:flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            {activeCollabs.map((c) => (
              <div
                key={c.id}
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 cursor-pointer"
                style={{ backgroundColor: c.color, borderColor: 'var(--ide-topbar)' }}
                title={`${c.name} — editing ${c.currentFile ?? 'unknown'}`}
              >
                {c.avatar}
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{activeCollabs.length} live</span>
        </div>

        {/* Share */}
        <div className="relative">
          <button
            onClick={handleShare}
            className="ide-btn flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground border border-border hover:border-primary/40 hover:text-primary transition-all duration-150"
          >
            <Share2 size={12} />
            <span className="hidden sm:block">Share</span>
          </button>
          {showShareToast && (
            <div className="absolute top-full right-0 mt-2 monochrome-card text-foreground text-sm px-3 py-1.5 rounded-lg shadow-dropdown whitespace-nowrap animate-scale-in z-50">
              Invite link copied!
            </div>
          )}
        </div>

        {/* AI panel toggle */}
        <button
          onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
          className={`ide-btn w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 ${
            isAIPanelOpen
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Toggle AI panel"
        >
          <Zap size={14} />
        </button>

        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="ide-btn w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-all duration-150"
          title="Toggle theme"
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-md hover:bg-muted transition-all duration-150"
          >
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
              {user ? (user.user_metadata?.full_name?.substring(0, 2).toUpperCase() || 'U') : 'U'}
            </div>
            <ChevronDown size={11} className="text-muted-foreground hidden sm:block" />
          </button>
          {showProfileMenu && (
            <div className="absolute top-full right-0 mt-1 monochrome-card rounded-xl shadow-dropdown z-50 overflow-hidden animate-scale-in w-44">
              <div className="px-3 py-2.5 border-b border-border/50">
                <div className="text-sm font-semibold text-foreground truncate">
                  {user?.user_metadata?.full_name || 'User'}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {user?.email || 'Not logged in'}
                </div>
              </div>
              {[
                { icon: <User size={13} />, label: 'Profile' },
                { icon: <Settings size={13} />, label: 'Settings' },
              ].map((item) => (
                <button
                  key={`profile-${item.label}`}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors duration-100"
                >
                  <span className="text-muted-foreground">{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <div className="border-t border-border mt-1">
                <button
                  onClick={async () => {
                    await signOut();
                    router.push('/sign-up-login-screen');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-100"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ShareWorkspaceModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        workspaceId={workspaceId || ''}
        workspaceName={`Workspace ${workspaceId?.slice(0,8) || ''}`}
      />
    </header>
  );
}
