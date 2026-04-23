export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  description: string;
  date: string;
}

export interface MonthData {
  salary: number;
  expenses: Expense[];
}

export interface AppData {
  categories: Category[];
  months: Record<string, MonthData>;
}
