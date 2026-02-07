import { WifiOff } from 'lucide-react';
import { useStore } from '../stores/useStore';

export function OfflineIndicator() {
  const isOnline = useStore((s) => s.isOnline);

  if (isOnline) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>You're offline. Connect to the internet to use the app.</span>
    </div>
  );
}
