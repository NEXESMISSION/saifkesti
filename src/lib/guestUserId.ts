const GUEST_USER_KEY = 'finance-tracker-guest-user-id';

export function getGuestUserId(): string {
  if (typeof localStorage === 'undefined') return crypto.randomUUID();
  let id = localStorage.getItem(GUEST_USER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_USER_KEY, id);
  }
  return id;
}
