export type TransactionType = "INCOME" | "EXPENSE";

export interface Category {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Event {
  id: string;
  name: string;
  description: string | null;
  date: string | null;
  color: string;
  createdAt: string;
  categories?: Category[];
  totalSpent?: number;
  transactionCount?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  categoryId: string | null;
  eventId: string | null;
  createdAt: string;
  category?: Category | null;
  event?: Event | null;
}

// Legacy alias for backward compat in components
export type Expense = Transaction;
