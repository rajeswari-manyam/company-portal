// ─── Combined HR Portal + NexusHR Central Data Store ──────────────────────────
// All data persisted to localStorage. No backend required.

export interface Department {
  id: string;
  name: string;
  description: string;
  head: string; // ✅ manager / department head
  createdAt: string;
  employeeCount: number;
}

export interface UserRecord {
  id: string; employeeId: string; name: string; email: string;
  password: string; role: 'admin' | 'hr' | 'employee';
  department: string; departmentId: string; designation: string;
  phone: string; joinDate: string; status: 'active' | 'inactive';
  mustChangePassword: boolean; createdBy: string;
  gender?: string; dateOfBirth?: string; address?: string;
  salary?: number; bloodGroup?: string; emergencyContact?: string;
  manager?: string; avatar?: string;
}

export interface LeaveRequest {
  id: string; userId: string; userName: string; department: string;
  leaveType: string; startDate: string; endDate: string; days: number;
  reason: string; status: 'pending' | 'approved' | 'rejected';
  appliedOn: string; reviewedBy?: string; reviewNote?: string;
}

export interface Announcement {
  id: string; title: string; content: string;
  createdBy: string; createdAt: string;
  priority: 'low' | 'medium' | 'high'; targetDeptId: string | 'all';
}

export interface AttendanceSummary {
  userId: string; date: string;
  workSeconds: number; idleSeconds: number;
  status: 'present' | 'absent' | 'half-day' | 'late';
  checkIn?: string; checkOut?: string;
}

export interface Payslip {
  id: string; userId: string; userName: string;
  month: string; year: number; basicSalary: number;
  hra: number; allowances: number; deductions: number; netSalary: number;
  status: 'generated' | 'paid'; generatedOn: string;
}

export interface ITIssue {
  id: string; userId: string; userName: string; title: string;
  description: string; priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved'; createdAt: string;
}

export interface Holiday {
  id: string; name: string; date: string;
  type: 'national' | 'regional' | 'company'; description?: string;
}

export interface PerformanceReview {
  id: string; userId: string; userName: string;
  period: string; rating: number; goals: string[];
  feedback: string; status: 'draft' | 'submitted' | 'reviewed';
  reviewedBy?: string; createdAt: string;
}

export interface JobPosting {
  id: string; title: string; department: string;
  skills: string[]; experience: string; salaryRange: string;
  status: 'open' | 'closed' | 'draft'; applicants: number; postedOn: string;
}

export interface Candidate {
  id: string; jobId: string; name: string; email: string;
  phone: string; experience: string; skills: string[];
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'hired';
  appliedOn: string;
}

export interface Document {
  id: string; userId: string; name: string;
  type: 'offer-letter' | 'resume' | 'certificate' | 'id-proof' | 'other';
  size: string; uploadedOn: string; url?: string;
}

interface Store {
  departments: Department[];
  users: UserRecord[];
  attendance: AttendanceSummary[];
  leaves: LeaveRequest[];
  announcements: Announcement[];
  payslips: Payslip[];
  itIssues: ITIssue[];
  holidays: Holiday[];
  performance: PerformanceReview[];
  jobs: JobPosting[];
  candidates: Candidate[];
  documents: Document[];
}

const STORE_KEY = 'hrportal_combined_v1';

const DEFAULT_ADMIN: UserRecord = {
  id: 'admin-1', employeeId: 'ADMIN001', name: 'Admin User',
  email: 'admin@company.com', password: 'Admin@123', role: 'admin',
  department: 'Management', departmentId: 'dept-0',
  designation: 'System Administrator', phone: '+91 98765 00001',
  joinDate: '2020-01-01', status: 'active',
  mustChangePassword: false, createdBy: 'system',
};

const DEFAULT_HOLIDAYS: Holiday[] = [
  { id: 'h1', name: 'Republic Day', date: '2025-01-26', type: 'national' },
  { id: 'h2', name: 'Holi', date: '2025-03-14', type: 'national' },
  { id: 'h3', name: 'Independence Day', date: '2025-08-15', type: 'national' },
  { id: 'h4', name: 'Gandhi Jayanti', date: '2025-10-02', type: 'national' },
  { id: 'h5', name: 'Diwali', date: '2025-10-20', type: 'national' },
  { id: 'h6', name: 'Christmas', date: '2025-12-25', type: 'national' },
];

function getStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        departments: parsed.departments || [],
        users: parsed.users || [DEFAULT_ADMIN],
        attendance: parsed.attendance || [],
        leaves: parsed.leaves || [],
        announcements: parsed.announcements || [],
        payslips: parsed.payslips || [],
        itIssues: parsed.itIssues || [],
        holidays: parsed.holidays || DEFAULT_HOLIDAYS,
        performance: parsed.performance || [],
        jobs: parsed.jobs || [],
        candidates: parsed.candidates || [],
        documents: parsed.documents || [],
      };
    }
  } catch {}
  return {
    departments: [], users: [DEFAULT_ADMIN], attendance: [], leaves: [],
    announcements: [], payslips: [], itIssues: [], holidays: DEFAULT_HOLIDAYS,
    performance: [], jobs: [], candidates: [], documents: [],
  };
}

function saveStore(store: Store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function initStore() {
  // Always write the store on first load to guarantee admin exists in localStorage
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) {
    // First ever load — seed the store with admin
    saveStore({
      departments: [], users: [DEFAULT_ADMIN], attendance: [], leaves: [],
      announcements: [], payslips: [], itIssues: [], holidays: DEFAULT_HOLIDAYS,
      performance: [], jobs: [], candidates: [], documents: [],
    });
    return;
  }
  // Store exists — just make sure admin user is present (edge case recovery)
  const store = getStore();
  if (!store.users.find(u => u.role === 'admin')) {
    store.users.unshift(DEFAULT_ADMIN);
    saveStore(store);
  }
}

// ── Departments ──────────────────────────────────────────────────────────────
export function getDepartments(): Department[] { return getStore().departments; }

export function createDepartment(
  dept: Omit<Department, 'id' | 'createdAt' | 'employeeCount'>
): Department {
  const store = getStore();

  const newDept: Department = {
    id: `DEP-${Date.now()}`, // ✅ controlled ID
    createdAt: new Date().toISOString(),
    employeeCount: 0,
    ...dept
  };

  store.departments.push(newDept);
  saveStore(store);

  return newDept;
}

export function updateDepartment(id: string, updates: Partial<Department>): boolean {
  const store = getStore();
  const idx = store.departments.findIndex(d => d.id === id);
  if (idx < 0) return false;
  store.departments[idx] = { ...store.departments[idx], ...updates };
  saveStore(store); return true;
}

export function deleteDepartment(id: string): boolean {
  const store = getStore();
  store.departments = store.departments.filter(d => d.id !== id);
  saveStore(store); return true;
}

// ── Users ────────────────────────────────────────────────────────────────────
export function getUsers(): UserRecord[] { return getStore().users; }
export function getUserById(id: string): UserRecord | undefined { return getStore().users.find(u => u.id === id); }
export function getUserByEmail(email: string): UserRecord | undefined {
  return getStore().users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(user: Omit<UserRecord, 'id'>): UserRecord {
  const store = getStore();
  const newUser: UserRecord = { ...user, id: `user-${Date.now()}-${Math.random().toString(36).slice(2)}` };
  store.users.push(newUser);
  const dept = store.departments.find(d => d.id === user.departmentId);
  if (dept && user.role === 'employee') dept.employeeCount++;
  saveStore(store); return newUser;
}

export function updateUser(id: string, updates: Partial<UserRecord>): boolean {
  const store = getStore();
  const idx = store.users.findIndex(u => u.id === id);
  if (idx < 0) return false;
  store.users[idx] = { ...store.users[idx], ...updates };
  saveStore(store); return true;
}

export function deleteUser(id: string): boolean {
  const store = getStore();
  const user = store.users.find(u => u.id === id);
  if (user) {
    const dept = store.departments.find(d => d.id === user.departmentId);
    if (dept && user.role === 'employee' && dept.employeeCount > 0) dept.employeeCount--;
  }
  store.users = store.users.filter(u => u.id !== id);
  saveStore(store); return true;
}

export function authenticate(email: string, password: string): UserRecord | null {
  const user = getUserByEmail(email);
  if (user && user.password === password && user.status === 'active') return user;
  return null;
}

export function generateEmployeeId(role: 'hr' | 'employee'): string {
  const store = getStore();
  const prefix = role === 'hr' ? 'HR' : 'EMP';
  const count = store.users.filter(u => u.role === role).length + 1;
  return `${prefix}${String(count).padStart(3, '0')}`;
}

// ── Attendance ───────────────────────────────────────────────────────────────
export function saveAttendance(record: AttendanceSummary) {
  const store = getStore();
  const idx = store.attendance.findIndex(a => a.userId === record.userId && a.date === record.date);
  if (idx >= 0) store.attendance[idx] = record;
  else store.attendance.push(record);
  saveStore(store);
}

export function getAttendanceForUser(userId: string): AttendanceSummary[] {
  return getStore().attendance.filter(a => a.userId === userId).sort((a, b) => b.date.localeCompare(a.date));
}

export function getAllAttendance(): AttendanceSummary[] {
  return getStore().attendance.sort((a, b) => b.date.localeCompare(a.date));
}

// ── Leaves ───────────────────────────────────────────────────────────────────
export function getLeaves(): LeaveRequest[] { return getStore().leaves.sort((a, b) => b.appliedOn.localeCompare(a.appliedOn)); }
export function getLeavesForUser(userId: string): LeaveRequest[] {
  return getStore().leaves.filter(l => l.userId === userId).sort((a, b) => b.appliedOn.localeCompare(a.appliedOn));
}
export function getLeavesForDept(deptId: string): LeaveRequest[] {
  const store = getStore();
  const deptUsers = store.users.filter(u => u.departmentId === deptId).map(u => u.id);
  return store.leaves.filter(l => deptUsers.includes(l.userId)).sort((a, b) => b.appliedOn.localeCompare(a.appliedOn));
}
export function getAllLeaves(): LeaveRequest[] { return getStore().leaves.sort((a, b) => b.appliedOn.localeCompare(a.appliedOn)); }

export function createLeave(leave: Omit<LeaveRequest, 'id'>): LeaveRequest {
  const store = getStore();
  const newLeave = { ...leave, id: `leave-${Date.now()}` };
  store.leaves.push(newLeave);
  saveStore(store); return newLeave;
}

export function updateLeave(id: string, updates: Partial<LeaveRequest>): boolean {
  const store = getStore();
  const idx = store.leaves.findIndex(l => l.id === id);
  if (idx < 0) return false;
  store.leaves[idx] = { ...store.leaves[idx], ...updates };
  saveStore(store); return true;
}

// ── Announcements ────────────────────────────────────────────────────────────
export function getAnnouncements(deptId?: string): Announcement[] {
  const store = getStore();
  return store.announcements
    .filter(a => !deptId || a.targetDeptId === 'all' || a.targetDeptId === deptId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createAnnouncement(ann: Omit<Announcement, 'id'>): Announcement {
  const store = getStore();
  const newAnn = { ...ann, id: `ann-${Date.now()}` };
  store.announcements.push(newAnn);
  saveStore(store); return newAnn;
}

export function deleteAnnouncement(id: string): boolean {
  const store = getStore();
  store.announcements = store.announcements.filter(a => a.id !== id);
  saveStore(store); return true;
}

// ── Payslips ─────────────────────────────────────────────────────────────────
export function getPayslipsForUser(userId: string): Payslip[] {
  return getStore().payslips.filter(p => p.userId === userId).sort((a, b) => b.year - a.year || b.month.localeCompare(a.month));
}
export function getAllPayslips(): Payslip[] { return getStore().payslips; }

export function generatePayslip(userId: string, month: string, year: number): Payslip {
  const store = getStore();
  const user = store.users.find(u => u.id === userId);
  const basic = user?.salary || 50000;
  const hra = Math.round(basic * 0.3);
  const allowances = Math.round(basic * 0.12);
  const deductions = Math.round(basic * 0.18);
  const payslip: Payslip = {
    id: `pay-${Date.now()}`, userId, userName: user?.name || '',
    month, year, basicSalary: basic, hra, allowances, deductions,
    netSalary: basic + hra + allowances - deductions,
    status: 'generated', generatedOn: new Date().toISOString().split('T')[0],
  };
  store.payslips.push(payslip);
  saveStore(store); return payslip;
}

// ── IT Issues ────────────────────────────────────────────────────────────────
export function createITIssue(issue: Omit<ITIssue, 'id'>): ITIssue {
  const store = getStore();
  const newIssue = { ...issue, id: `it-${Date.now()}` };
  store.itIssues.push(newIssue);
  saveStore(store); return newIssue;
}
export function getITIssues(): ITIssue[] { return getStore().itIssues.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
export function updateITIssue(id: string, updates: Partial<ITIssue>): boolean {
  const store = getStore();
  const idx = store.itIssues.findIndex(i => i.id === id);
  if (idx < 0) return false;
  store.itIssues[idx] = { ...store.itIssues[idx], ...updates };
  saveStore(store); return true;
}

// ── Holidays ─────────────────────────────────────────────────────────────────
export function getHolidays(): Holiday[] { return getStore().holidays.sort((a, b) => a.date.localeCompare(b.date)); }
export function createHoliday(h: Omit<Holiday, 'id'>): Holiday {
  const store = getStore();
  const newH = { ...h, id: `hol-${Date.now()}` };
  store.holidays.push(newH);
  saveStore(store); return newH;
}
export function deleteHoliday(id: string): boolean {
  const store = getStore();
  store.holidays = store.holidays.filter(h => h.id !== id);
  saveStore(store); return true;
}

// ── Performance ──────────────────────────────────────────────────────────────
export function getPerformanceReviews(userId?: string): PerformanceReview[] {
  const store = getStore();
  return (userId ? store.performance.filter(p => p.userId === userId) : store.performance)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function createPerformanceReview(review: Omit<PerformanceReview, 'id'>): PerformanceReview {
  const store = getStore();
  const newR = { ...review, id: `perf-${Date.now()}` };
  store.performance.push(newR);
  saveStore(store); return newR;
}
export function updatePerformanceReview(id: string, updates: Partial<PerformanceReview>): boolean {
  const store = getStore();
  const idx = store.performance.findIndex(p => p.id === id);
  if (idx < 0) return false;
  store.performance[idx] = { ...store.performance[idx], ...updates };
  saveStore(store); return true;
}

// ── Jobs & Candidates ────────────────────────────────────────────────────────
export function getJobs(): JobPosting[] { return getStore().jobs.sort((a, b) => b.postedOn.localeCompare(a.postedOn)); }
export function createJob(job: Omit<JobPosting, 'id'>): JobPosting {
  const store = getStore();
  const newJob = { ...job, id: `job-${Date.now()}` };
  store.jobs.push(newJob);
  saveStore(store); return newJob;
}
export function updateJob(id: string, updates: Partial<JobPosting>): boolean {
  const store = getStore();
  const idx = store.jobs.findIndex(j => j.id === id);
  if (idx < 0) return false;
  store.jobs[idx] = { ...store.jobs[idx], ...updates };
  saveStore(store); return true;
}
export function deleteJob(id: string): boolean {
  const store = getStore();
  store.jobs = store.jobs.filter(j => j.id !== id);
  saveStore(store); return true;
}

export function getCandidates(jobId?: string): Candidate[] {
  const store = getStore();
  return (jobId ? store.candidates.filter(c => c.jobId === jobId) : store.candidates)
    .sort((a, b) => b.appliedOn.localeCompare(a.appliedOn));
}
export function createCandidate(c: Omit<Candidate, 'id'>): Candidate {
  const store = getStore();
  const newC = { ...c, id: `cand-${Date.now()}` };
  store.candidates.push(newC);
  saveStore(store); return newC;
}
export function updateCandidate(id: string, updates: Partial<Candidate>): boolean {
  const store = getStore();
  const idx = store.candidates.findIndex(c => c.id === id);
  if (idx < 0) return false;
  store.candidates[idx] = { ...store.candidates[idx], ...updates };
  saveStore(store); return true;
}

// ── Documents ────────────────────────────────────────────────────────────────
export function getDocumentsForUser(userId: string): Document[] {
  return getStore().documents.filter(d => d.userId === userId).sort((a, b) => b.uploadedOn.localeCompare(a.uploadedOn));
}
export function getAllDocuments(): Document[] { return getStore().documents; }
export function createDocument(doc: Omit<Document, 'id'>): Document {
  const store = getStore();
  const newDoc = { ...doc, id: `doc-${Date.now()}` };
  store.documents.push(newDoc);
  saveStore(store); return newDoc;
}
export function deleteDocument(id: string): boolean {
  const store = getStore();
  store.documents = store.documents.filter(d => d.id !== id);
  saveStore(store); return true;
}
