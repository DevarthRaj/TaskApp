import { AppData, Category } from "./types";

const STORAGE_KEY = "flowledger-data";

const PRESET_COLORS = [
  "#10b981", // emerald
  "#f43f5e", // rose
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
  "#84cc16", // lime
  "#e11d48", // crimson
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-food", name: "Food & Dining", color: "#f59e0b" },
  { id: "cat-health", name: "Health & Wellness", color: "#10b981" },
  { id: "cat-transport", name: "Transportation", color: "#3b82f6" },
  { id: "cat-investments", name: "Investments", color: "#8b5cf6" },
  { id: "cat-entertainment", name: "Entertainment", color: "#ec4899" },
  { id: "cat-housing", name: "Housing", color: "#06b6d4" },
  { id: "cat-others", name: "Others", color: "#6b7280" },
];

export function getDefaultData(): AppData {
  return {
    categories: DEFAULT_CATEGORIES,
    months: {},
  };
}

export function loadData(): AppData {
  if (typeof window === "undefined") return getDefaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const parsed = JSON.parse(raw) as AppData;
    // Ensure categories exist
    if (!parsed.categories || parsed.categories.length === 0) {
      parsed.categories = DEFAULT_CATEGORIES;
    }
    if (!parsed.months) {
      parsed.months = {};
    }
    return parsed;
  } catch {
    return getDefaultData();
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}
