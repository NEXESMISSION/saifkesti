import * as Select from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import type { Account } from '../types';

export function AccountSelector({
  accounts,
  selectedId,
  onSelect,
}: {
  accounts: Account[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-500">
        No accounts
      </div>
    );
  }

  // Ensure value matches an existing account (avoid Radix issues with stale/missing id)
  const selected = accounts.find((a) => a.id === selectedId);
  const value = selected ? selected.id : accounts[0].id;
  return (
    <Select.Root value={value} onValueChange={onSelect}>
      <Select.Trigger
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-left text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-0"
        aria-label="Select business or account"
      >
        <span className="min-w-0 truncate">
          {selected ? (
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: selected.color }}
              />
              {selected.name}
            </span>
          ) : (
            'Select account'
          )}
        </span>
        <Select.Icon asChild>
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition-transform [[data-state=open]_&]:rotate-180" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="z-[100] max-h-[min(60vh,320px)] overflow-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-xl"
          position="popper"
          sideOffset={6}
          collisionPadding={12}
        >
          {accounts.map((a) => (
            <Select.Item
              key={a.id}
              value={a.id}
              className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm outline-none hover:bg-zinc-50 data-[highlighted]:bg-zinc-50 data-[state=checked]:bg-emerald-50 data-[state=checked]:text-emerald-800"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: a.color }}
              />
              <span className="truncate">{a.name}</span>
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
