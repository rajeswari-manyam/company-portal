import type React from 'react';

// ─── Core Role & Auth ──────────────────────────────────────────────────────────
export type Role = 'admin' | 'hr' | 'employee';
export type Status = 'active' | 'inactive';

export interface UserRecord {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  department: string;
  departmentId: string;
  designation: string;
  phone: string;
  joinDate: string;
  status: Status;
  mustChangePassword: boolean;
  createdBy: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  salary?: number;
  bloodGroup?: string;
  emergencyContact?: string;
  manager?: string;
  avatar?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  head: string;
  createdAt: string;
  employeeCount: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'late';

export interface AttendanceSummary {
  userId: string;
  date: string;
  workSeconds: number;
  idleSeconds: number;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  reviewedBy?: string;
  reviewNote?: string;
}

export interface LeaveBalance {
  leaveType: string;
  total: number;
  used: number;
  remaining: number;
}

export type PayslipStatus = 'generated' | 'paid';

export interface Payslip {
  id: string;
  userId: string;
  userName: string;
  month: string;
  year: number;
  basicSalary: number;
  hra: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: PayslipStatus;
  generatedOn: string;
}

export type AnnouncementPriority = 'low' | 'medium' | 'high';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  priority: AnnouncementPriority;
  targetDeptId: string | 'all';
}

export type HolidayType = 'national' | 'regional' | 'company';

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: HolidayType;
  description?: string;
}

export type ReviewStatus = 'draft' | 'submitted' | 'reviewed';

export interface PerformanceReview {
  id: string;
  userId: string;
  userName: string;
  period: string;
  rating: number;
  goals: string[];
  feedback: string;
  status: ReviewStatus;
  reviewedBy?: string;
  createdAt: string;
}

export type DocumentType = 'offer-letter' | 'resume' | 'certificate' | 'id-proof' | 'other';

export interface EDocument {
  id: string;
  userId: string;
  name: string;
  type: DocumentType;
  size: string;
  uploadedOn: string;
  url?: string;
}

export type JobStatus = 'open' | 'closed' | 'draft';
export type CandidateStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'hired';

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  skills: string[];
  experience: string;
  salaryRange: string;
  status: JobStatus;
  applicants: number;
  postedOn: string;
}

export interface Candidate {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  skills: string[];
  status: CandidateStatus;
  appliedOn: string;
}

export type ITIssueStatus = 'open' | 'in-progress' | 'resolved';
export type Priority = 'low' | 'medium' | 'high';

export interface ITIssue {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  priority: Priority;
  status: ITIssueStatus;
  createdAt: string;
}

export interface NavItem {
  to: string;
  label: string;
  icon: string;
}

export interface StatCardData {
  label: string;
  value: string | number;
  icon: string;
  bg: string;
  text: string;
  onClick?: () => void;
}

// Generic table column — used by module-level table components
export interface TableColumn<T = unknown> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}
