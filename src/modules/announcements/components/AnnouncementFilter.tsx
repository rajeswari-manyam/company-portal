import { useEffect, useState } from 'react';
import { getDepartments } from '../../../service/departmentApi';
import { SearchInput } from '../../../components/ui';

export default function AnnouncementFilters({
    search,
    setSearch,
    dept,
    setDept,
    priority,
    setPriority,
}: any) {
    const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    getDepartments()
        .then(setDepartments)
        .catch(() => console.error('Failed to load departments'));
}, []);

    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search..."
                className="flex-1"
            />

            <select
                value={dept}
                onChange={e => setDept(e.target.value)}
                className="w-full sm:w-48 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#69A6F0]"
            >
                <option value="all">All Departments</option>
                {departments.map(d => (
                    <option key={d.id} value={d.id}>  {/* ← was d.name, now d.id */}
                        {d.name}
                    </option>
                ))}
            </select>

            <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full sm:w-40 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#69A6F0]"
            >
                <option value="all">All</option>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
            </select>
        </div>
    );
}