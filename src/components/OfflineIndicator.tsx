import { WifiOff, RefreshCw } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { syncQueueToSupabase } from '../lib/syncManager';
import { Button } from './ui/button';
import { getPendingSyncCount } from '../services/transactionService';

export function OfflineIndicator() {
  const isOnline = useStore((s) => s.isOnline);
  const pendingSyncCount = useStore((s) => s.pendingSyncCount);
  const setPendingSyncCount = useStore((s) => s.setPendingSyncCount);

  async function handleSync() {
    await syncQueueToSupabase();
    const count = await getPendingSyncCount();
    setPendingSyncCount(count);
  }

  if (isOnline && pendingSyncCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-2 border-t border-amber-200 bg-amber-50 px-4 py-2 text-amber-900">
      <span className="flex items-center gap-2 text-sm font-medium">
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4" />
            Offline mode
            {pendingSyncCount > 0 && ` · ${pendingSyncCount} pending`}
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            {pendingSyncCount} change{pendingSyncCount !== 1 ? 's' : ''} pending sync
          </>
        )}
      </span>
      {isOnline && pendingSyncCount > 0 && (
        <Button size="sm" variant="secondary" onClick={handleSync}>
          Sync now
        </Button>
      )}
    </div>
  );
}
