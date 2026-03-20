# WorkForce ERP — Refactored Frontend

A production-grade ERP frontend built with **React 18 + TypeScript + TailwindCSS**, fully refactored from a monolithic codebase into a clean, scalable architecture.

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

### Demo Accounts
| Role     | Email                   | Password    |
|----------|-------------------------|-------------|
| Admin    | admin@company.com       | Admin@123   |
| HR       | hr@company.com          | Welcome@123 |
| Employee | (any employee email)    | Welcome@123 |

---

## 📁 Folder Structure

```
src/
├── components/
│   ├── ui/               # 13 reusable primitive components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Card.tsx
│   │   ├── StatCard.tsx
│   │   ├── Table.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── SearchInput.tsx
│   └── common/           # Shared layout components
│       ├── Layout.tsx    # Sidebar + Topbar + main wrapper
│       └── PageHeader.tsx
│
├── modules/              # Feature-based modules (DRY)
│   ├── users/            UserService.ts · useUsers.ts · UserForm · UserTable
│   ├── leaves/           LeaveService.ts · useLeaves.ts · LeaveForm · LeaveTable
│   ├── departments/      DepartmentService.ts · useDepartments.ts · DeptForm · DeptTable
│   ├── attendance/       AttendanceService.ts · useAttendance.ts · AttendanceTable
│   ├── announcements/    AnnouncementService.ts · useAnnouncements.ts · AnnCard · AnnForm
│   └── payroll/          PayrollService.ts · usePayroll.ts · PayrollTable
│
├── pages/
│   ├── auth/             Login · ChangePassword
│   ├── admin/            11 thin pages (no business logic)
│   ├── hr/               11 thin pages
│   └── employee/         10 thin pages (view-only, filtered data)
│
├── context/              AuthContext · TimeTrackingContext · TaskContext
├── data/                 store.ts (localStorage, API-ready)
├── types/                index.ts (all strict TypeScript interfaces)
├── constants/            index.ts (nav items, enums, colors)
├── utils/
│   ├── helpers.ts        formatDate · formatCurrency · getInitials · getStatusColor
│   └── permissions.ts    hasPermission · canCreate · canDelete · isHROrAdmin
└── App.tsx               Clean routing with role-based protection
```

---

## 🏗️ Architecture Principles

### Module Pattern
Every module follows the same 4-file contract:
```
modules/leaves/
  LeaveService.ts      ← All CRUD logic (easy to swap for API)
  useLeaves.ts         ← State management + filtered results
  components/
    LeaveForm.tsx      ← Reusable form
    LeaveTable.tsx     ← Reusable table
```

### Page Rules (Thin Pages)
Pages contain **zero business logic**. They only:
1. Call a module hook → get state + actions
2. Render module components
3. Handle open/close state for modals

### Role-Based Access
```ts
// utils/permissions.ts
hasPermission('hr', 'leaves:approve')  // → true
hasPermission('employee', 'users:delete')  // → false
canCreate('hr', 'users')  // → true
isHROrAdmin('employee')  // → false
```

---

## 🔌 Swapping localStorage → Real API

Each `Service.ts` wraps `store.ts`. To connect a real backend:

1. Open `src/modules/leaves/LeaveService.ts`
2. Replace the `store` import calls with `fetch()` / `axios` calls
3. The hook (`useLeaves.ts`) and all UI components remain **unchanged**

---

## 🎨 UI Component Usage

```tsx
// All primitives exported from one place
import { Button, Input, Modal, Badge, StatCard, Table } from '../components/ui';
import { Layout, PageHeader } from '../components/common';

// Example page
export default function MyPage() {
  const { data, create } = useMyModule();
  return (
    <>
      <PageHeader title="My Page" action={<Button onClick={...}>Add</Button>} />
      <StatCard label="Total" value={data.length} icon="📊" ... />
      <Table columns={cols} data={data} keyExtractor={r => r.id} />
    </>
  );
}
```

---

## ✅ What Was Eliminated

| Before | After |
|--------|-------|
| `Modal` defined 10+ times across files | 1 shared `components/ui/Modal.tsx` |
| Stat grid copy-pasted in every page | `StatCard` component + `useModule().stats` |
| `StatusBadge` in every file | `Badge` component reads from `getStatusColor()` |
| Business logic inside pages | Moved to `Service.ts` + `useModule.ts` |
| Inline `function SectionHeader` duplicated | `PageHeader` common component |
| `any` types everywhere | Strict interfaces in `src/types/index.ts` |
| Magic color strings scattered | Centralized in `constants/index.ts` |

