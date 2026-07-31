import { useEffect, useState, useCallback } from "react";
import { getAllPayslips, type Payslip } from "../../service/payrollApi";

export function usePayroll() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPayslips();
      setPayslips(data);
    } catch (err) {
      console.log("Failed to load payslips", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { payslips, loading, refresh };
}