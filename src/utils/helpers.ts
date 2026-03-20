const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
  'bg-orange-500', 'bg-pink-500',
];

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function diffDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(0, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    present: 'bg-emerald-100 text-emerald-700',
    absent: 'bg-red-100 text-red-700',
    late: 'bg-amber-100 text-amber-700',
    'half-day': 'bg-blue-100 text-blue-700',
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-100 text-slate-600',
    generated: 'bg-violet-100 text-violet-700',
    paid: 'bg-emerald-100 text-emerald-700',
    open: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-slate-100 text-slate-600',
    draft: 'bg-amber-100 text-amber-700',
    reviewed: 'bg-emerald-100 text-emerald-700',
    submitted: 'bg-blue-100 text-blue-700',
    admin: 'bg-indigo-100 text-indigo-700',
    hr: 'bg-violet-100 text-violet-700',
    employee: 'bg-blue-100 text-blue-700',
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-600',
    national: 'bg-indigo-100 text-indigo-700',
    regional: 'bg-blue-100 text-blue-700',
    company: 'bg-emerald-100 text-emerald-700',
  };
  return map[status?.toLowerCase()] ?? 'bg-slate-100 text-slate-600';
}
