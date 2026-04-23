"use client";

import { Category, Expense } from "@/lib/types";
import { formatCurrency } from "@/lib/storage";

interface MonthSummaryProps {
  salary: number;
  expenses: Expense[];
  categories: Category[];
}

export default function MonthSummary({ salary, expenses, categories }: MonthSummaryProps) {
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = salary - totalSpent;

  const breakdown = categories
    .map((cat) => {
      const t = expenses.filter((e) => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0);
      return { ...cat, total: t, pct: totalSpent > 0 ? (t / totalSpent) * 100 : 0 };
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="bg-[#1f1f21]/60 backdrop-blur-xl border border-white/5 rounded-lg p-6 glass-inner-border shadow-[0_10px_30px_rgba(0,0,0,0.2)] space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="font-[Space_Grotesk] text-[10px] font-bold text-[#909097] uppercase tracking-[0.1em] mb-1">Total Spent</p>
          <p className="text-lg font-[Space_Grotesk] font-medium text-[#e4e2e4] tracking-wide">{formatCurrency(totalSpent)}</p>
        </div>
        <div>
          <p className="font-[Space_Grotesk] text-[10px] font-bold text-[#909097] uppercase tracking-[0.1em] mb-1">Total Saved</p>
          <p className={`text-lg font-[Space_Grotesk] font-medium tracking-wide ${remaining >= 0 ? "text-[#4edea3]" : "text-[#ffb4ab]"}`}>
            {formatCurrency(Math.max(remaining, 0))}
          </p>
        </div>
      </div>

      {breakdown.length > 0 && (
        <>
          <p className="font-[Space_Grotesk] text-[10px] font-bold text-[#909097] uppercase tracking-[0.1em]">Spending Breakdown</p>
          <div className="h-2.5 rounded overflow-hidden flex bg-[#353436]/60 shadow-inner">
            {breakdown.map((cat) => (
              <div key={cat.id} className="h-full transition-all duration-500" style={{ width: `${cat.pct}%`, backgroundColor: cat.color, opacity: 0.85 }} title={`${cat.name}: ${cat.pct.toFixed(1)}%`} />
            ))}
          </div>
          <div className="space-y-2.5">
            {breakdown.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-[#c6c6cd] font-[Manrope]">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#909097] font-[Space_Grotesk] tracking-wide">{cat.pct.toFixed(1)}%</span>
                  <span className="text-xs text-[#c6c6cd] font-[Space_Grotesk] tracking-wide">{formatCurrency(cat.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
