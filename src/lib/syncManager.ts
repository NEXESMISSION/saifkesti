import { supabase } from './supabase';
import { db } from './db';
import type { SyncQueueItem } from '../types';

const isOnline = () => typeof navigator !== 'undefined' && navigator.onLine;

/** Enqueue a mutation so it is pushed to Supabase when online. Call after writing to IndexedDB. */
export async function enqueueSync(item: Omit<SyncQueueItem, 'id' | 'created_at'>): Promise<void> {
  await db.syncQueue.add({
    ...item,
    id: crypto.randomUUID(),
    sync_status: 'pending',
    created_at: new Date().toISOString(),
  });
}

export async function syncQueueToSupabase(): Promise<{ synced: number; failed: number }> {
  if (!supabase || !isOnline()) return { synced: 0, failed: 0 };
  const items = await db.syncQueue.where('sync_status').equals('pending').toArray();
  let synced = 0;
  let failed = 0;
  for (const item of items) {
    try {
      if (item.table === 'transactions') {
        if (item.operation === 'insert' && item.payload) {
          const { data, error } = await supabase.from('transactions').insert(item.payload).select('id').single();
          if (error) throw error;
          await db.transactions.update(item.record_id, { id: data.id, sync_status: 'synced' });
          await db.syncQueue.delete(item.id);
          synced++;
        } else if (item.operation === 'update' && item.payload) {
          await supabase.from('transactions').update(item.payload).eq('id', item.record_id);
          await db.transactions.update(item.record_id, { sync_status: 'synced' });
          await db.syncQueue.delete(item.id);
          synced++;
        } else if (item.operation === 'delete') {
          await supabase.from('transactions').delete().eq('id', item.record_id);
          await db.syncQueue.delete(item.id);
          synced++;
        }
      } else if (item.table === 'accounts') {
        if (item.operation === 'insert' && item.payload) {
          const { data, error } = await supabase.from('accounts').insert(item.payload).select('id').single();
          if (error) throw error;
          await db.accounts.update(item.record_id, { id: data.id });
          await db.syncQueue.delete(item.id);
          synced++;
        } else if (item.operation === 'update' && item.payload) {
          await supabase.from('accounts').update(item.payload).eq('id', item.record_id);
          await db.syncQueue.delete(item.id);
          synced++;
        } else if (item.operation === 'delete') {
          await supabase.from('accounts').delete().eq('id', item.record_id);
          await db.syncQueue.delete(item.id);
          synced++;
        }
      } else if (item.table === 'categories') {
        if (item.operation === 'insert' && item.payload) {
          const { data, error } = await supabase.from('categories').insert(item.payload).select('id').single();
          if (error) throw error;
          await db.categories.update(item.record_id, { id: data.id });
          await db.syncQueue.delete(item.id);
          synced++;
        } else if (item.operation === 'update' && item.payload) {
          await supabase.from('categories').update(item.payload).eq('id', item.record_id);
          await db.syncQueue.delete(item.id);
          synced++;
        } else if (item.operation === 'delete') {
          await supabase.from('categories').delete().eq('id', item.record_id);
          await db.syncQueue.delete(item.id);
          synced++;
        }
      }
    } catch (e) {
      await db.syncQueue.update(item.id, { sync_status: 'failed', error: String(e) });
      failed++;
    }
  }
  return { synced, failed };
}

export function getOnlineStatus(): boolean {
  return isOnline();
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
