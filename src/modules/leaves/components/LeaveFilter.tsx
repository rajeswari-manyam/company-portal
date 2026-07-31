const TABS = ['All', 'Pending', 'Approved', 'Rejected'];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function LeaveFilterTabs({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab.toLowerCase())}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all
            ${value === tab.toLowerCase()
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}