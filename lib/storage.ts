import { Category, Event, Transaction, TransactionType } from "./types";

// ─── API Helpers ────────────────────────────────────────────

const API_BASE = "/api";

// ── Categories ──

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function createCategory(name: string, color: string): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, color }),
  });
  if (!res.ok) throw new Error("Failed to create category");
  return res.json();
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete category");
}

// ── Transactions ──

export async function fetchTransactions(month: string): Promise<Transaction[]> {
  const res = await fetch(`${API_BASE}/transactions?month=${month}`, { cache: 'no-store' });
  if (!res.ok) {
    console.error(`fetchTransactions failed: ${res.status} ${res.statusText} for URL ${res.url}`);
    throw new Error("Failed to fetch transactions");
  }
  return res.json();
}

export async function fetchMultiMonthTransactions(months: string[]): Promise<Transaction[]> {
  const res = await fetch(`${API_BASE}/transactions?months=${months.join(",")}`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function createTransaction(data: {
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  categoryId?: string | null;
  eventId?: string | null;
}): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create transaction");
  return res.json();
}

export async function updateTransaction(
  id: string,
  data: Partial<{
    type: TransactionType;
    amount: number;
    description: string;
    date: string;
    categoryId: string | null;
  }>
): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update transaction");
  return res.json();
}

export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete transaction");
}

// ── Saved Descriptions ──

export async function fetchSavedDescriptions(): Promise<{ id: string; text: string }[]> {
  const res = await fetch(`${API_BASE}/saved-descriptions`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch saved descriptions");
  return res.json();
}

export async function createSavedDescription(text: string): Promise<{ id: string; text: string }> {
  const res = await fetch(`${API_BASE}/saved-descriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Failed to save description");
  return res.json();
}

export async function deleteSavedDescription(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/saved-descriptions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete saved description");
}

// ── Events ──

export async function fetchEvents(): Promise<Event[]> {
  const res = await fetch(`${API_BASE}/events`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function fetchEvent(id: string): Promise<Event & { transactions: Transaction[] }> {
  const res = await fetch(`${API_BASE}/events/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch event");
  return res.json();
}

export async function createEvent(data: {
  name: string;
  description?: string;
  date?: string;
  color?: string;
  categoryIds?: string[];
}): Promise<Event> {
  const res = await fetch(`${API_BASE}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create event");
  return res.json();
}

export async function updateEvent(
  id: string,
  data: {
    name?: string;
    description?: string;
    date?: string;
    color?: string;
    categoryIds?: string[];
  }
): Promise<Event> {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update event");
  return res.json();
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/events/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete event");
}

// ─── Utility Functions (kept from original) ────────────────

const PRESET_COLORS = [
  "#10b981", "#f43f5e", "#3b82f6", "#f59e0b", "#8b5cf6",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
  "#84cc16", "#e11d48",
];

export function getNextColor(existingCategories: Category[]): string {
  const usedColors = new Set(existingCategories.map((c) => c.color));
  const available = PRESET_COLORS.find((c) => !usedColors.has(c));
  return available || PRESET_COLORS[existingCategories.length % PRESET_COLORS.length];
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}
