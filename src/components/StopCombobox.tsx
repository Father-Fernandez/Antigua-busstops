import { useEffect, useId, useMemo, useRef, useState } from 'react';

export interface ComboboxOption {
  /** Unique option id, e.g. `stop:5` or `place:7`. */
  id: string;
  label: string;
  /** Optional heading this option is listed under. */
  group?: string;
}

interface Props {
  label: string;
  options: readonly ComboboxOption[];
  value: string;
  onChange: (optionId: string) => void;
  placeholder?: string;
}

/**
 * A searchable, keyboard-accessible combobox. `value` is the selected option id
 * (empty string means nothing selected); callers map that id to a stop.
 */
export default function StopCombobox({ label, options, value, onChange, placeholder }: Props) {
  const baseId = useId();
  const listId = `${baseId}-listbox`;

  const selected = useMemo(() => options.find(o => o.id === value) ?? null, [options, value]);

  const [query, setQuery] = useState(selected?.label ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setQuery(selected?.label ?? '');
  }, [selected, open]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => setActive(0), [query, open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const commit = (option: ComboboxOption) => {
    onChange(option.id);
    setQuery(option.label);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive(a => Math.min(a + 1, matches.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(a => Math.max(a - 1, 0));
    } else if (event.key === 'Enter') {
      if (open && matches[active]) {
        event.preventDefault();
        commit(matches[active]);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
      setQuery(selected?.label ?? '');
    }
  };

  return (
    <div ref={rootRef} className="relative block">
      <label
        htmlFor={baseId}
        className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
      >
        {label}
      </label>
      <input
        id={baseId}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[active] ? `${baseId}-opt-${active}` : undefined}
        value={query}
        placeholder={placeholder ?? 'Search stops and places…'}
        onChange={e => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          {matches.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">Nothing matches.</li>
          ) : (
            matches.map((option, i) => {
              const isSelected = option.id === value;
              const showGroup = i === 0 || matches[i - 1].group !== option.group;
              return (
                <li key={option.id} role="presentation">
                  {showGroup && option.group && (
                    <p className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {option.group}
                    </p>
                  )}
                  <div
                    id={`${baseId}-opt-${i}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={e => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => commit(option)}
                    className={`cursor-pointer px-4 py-2 text-sm ${
                      i === active
                        ? 'bg-brand-50 text-brand-800 dark:bg-slate-800 dark:text-brand-200'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      {option.label}
                      {isSelected && (
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 shrink-0 fill-brand-600 dark:fill-brand-400"
                          aria-hidden="true"
                        >
                          <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" />
                        </svg>
                      )}
                    </span>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
