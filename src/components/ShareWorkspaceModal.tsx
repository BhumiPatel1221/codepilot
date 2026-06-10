import React, { useState } from 'react';
import { X, Users, Mail, Loader2, Share2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
}

export default function ShareWorkspaceModal({ isOpen, onClose, workspaceId, workspaceName }: Props) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (email === user?.email) {
      setError("You cannot invite yourself.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          workspaceName,
          inviterId: user?.id,
          inviterEmail: user?.email,
          inviteeEmail: email,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative monochrome-card rounded-2xl shadow-modal w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Share2 size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Share Workspace</h2>
              <p className="text-xs text-muted-foreground">Invite a collaborator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-6">

          <form onSubmit={handleShare} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Permission</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('viewer')}
                  className={`py-2 px-3 text-sm rounded-lg border transition-all ${
                    role === 'viewer'
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-input bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Viewer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('editor')}
                  className={`py-2 px-3 text-sm rounded-lg border transition-all ${
                    role === 'editor'
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-input bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Editor
                </button>
              </div>
            </div>

            {error && <div className="text-xs text-red-500 font-medium bg-red-500/10 p-2 rounded-md">{error}</div>}
            {success && <div className="text-xs text-green-500 font-medium bg-green-500/10 p-2 rounded-md">{success}</div>}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground bg-muted rounded-lg hover:text-foreground hover:bg-muted/80 transition-all duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !email}
                className="flex-1 btn-primary flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-60"
                style={{ minWidth: '140px' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invite'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
