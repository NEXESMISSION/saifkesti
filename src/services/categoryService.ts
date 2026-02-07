import { db } from '../lib/db';
import { enqueueSync } from '../lib/syncManager';
import type { Category } from '../types';

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  { name: 'Uncategorized', type: 'expense', icon: 'help-circle', is_system: true },
  { name: 'Lost/Unknown', type: 'expense', icon: 'alert-circle', is_system: true },
  { name: 'Groceries', type: 'expense', icon: 'shopping-cart', is_system: false },
  { name: 'Dining', type: 'expense', icon: 'utensils', is_system: false },
  { name: 'Transport', type: 'expense', icon: 'car', is_system: false },
  { name: 'Utilities', type: 'expense', icon: 'zap', is_system: false },
  { name: 'Salary', type: 'income', icon: 'briefcase', is_system: false },
  { name: 'Freelance', type: 'income', icon: 'laptop', is_system: false },
  { name: 'Other Income', type: 'income', icon: 'dollar-sign', is_system: false },
];

export async function getCategories(userId: string): Promise<Category[]> {
  return db.categories.where('user_id').equals(userId).toArray();
}

export async function seedDefaultCategories(userId: string): Promise<Category[]> {
  const existing = await db.categories.where('user_id').equals(userId).count();
  if (existing > 0) return db.categories.where('user_id').equals(userId).toArray();
  const now = new Date().toISOString();
  const categories: Category[] = DEFAULT_CATEGORIES.map((c) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    ...c,
    created_at: now,
    updated_at: now,
  }));
  await db.categories.bulkAdd(categories);
  for (const c of categories) {
    await enqueueSync({
      operation: 'insert',
      table: 'categories',
      record_id: c.id,
      payload: { ...c },
      sync_status: 'pending',
    });
  }
  return categories;
}

export async function createCategory(userId: string, category: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Category> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const newCat: Category = {
    id,
    user_id: userId,
    name: category.name,
    type: category.type,
    icon: category.icon ?? 'tag',
    is_system: category.is_system ?? false,
    created_at: now,
    updated_at: now,
  };
  await db.categories.add(newCat);
  await enqueueSync({
    operation: 'insert',
    table: 'categories',
    record_id: newCat.id,
    payload: { ...newCat },
    sync_status: 'pending',
  });
  return newCat;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  const existing = await db.categories.get(id);
  if (!existing) return;
  const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
  await db.categories.put(updated);
  await enqueueSync({
    operation: 'update',
    table: 'categories',
    record_id: id,
    payload: updated,
    sync_status: 'pending',
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await db.categories.delete(id);
  await enqueueSync({
    operation: 'delete',
    table: 'categories',
    record_id: id,
    sync_status: 'pending',
  });
}
