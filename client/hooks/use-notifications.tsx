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
  daysUntilDue: number;
  isPaid: boolean;
  isOverdue: boolean;
  needsAttention: boolean;
  paidAt: string | null;
};

type AutomationTask = {
  id: string;
  title: string;
  createdAt: string;
  link?: string;
  resolved: boolean;
};

type NotificationContextValue = {
  emails: Email[];
  setEmails: React.Dispatch<React.SetStateAction<Email[]>>;
  unreadEmailCount: number;
  taxPayments: TaxPayment[];
  markTaxPaymentPaid: (id: string) => void;
  markTaxPaymentUnpaid: (id: string) => void;
  financeNotifications: number;
  automationTasks: AutomationTask[];
  addAutomationTask: (task: { id?: string; title: string; link?: string }) => void;
  resolveAutomationTask: (id: string) => void;
  toolNotifications: number;
  totalNotifications: number;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const INITIAL_EMAILS: Email[] = [
  {
    id: "1",
    from_name: "Alice",
    from_email: "alice@example.com",
    subject: "Proposal",
    body: "Hey — please review the attached proposal.",
    received_date: new Date().toISOString(),
    is_read: true,
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
  const entries = [
    { quarter: "Q1" as const, month: 3, day: 31 },
    { quarter: "Q2" as const, month: 6, day: 30 },
    { quarter: "Q3" as const, month: 9, day: 30 },
    { quarter: "Q4" as const, month: 12, day: 31 },
  ];

  return entries.map((entry) => ({
    id: `${year}-${entry.quarter}`,
    quarter: entry.quarter,
    year,
    dueDate: new Date(year, entry.month - 1, entry.day, 23, 59, 59, 999),
  }));
};

const formatIso = (date: Date) => date.toISOString();

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [emails, setEmails] = useState<Email[]>(() => INITIAL_EMAILS);
  const [taxPaymentsPaid, setTaxPaymentsPaid] = useState<Record<string, { paidAt: string | null }>>({});
  const [automationTasks, setAutomationTasks] = useState<AutomationTask[]>([]);

  const unreadEmailCount = useMemo(
    () => emails.filter((email) => !email.is_archived && !email.is_read).length,
    [emails],
  );

  const taxPayments = useMemo<TaxPayment[]>(() => {
    const now = new Date();
    const baseYear = now.getFullYear();
    const schedule = [...createQuarterSchedule(baseYear), ...createQuarterSchedule(baseYear + 1)];
    const dayMs = 1000 * 60 * 60 * 24;
    const reminderWindowMs = 14 * dayMs;

    return schedule.map((slot) => {
      const dueDate = slot.dueDate;
      const diffMs = dueDate.getTime() - now.getTime();
      const daysUntilDue = Math.ceil(diffMs / dayMs);
      const isPaid = Boolean(taxPaymentsPaid[slot.id]?.paidAt);
      const isOverdue = !isPaid && diffMs < 0;
      const needsAttention = !isPaid && diffMs >= 0 && diffMs <= reminderWindowMs;

      return {
        id: slot.id,
        quarter: slot.quarter,
        year: slot.year,
        dueDate: formatIso(dueDate),
        daysUntilDue,
        isPaid,
        isOverdue,
        needsAttention,
        paidAt: taxPaymentsPaid[slot.id]?.paidAt ?? null,
      };
    });
  }, [taxPaymentsPaid]);

  const financeNotifications = useMemo(
    () => taxPayments.filter((payment) => payment.needsAttention).length,
    [taxPayments],
  );

  const toolNotifications = useMemo(
    () => automationTasks.filter((task) => !task.resolved).length,
    [automationTasks],
  );

  const totalNotifications = unreadEmailCount + financeNotifications + toolNotifications;

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const anyNavigator = navigator as Navigator & {
      setAppBadge?: (count: number) => Promise<void> | void;
      clearAppBadge?: () => Promise<void> | void;
    };

    if (totalNotifications > 0 && typeof anyNavigator.setAppBadge === "function") {
      try {
        anyNavigator.setAppBadge(totalNotifications);
      } catch (error) {
        console.warn("Failed to set app badge", error);
      }
    } else if (totalNotifications === 0 && typeof anyNavigator.clearAppBadge === "function") {
      try {
        anyNavigator.clearAppBadge();
      } catch (error) {
        console.warn("Failed to clear app badge", error);
      }
    }
  }, [totalNotifications]);

  const markTaxPaymentPaid = (id: string) => {
    setTaxPaymentsPaid((prev) => ({
      ...prev,
      [id]: { paidAt: new Date().toISOString() },
    }));
  };

  const markTaxPaymentUnpaid = (id: string) => {
    setTaxPaymentsPaid((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addAutomationTask: NotificationContextValue["addAutomationTask"] = ({ id, title, link }) => {
    const taskId = id ?? generateId();
    setAutomationTasks((prev) => {
      const existing = prev.find((task) => task.id === taskId);
      if (existing) {
        return prev.map((task) =>
          task.id === taskId ? { ...task, title, link, resolved: false, createdAt: task.createdAt } : task,
        );
      }

      return [
        { id: taskId, title, link, createdAt: new Date().toISOString(), resolved: false },
        ...prev,
      ];
    });
  };

  const resolveAutomationTask = (id: string) => {
    setAutomationTasks((prev) => prev.map((task) => (task.id === id ? { ...task, resolved: true } : task)));
  };

  const value: NotificationContextValue = {
    emails,
    setEmails,
    unreadEmailCount,
    taxPayments,
    markTaxPaymentPaid,
    markTaxPaymentUnpaid,
    financeNotifications,
    automationTasks,
    addAutomationTask,
    resolveAutomationTask,
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
