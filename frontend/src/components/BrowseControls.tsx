import type { ReactNode } from "react";
import type { ListingSort } from "@ay/shared";
import { SORT_OPTIONS } from "../constants";
import type { ListingFilters } from "../hooks/useListing";

export function BrowseControls({
  filters,
  onChange,
}: {
  filters: ListingFilters;
  onChange: (patch: Partial<ListingFilters>) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filters.sort}
        onChange={(value) => onChange({ sort: value as ListingSort, page: 1 })}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Checkbox
        checked={filters.premium === true}
        onChange={(checked) =>
          onChange({ premium: checked ? true : null, page: 1 })
        }
      >
        Premium
      </Checkbox>

      <Checkbox
        checked={filters.inStock === true}
        onChange={(checked) =>
          onChange({ inStock: checked ? true : null, page: 1 })
        }
      >
        In stock
      </Checkbox>
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
    >
      {children}
    </select>
  );
}

function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
      />
      {children}
    </label>
  );
}
