-- Clean duplicate categories (same user_id, name, type)
-- Run in Supabase SQL Editor. Keeps one category per group (oldest created_at, then id), reassigns transactions, then deletes duplicates.

-- Step 1: Reassign transactions from duplicate categories to the kept category
WITH kept AS (
  SELECT DISTINCT ON (user_id, name, type)
    id,
    user_id,
    name,
    type
  FROM public.categories
  ORDER BY user_id, name, type, created_at ASC, id ASC
)
UPDATE public.transactions t
SET category_id = k.id
FROM public.categories c
JOIN kept k ON k.user_id = c.user_id AND k.name = c.name AND k.type = c.type
WHERE t.category_id = c.id
  AND c.id <> k.id;

-- Step 2: Delete duplicate categories (keep one per user_id, name, type)
WITH kept AS (
  SELECT DISTINCT ON (user_id, name, type)
    id,
    user_id,
    name,
    type
  FROM public.categories
  ORDER BY user_id, name, type, created_at ASC, id ASC
)
DELETE FROM public.categories c
USING kept k
WHERE k.user_id = c.user_id
  AND k.name = c.name
  AND k.type = c.type
  AND c.id <> k.id;
