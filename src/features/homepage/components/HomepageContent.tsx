'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import {
  Plus,
  Users,
  Play,
  Zap,
  Globe,
  Moon,
  Sun,
  Terminal,
  Cpu,
  Sparkles,
  FolderOpen,
  LogOut,
  User
} from 'lucide-react';
import AnimatedEditorPreview from '@/features/homepage/components/AnimatedEditorPreview';
import CreateWorkspaceModal from '@/features/homepage/components/CreateWorkspaceModal';
import WorkspaceCard from '@/features/homepage/components/WorkspaceCard';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/NotificationBell';
import ShareWorkspaceModal from '@/components/ShareWorkspaceModal';

export interface WorkspaceData {
  id: string;
  name: string;
  description: string;
  language: string;
  visibility: 'private' | 'public';
  ownerId: string;
  ownerName: string;
  lastSavedAt: string;
  files: unknown;
}

export default function HomepageContent() {
  const [isDark, setIsDark] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [shareWorkspaceId, setShareWorkspaceId] = useState<string | null>(null);
  const [shareWorkspaceName, setShareWorkspaceName] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'recent' | 'shared' | 'public'>('all');
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const { user, signOut } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem('codepilot-theme');
    if (saved === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const fetchWorkspaces = async () => {
    setLoadingWorkspaces(true);
    try {
      const url = user
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/workspaces?userId=${user.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/workspaces`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces || []);
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  const handleDeleteWorkspace = async (ws: WorkspaceData) => {
    if (!window.confirm(`Are you sure you want to delete workspace "${ws.name}"?`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/workspace/${ws.id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchWorkspaces();
    } catch (e) { console.error('Delete failed', e); }
  };

  const handleRenameWorkspace = async (ws: WorkspaceData) => {
    const newName = window.prompt('Enter new workspace name:', ws.name);
    if (!newName || newName === ws.name) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/save-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ws, workspaceId: ws.id, name: newName })
      });
      if (res.ok) fetchWorkspaces();
    } catch (e) { console.error('Rename failed', e); }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

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

  const filtered = workspaces.filter((ws) => {
    if (filter === 'all') return true;
    if (filter === 'recent') return true;
    if (filter === 'shared') return ws.ownerId !== user?.id;
    if (filter === 'public') return ws.visibility === 'public';
    return true;
  });

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative z-0">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none -z-10" />
      {/* Topbar */}
      <header className="sticky top-0 z-40 monochrome-card !rounded-none !border-l-0 !border-r-0 !border-t-0">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <AppLogo size={28} />
              <span className="font-semibold text-[15px] tracking-tight text-foreground">
                CodePilot
              </span>
            </Link>

          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="ide-btn w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {user && <NotificationBell />}

            {user ? (
              <div className="relative ml-2">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full bg-muted/50 hover:bg-muted transition-colors border border-border"
                >
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
                    {getInitials(user.user_metadata?.full_name || user.email)}
                  </div>
                  <span className="text-sm font-medium">
                    {user.user_metadata?.full_name?.split(' ')[0] || 'User'}
                  </span>
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 monochrome-card rounded-xl shadow-dropdown py-1 z-50 animate-scale-in">
                    <div className="px-3 py-2 border-b border-border/50">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="p-1">
                      <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted text-foreground transition-colors">
                        <User size={14} className="text-muted-foreground" /> Profile
                      </button>
                      <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 text-foreground transition-colors mt-1"
                      >
                        <LogOut size={14} /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/sign-up-login-screen"
                  className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md transition-colors duration-150"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up-login-screen"
                  className="btn-primary text-sm font-medium px-4 py-1.5 rounded-md"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Background Gradients Removed for flat monochrome design */}

      {/* Hero */}
      {/* Hero section */}
      <section id="working" className="relative max-w-screen-2xl mx-auto px-6 pt-20 pb-16">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-8 border border-primary/20">
              <Sparkles size={14} />
              AI-powered collaboration — now in beta
            </div>
            <h1 className="text-[48px] xl:text-[60px] font-extrabold leading-[1.05] tracking-tight text-foreground mb-6">
              Code together,
              <br />
              <span className="text-primary">ship faster</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-[500px]">
              A real-time collaborative IDE with AI assistance, instant code execution, and
              workspace persistence. From first commit to production.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  if (!user) {
                    window.location.href = '/sign-up-login-screen';
                    return;
                  }
                  setShowCreateModal(true);
                }}
                className="btn-primary flex items-center gap-2 px-6 py-3 rounded-lg text-base font-semibold shadow-md transition-all hover:-translate-y-0.5"
              >
                <Plus size={18} />
                New workspace
              </button>
            </div>
            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-6 mt-10 text-sm font-medium text-muted-foreground">
              {[
                { icon: <Zap size={14} />, text: 'Sub-100ms execution' },
                { icon: <Users size={14} />, text: 'Up to 12 collaborators' },
                { icon: <Cpu size={14} />, text: '5 language runtimes' },
                { icon: <Globe size={14} />, text: 'Always-on workspaces' },
              ].map((item) => (
                <div key={`trust-${item.text}`} className="flex items-center gap-1.5">
                  <span className="text-primary">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Animated editor preview */}
          <div className="hidden xl:block animate-float">
            <AnimatedEditorPreview isDark={isDark} />
          </div>
        </div>
      </section>

      {/* Workspace list */}
      <section id="workspaces" className="max-w-screen-2xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Recent workspaces</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Pick up where you left off</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter tabs */}
            <div className="hidden sm:flex items-center gap-1 monochrome-card !rounded-lg p-1">
              {(['all', 'recent', 'shared', 'public'] as const).map((f) => (
                <button
                  key={`filter-${f}`}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                    filter === f
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            {user && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              >
                <Plus size={13} />
                New
              </button>
            )}
          </div>
        </div>

        {loadingWorkspaces ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Loading workspaces...</p>
          </div>
        ) : (
          <>
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
                {filtered.map((ws) => (
                  <WorkspaceCard 
                    key={ws.id} 
                    workspace={ws} 
                    onRename={handleRenameWorkspace} 
                    onDelete={handleDeleteWorkspace} 
                    onShare={() => {
                      setShareWorkspaceId(ws.id);
                      setShareWorkspaceName(ws.name);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                  <FolderOpen size={22} className="text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">No workspaces yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                  {user ? "Create your first workspace to start coding and collaborating." : "Sign in to create your first workspace."}
                </p>
                {user ? (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    <Plus size={14} />
                    Create workspace
                  </button>
                ) : (
                  <Link
                    href="/sign-up-login-screen"
                    className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* Feature strip */}
      <section className="border-t border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-transparent -z-10 pointer-events-none"></div>
        <div className="max-w-screen-2xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <Sparkles size={18} className="text-primary" />,
                title: 'AI code assistant',
                desc: 'Explain, fix, generate, and optimize — context-aware AI that knows your codebase.',
              },
              {
                icon: <Users size={18} className="text-accent" />,
                title: 'Real-time collaboration',
                desc: 'See live cursors, edits, and presence. Like Google Docs for your code.',
              },
              {
                icon: <Terminal size={18} className="text-[#f59e0b]" />,
                title: 'Instant execution',
                desc: 'Run Python, JS, TypeScript, Java, and C++ in isolated containers — zero setup.',
              },
            ].map((feat) => (
               <div
                key={`feat-${feat.title}`}
                className="flex gap-4 p-4 rounded-xl monochrome-card transition-all duration-300 hover:-translate-y-1 hover:border-primary group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <div>
                  <div className="text-base font-semibold text-foreground mb-1.5">{feat.title}</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 monochrome-card !border-x-0 !border-b-0 !rounded-none">
        <div className="max-w-screen-2xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AppLogo size={20} />
            <span className="text-sm font-medium text-foreground">CodePilot</span>
            <span className="text-xs text-muted-foreground ml-2">© 2026</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {['Privacy', 'Terms', 'Status', 'Docs', 'Blog'].map((l) => (
               <a
                key={`footer-${l}`}
                href="#"
                className="hover:text-foreground transition-colors duration-150"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {showCreateModal && <CreateWorkspaceModal onClose={() => {
        setShowCreateModal(false);
        fetchWorkspaces();
      }} />}

      <ShareWorkspaceModal
        isOpen={!!shareWorkspaceId}
        onClose={() => setShareWorkspaceId(null)}
        workspaceId={shareWorkspaceId || ''}
        workspaceName={shareWorkspaceName}
      />
    </div>
  );
}
