import { supabase } from '../lib/supabase';
import type { Category } from '../types';

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
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

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    name: row.name as string,
    type: row.type as Category['type'],
    icon: (row.icon as string) ?? 'tag',
    is_system: Boolean(row.is_system),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getCategories(userId: string): Promise<Category[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToCategory);
}

export async function seedDefaultCategories(userId: string): Promise<Category[]> {
  if (!supabase) return [];
  const existing = await getCategories(userId);
  if (existing.length > 0) return existing;
  const rows = DEFAULT_CATEGORIES.map((c) => ({
    user_id: userId,
    name: c.name,
    type: c.type,
    icon: c.icon,
    is_system: c.is_system,
  }));
  const { data, error } = await supabase.from('categories').insert(rows).select();
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToCategory);
}

export async function createCategory(
  userId: string,
  category: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Category> {
  if (!supabase) throw new Error('Not configured');
  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: category.name,
      type: category.type,
      icon: category.icon ?? 'tag',
      is_system: category.is_system ?? false,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToCategory(data);
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  if (!supabase) return;
  const payload: Record<string, unknown> = { ...updates };
  delete payload.id;
  delete payload.user_id;
  delete payload.created_at;
  const { error } = await supabase.from('categories').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteCategory(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
