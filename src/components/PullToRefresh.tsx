import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { refreshFromLocalDb } from '../lib/refreshFromLocalDb';

const PULL_THRESHOLD = 70;
const MAX_PULL = 100;
const DAMPING = 0.45;

function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const currentPull = useRef(0);
  const atTop = useRef(true);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    function getScrollTop() {
      return window.scrollY ?? document.documentElement.scrollTop ?? 0;
    }

    function onTouchStart(e: TouchEvent) {
      atTop.current = getScrollTop() <= 8;
      startY.current = e.touches[0].clientY;
      currentPull.current = 0;
    }

    function onTouchMove(e: TouchEvent) {
      if (refreshing) return;
      if (getScrollTop() > 8) {
        atTop.current = false;
        setPullY(0);
        currentPull.current = 0;
        return;
      }
      if (!atTop.current) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) {
        e.preventDefault();
        const damped = Math.min(delta * DAMPING, MAX_PULL);
        currentPull.current = damped;
        setPullY(damped);
      }
    }

    function onTouchEnd() {
      const pull = currentPull.current;
      if (pull >= PULL_THRESHOLD && !refreshing) {
        handleRefresh();
      }
      currentPull.current = 0;
      setPullY(0);
    }

    const doc = document;
    doc.addEventListener('touchstart', onTouchStart, { passive: true });
    doc.addEventListener('touchmove', onTouchMove, { passive: false });
    doc.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      doc.removeEventListener('touchstart', onTouchStart);
      doc.removeEventListener('touchmove', onTouchMove);
      doc.removeEventListener('touchend', onTouchEnd);
    };
  }, [refreshing, handleRefresh]);

  return { pullY, refreshing, ready: pullY >= PULL_THRESHOLD && !refreshing };
}

interface PullToRefreshProps {
  children: React.ReactNode;
}

export function PullToRefresh({ children }: PullToRefreshProps) {
  const { pullY, refreshing, ready } = usePullToRefresh(refreshFromLocalDb);
  const showIndicator = pullY > 0 || refreshing;

  return (
    <div className="relative min-h-full">
      {/* Indicator: fixed below header, minimal and clean */}
      <div
        className="pointer-events-none fixed left-0 right-0 z-[25] flex justify-center transition-all duration-200 ease-out"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 52px)',
          opacity: showIndicator ? 1 : 0,
          transform: showIndicator
            ? `translateY(${Math.min(pullY * 0.6, 48)}px)`
            : 'translateY(-12px)',
          visibility: showIndicator ? 'visible' : 'hidden',
        }}
        aria-live="polite"
        aria-label={refreshing ? 'Refreshing' : ready ? 'Release to refresh' : 'Pull to refresh'}
      >
        <div
          className={`
            flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium
            shadow-lg backdrop-blur-sm
            ${ready ? 'bg-emerald-500/95 text-white' : 'bg-white/95 text-zinc-600'}
            ${refreshing ? 'bg-emerald-500/95 text-white' : ''}
            border border-zinc-200/60
          `}
        >
          {refreshing ? (
            <RefreshCw className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          ) : (
            <RefreshCw
              className="h-4 w-4 shrink-0 transition-transform duration-150"
              style={{ transform: `rotate(${Math.min((pullY / PULL_THRESHOLD) * 180, 180)}deg)` }}
              aria-hidden
            />
          )}
          <span>
            {refreshing ? 'Refreshing…' : ready ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {children}
    </div>
  );
}
