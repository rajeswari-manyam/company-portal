// src/modules/announcements/types.ts

export interface Announcement {
  id: string;
  title: string;
  message: string;
  department: string;
  priority: 'high' | 'medium' | 'low';
  createdBy: string;
  createdAt?: string;
}