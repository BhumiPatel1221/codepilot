import React, { Suspense } from 'react';
import IDEWorkspace from '@/features/ide-workspace/components/IDEWorkspace';

export default function IDEWorkspacePage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-background text-foreground">Loading workspace...</div>}>
      <IDEWorkspace />
    </Suspense>
  );
}
