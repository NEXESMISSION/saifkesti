import { useCallback, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { refreshFromLocalDb } from '../lib/refreshFromLocalDb';

const PULL_THRESHOLD = 72;
const MAX_PULL = 120;

interface PullToRefreshProps {
  children: React.ReactNode;
}

export function PullToRefresh({ children }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const atTop = useRef(true);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshFromLocalDb();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    atTop.current = typeof window !== 'undefined' && window.scrollY <= 4;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (refreshing) return;
      const scrollTop = typeof window !== 'undefined' ? window.scrollY : 0;
      if (scrollTop > 4) {
        atTop.current = false;
        setPullY(0);
        return;
      }
      if (!atTop.current) return;
      const currentY = e.touches[0].clientY;
      const delta = currentY - startY.current;
      if (delta > 0) {
        const damped = Math.min(delta * 0.5, MAX_PULL);
        setPullY(damped);
      }
    },
    [refreshing]
  );

  const onTouchEnd = useCallback(() => {
    if (pullY >= PULL_THRESHOLD && !refreshing) {
      handleRefresh();
    }
    setPullY(0);
  }, [pullY, refreshing, handleRefresh]);

  const showIndicator = pullY > 0 || refreshing;
  const ready = pullY >= PULL_THRESHOLD && !refreshing;

  return (
    <div
      className="relative min-h-full"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-down indicator fixed at top */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex justify-center transition-opacity duration-150"
        style={{
          height: 56,
          opacity: showIndicator ? 1 : 0,
          transform: `translateY(${Math.min(pullY, 56) - 56}px)`,
        }}
        aria-hidden
      >
        <div
          className={`flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md ring-1 ring-zinc-200/80 ${
            ready ? 'text-emerald-600' : 'text-zinc-500'
          }`}
        >
          {refreshing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Refreshing…</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" style={{ transform: `rotate(${Math.min(pullY * 3, 360)}deg)` }} />
              <span className="text-sm font-medium">
                {ready ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
