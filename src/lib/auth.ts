import { supabase } from './supabase';
import { useStore } from '../stores/useStore';
import { getGuestUserId } from './guestUserId';

/**
 * Initialize auth: sync Supabase session with store.
 * Call once at app load. When user signs in/out, store user and sessionUser are updated.
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

  supabase.auth.getSession().then(({ data: { session } }) => {
    updateFromSession(session);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    updateFromSession(session);
  });
}
