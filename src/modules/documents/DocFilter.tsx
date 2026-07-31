import { SearchInput, Select } from '../../components/ui';

export const TYPE_OPTIONS = [
  { value: 'all',   label: 'All Types' },
  { value: 'pdf',   label: 'PDF'       },
  { value: 'image', label: 'Image'     },
  { value: 'word',  label: 'Word'      },
  { value: 'other', label: 'Other'     },
] as const;

interface DocFiltersProps {
  search:     string;
  typeFilter: string;
  onSearch:   (v: string) => void;
  onType:     (v: string) => void;
}

export function DocFilters({ search, typeFilter, onSearch, onType }: DocFiltersProps) {
  return (
    <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
      <SearchInput
        value={search}
        onChange={onSearch}
        placeholder="Search by employee or filename…"
        className="flex-1 min-w-[200px]"
      />
      <Select
        value={typeFilter}
        onChange={e => onType(e.target.value)}
        options={[...TYPE_OPTIONS]}
        className="w-44"
      />
    </div>
  );
}
