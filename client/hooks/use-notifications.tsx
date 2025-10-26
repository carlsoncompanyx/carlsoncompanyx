import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Email = {
  id: string;
  from_name: string;
  from_email: string;
  subject: string;
  body: string;
  received_date: string;
  is_read: boolean;
  is_archived: boolean;
  resume_url: string | null;
  message_id: string;
};

type TaxPayment = {
  id: string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  year: number;
  dueDate: string;
  isPaid: boolean;
  paidAt: string | null;
  daysUntilDue: number;
  needsAttention: boolean;
};

type AutomationResult = {
  id: string;
  title: string;
  description?: string;
  href?: string;
  createdAt: string;
  resolved: boolean;
};

type AutomationResultInput = {
  id: string;
  title: string;
  description?: string;
  href?: string;
  createdAt?: string;
};

type NotificationContextValue = {
  emails: Email[];
  setEmails: React.Dispatch<React.SetStateAction<Email[]>>;
  unreadEmailCount: number;
  taxPayments: TaxPayment[];
  markTaxPaymentPaid: (id: string) => void;
  markTaxPaymentUnpaid: (id: string) => void;
  financeNotifications: number;
  pendingAutomationResults: AutomationResult[];
  addAutomationResult: (result: AutomationResultInput) => void;
  resolveAutomationResult: (id: string) => void;
  removeAutomationResult: (id: string) => void;
  toolNotifications: number;
  totalNotifications: number;
};

const EMAIL_STORAGE_KEY = "carlson:emails";
const TAX_STORAGE_KEY = "carlson:tax-payments";
const AUTOMATION_STORAGE_KEY = "carlson:automation-results";

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const INITIAL_EMAILS: Email[] = [
  {
    id: "1",
    from_name: "Alice",
    from_email: "alice@example.com",
    subject: "Proposal",
    body: "Hey — please review the attached proposal.",
    received_date: new Date().toISOString(),
    is_read: false,
    is_archived: false,
    resume_url: null,
    message_id: "m1",
  },
  {
    id: "2",
    from_name: "Bob",
    from_email: "bob@example.com",
    subject: "Invoice",
    body: "Invoice for last month attached.",
    received_date: new Date().toISOString(),
    is_read: true,
    is_archived: false,
    resume_url: null,
    message_id: "m2",
  },
];

const createQuarterSchedule = (year: number) => {
  return [
    { id: `${year}-Q1`, quarter: "Q1" as const, month: 3, day: 31 },
    { id: `${year}-Q2`, quarter: "Q2" as const, month: 6, day: 30 },
    { id: `${year}-Q3`, quarter: "Q3" as const, month: 9, day: 30 },
    { id: `${year}-Q4`, quarter: "Q4" as const, month: 12, day: 31 },
  ].map((entry) => ({
    ...entry,
    year,
    dueDate: new Date(year, entry.month - 1, entry.day, 23, 59, 59, 999),
  }));
};

const readStorage = <T,>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    console.warn(`Failed to read localStorage key "${key}"`, error);
    return null;
  }
};

const writeStorage = <T,>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to persist localStorage key "${key}"`, error);
  }
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [emails, setEmails] = useState<Email[]>(() => {
    const stored = readStorage<Email[]>(EMAIL_STORAGE_KEY);
    return stored ?? INITIAL_EMAILS;
  });

  const [taxPaymentStatus, setTaxPaymentStatus] = useState<Record<string, { paid: boolean; paidAt: string | null }>>(() => {
    const stored = readStorage<Record<string, { paid: boolean; paidAt: string | null }>>(TAX_STORAGE_KEY);
    return stored ?? {};
  });

  const [automationResults, setAutomationResults] = useState<AutomationResult[]>(() => {
    const stored = readStorage<AutomationResult[]>(AUTOMATION_STORAGE_KEY);
    if (stored) {
      return stored.map((item) => ({ ...item, resolved: Boolean(item.resolved) }));
    }
    return [];
  });

  useEffect(() => {
    writeStorage(EMAIL_STORAGE_KEY, emails);
  }, [emails]);

  useEffect(() => {
    writeStorage(TAX_STORAGE_KEY, taxPaymentStatus);
  }, [taxPaymentStatus]);

  useEffect(() => {
    writeStorage(AUTOMATION_STORAGE_KEY, automationResults);
  }, [automationResults]);

  const unreadEmailCount = useMemo(() => {
    return emails.filter((email) => !email.is_archived && !email.is_read).length;
  }, [emails]);

  const taxPayments = useMemo<TaxPayment[]>(() => {
    const now = new Date();
    const baseYear = now.getFullYear();
    const schedules = [...createQuarterSchedule(baseYear), ...createQuarterSchedule(baseYear + 1)];
    const dayMs = 1000 * 60 * 60 * 24;

    return schedules.map((payment) => {
      const dueDate = payment.dueDate;
      const status = taxPaymentStatus[payment.id];
      const diffMs = dueDate.getTime() - now.getTime();
      const daysUntilDue = Math.ceil(diffMs / dayMs);
      const isPaid = Boolean(status?.paid);
      const needsAttention = !isPaid && daysUntilDue <= 14;

      return {
        id: payment.id,
        quarter: payment.quarter,
        year: payment.year,
        dueDate: dueDate.toISOString(),
        isPaid,
        paidAt: status?.paidAt ?? null,
        daysUntilDue,
        needsAttention,
      };
    });
  }, [taxPaymentStatus]);

  const financeNotifications = useMemo(() => {
    return taxPayments.filter((payment) => payment.needsAttention).length;
  }, [taxPayments]);

  const addAutomationResult = (result: AutomationResultInput) => {
    const createdAt = result.createdAt ?? new Date().toISOString();
    setAutomationResults((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === result.id);
      const updated: AutomationResult = {
        id: result.id,
        title: result.title,
        description: result.description,
        href: result.href,
        createdAt,
        resolved: false,
      };

      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = updated;
        return copy;
      }

      return [updated, ...prev];
    });
  };

  const resolveAutomationResult = (id: string) => {
    setAutomationResults((prev) =>
      prev.map((item) => (item.id === id ? { ...item, resolved: true } : item)),
    );
  };

  const removeAutomationResult = (id: string) => {
    setAutomationResults((prev) => prev.filter((item) => item.id !== id));
  };

  const toolNotifications = useMemo(() => {
    return automationResults.filter((result) => !result.resolved).length;
  }, [automationResults]);

  const totalNotifications = unreadEmailCount + financeNotifications + toolNotifications;

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const anyNavigator = navigator as Navigator & {
      setAppBadge?: (value?: number) => Promise<void> | void;
      clearAppBadge?: () => Promise<void> | void;
    };

    if (totalNotifications > 0 && typeof anyNavigator.setAppBadge === "function") {
      const badgeResult = anyNavigator.setAppBadge(totalNotifications);
      if (badgeResult instanceof Promise) {
        badgeResult.catch(() => {
          /* ignore */
        });
      }
    } else if (totalNotifications === 0 && typeof anyNavigator.clearAppBadge === "function") {
      const clearResult = anyNavigator.clearAppBadge();
      if (clearResult instanceof Promise) {
        clearResult.catch(() => {
          /* ignore */
        });
      }
    }
  }, [totalNotifications]);

  const markTaxPaymentPaid = (id: string) => {
    setTaxPaymentStatus((prev) => ({
      ...prev,
      [id]: { paid: true, paidAt: new Date().toISOString() },
    }));
  };

  const markTaxPaymentUnpaid = (id: string) => {
    setTaxPaymentStatus((prev) => ({
      ...prev,
      [id]: { paid: false, paidAt: null },
    }));
  };

  const value: NotificationContextValue = {
    emails,
    setEmails,
    unreadEmailCount,
    taxPayments,
    markTaxPaymentPaid,
    markTaxPaymentUnpaid,
    financeNotifications,
    pendingAutomationResults: automationResults,
    addAutomationResult,
    resolveAutomationResult,
    removeAutomationResult,
    toolNotifications,
    totalNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

