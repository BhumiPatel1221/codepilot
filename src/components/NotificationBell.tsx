import React, { useEffect, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user?.email) return;

    const fetchInvitations = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/invitations?email=${encodeURIComponent(user.email!)}`);
        if (res.ok) {
          const data = await res.json();
          setInvitations(data);
        }
      } catch (error) {
        console.error('Failed to fetch invitations:', error);
      }
    };

    fetchInvitations();
    // Poll every 10 seconds for new invitations
    const interval = setInterval(fetchInvitations, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleRespond = async (inv: any, status: 'accepted' | 'rejected') => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/invitations/${inv.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, userId: user?.id, userEmail: user?.email })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setInvitations(invitations.filter(i => i.id !== inv.id));
        setIsOpen(false);
        if (status === 'accepted') {
          toast.success(`Joined workspace: ${inv.workspaceName || 'Untitled'}`);
          router.push(`/ide-workspace?id=${inv.workspaceId}`);
        } else {
          toast.success('Invitation rejected');
        }
      } else {
        toast.error(data.error || 'Failed to respond to invitation');
        // If it's already processed or not found, remove from list
        if (res.status === 404 || res.status === 400) {
          setInvitations(invitations.filter(i => i.id !== inv.id));
        }
      }
    } catch (e) {
      console.error('Failed to respond to invitation', e);
      toast.error('Network error. Please try again.');
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-accent/50"
      >
        <Bell size={18} />
        {invitations.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/20">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {invitations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            ) : (
              invitations.map(inv => (
                <div key={inv.id} className="p-4 border-b border-border/50 hover:bg-muted/10 transition-colors">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{inv.inviterEmail}</span> invited you to edit workspace <span className="font-semibold">{inv.workspaceName || 'Untitled'}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mb-1">
                      Role: {inv.role}
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleRespond(inv, 'accepted')}
                        className="flex-1 flex items-center justify-center gap-1 bg-primary text-primary-foreground py-1.5 rounded-md text-xs font-medium hover:opacity-90 transition-opacity"
                      >
                        <Check size={14} /> Accept
                      </button>
                      <button 
                        onClick={() => handleRespond(inv, 'rejected')}
                        className="flex-1 flex items-center justify-center gap-1 bg-destructive/10 text-destructive py-1.5 rounded-md text-xs font-medium hover:bg-destructive/20 transition-colors"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
