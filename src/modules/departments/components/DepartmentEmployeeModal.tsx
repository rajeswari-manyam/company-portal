import { useState, useEffect, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { getEmployees, type EmployeeRecord } from "../../../service/Empolyee.service";
import type { Department } from '../../../service/departmentApi';

interface Props {
  department: Department;
  onClose: () => void;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  { bg: '#EEF2FF', text: '#4338CA' },
  { bg: '#FEF9C3', text: '#854D0E' },
  { bg: '#DCFCE7', text: '#15803D' },
  { bg: '#FCE7F3', text: '#9D174D' },
];

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  employee: { bg: '#DCFCE7', text: '#15803D' },
  hr:       { bg: '#FEF9C3', text: '#854D0E' },
  admin:    { bg: '#FEE2E2', text: '#991B1B' },
};

export default function DepartmentEmployeesModal({ department, onClose }: Props) {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getEmployees();
        setEmployees(res.users.filter(emp => emp.department === department.id));
      } finally {
        setLoading(false);
      }
    })();
  }, [department.id]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? employees.filter(e =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.designation?.toLowerCase().includes(q)
        )
      : employees;
  }, [employees, search]);

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      {/* Panel — stop click bubbling to backdrop */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540,
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#0F172A' }}>
              {department.name}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748B' }}>
              {employees.length} member{employees.length !== 1 ? 's' : ''}
// ✅ After
{department.head ? ` · Manager: ${department.head}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none', background: '#F1F5F9', borderRadius: 8,
              width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <X size={16} color="#64748B" />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#94A3B8"
              style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employees…"
              style={{
                width: '100%', boxSizing: 'border-box',
                paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                border: '1px solid #E2E8F0', borderRadius: 8,
                fontSize: 14, color: '#0F172A', outline: 'none',
                background: '#F8FAFC',
              }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', padding: '0.75rem 1.5rem', flex: 1 }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem 0', fontSize: 14 }}>
              Loading…
            </p>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem 0', fontSize: 14 }}>
              {search ? 'No employees match your search.' : 'No employees in this department.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((emp, i) => {
                const av   = AVATAR_COLORS[i % AVATAR_COLORS.length];
                const role = ROLE_BADGE[emp.role] ?? ROLE_BADGE.employee;
                return (
                  <div key={emp._id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px',
                    border: '1px solid #F1F5F9',
                    borderRadius: 10,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: av.bg, color: av.text,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 600, flexShrink: 0,
                    }}>
                      {getInitials(emp.name)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#0F172A' }}>
                        {emp.name}
                      </p>
                      <p style={{
                        margin: 0, fontSize: 12, color: '#64748B',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {[emp.designation, emp.email].filter(Boolean).join(' · ')}
                      </p>
                    </div>

                    {/* Role badge */}
                    <span style={{
                      fontSize: 11, fontWeight: 500,
                      padding: '3px 10px', borderRadius: 99,
                      background: role.bg, color: role.text, flexShrink: 0,
                    }}>
                      {emp.role}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}