export function getOnlineStatus(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

export function subscribeToOnlineStatus(cb: (online: boolean) => void): () => void {
  const handler = () => cb(navigator.onLine);
  window.addEventListener('online', handler);
  window.addEventListener('offline', handler);
  cb(navigator.onLine);
  return () => {
    window.removeEventListener('online', handler);
    window.removeEventListener('offline', handler);
  };
}
