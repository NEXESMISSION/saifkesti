import Dexie, { type Table } from 'dexie';
import type { Account, Category, Transaction, SyncQueueItem, MetadataRecord } from '../types';

interface TransactionWithSync extends Transaction {
  sync_status?: 'synced' | 'pending' | 'failed';
}

export class FinanceTrackerDB extends Dexie {
  transactions!: Table<TransactionWithSync & { id: string }>;
  accounts!: Table<Account>;
  categories!: Table<Category>;
  syncQueue!: Table<SyncQueueItem & { id: string }>;
  metadata!: Table<MetadataRecord & { key: string }>;

  constructor() {
    super('FinanceTrackerDB');
    this.version(1).stores({
      transactions: 'id, account_id, date, sync_status, category_id',
      accounts: 'id, user_id',
      categories: 'id, user_id, type',
      syncQueue: 'id, sync_status, created_at',
      metadata: 'key',
    });
  }
}

export const db = new FinanceTrackerDB();
