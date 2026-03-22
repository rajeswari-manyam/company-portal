// src/hooks/useIsConsultancy.ts
// user.department = MongoDB ObjectId string (e.g. "69bee5a372c7791cff7f42")
// We call GET /getAllDepartments (which already works) and match by _id.

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDepartments } from '../services/departmentApi';

export function useIsConsultancy(): boolean {
    const { user } = useAuth();
    const [isConsultancy, setIsConsultancy] = useState(false);

    const deptObjectId: string = (user as any)?.department ?? '';

    useEffect(() => {
        if (!deptObjectId) {
            setIsConsultancy(false);
            return;
        }

        // Fast path: already stored as a name (unlikely but safe)
        if (deptObjectId.toLowerCase().trim() === 'consultancy') {
            setIsConsultancy(true);
            return;
        }

        getDepartments()
            .then(({ success, departments }) => {
                if (!success) return;
                const matched = departments.find((d) => d._id === deptObjectId);
                const name = (matched?.departmentName ?? '').toLowerCase().trim();
                setIsConsultancy(name === 'consultancy');
            })
            .catch(() => setIsConsultancy(false));

    }, [deptObjectId]);

    return isConsultancy;
}