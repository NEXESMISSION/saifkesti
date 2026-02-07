import { supabase } from './supabase';
import { useStore } from '../stores/useStore';
import { getGuestUserId } from './guestUserId';

/**
 * Initialize auth: sync Supabase session with store.
 * Only show as logged in if the session is valid (verified with server via getUser).
 * Stale/local-only sessions are cleared so the app doesn't show "logged in" on first open without reason.
 */
export function initAuth() {
  if (!supabase) return;

  const setUser = useStore.getState().setUser;
  const setSessionUser = useStore.getState().setSessionUser;

  function updateFromSession(session: { user: { id: string; email?: string } } | null) {
    if (session?.user) {
      setUser({ id: session.user.id });
      setSessionUser({
        id: session.user.id,
        email: session.user.email ?? '',
      });
    } else {
      setUser({ id: getGuestUserId() });
      setSessionUser(null);
    }
  }

  const client = supabase;
  client.auth.getSession().then(async ({ data: { session } }) => {
    if (!session?.user) {
      setUser({ id: getGuestUserId() });
      setSessionUser(null);
      return;
    }
    const { data: { user: currentUser }, error } = await client.auth.getUser();
    if (error || !currentUser) {
      await client.auth.signOut();
      setUser({ id: getGuestUserId() });
      setSessionUser(null);
      return;
    }
    updateFromSession(session);
  });

  client.auth.onAuthStateChange((_event, session) => {
    updateFromSession(session);
  });
}
