// src/hooks/useIsConsultancy.ts
// Returns true if the logged-in user's department is "Consultancy" (case-insensitive).
// Reads directly from AuthContext — no extra store calls needed, since UserRecord
// already has `department: string` on it.

import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

export function useIsConsultancy(): boolean {
  const { user } = useAuth();
  return useMemo(
    () => user?.department?.toLowerCase().trim() === 'consultancy',
    [user?.department],
  );
}