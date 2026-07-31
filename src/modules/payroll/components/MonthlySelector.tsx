import { MONTHS, type Month } from "../../../constants";

interface MonthSelectorProps {
  month: Month;
  onChange: (month: Month) => void;
}

export default function MonthSelector({ month, onChange }: MonthSelectorProps) {
  return (
    <select
      value={month}
      onChange={e => onChange(e.target.value as Month)}
      className="rounded-xl border border-slate-200 py-2 px-4"
    >
      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
    </select>
  );
}