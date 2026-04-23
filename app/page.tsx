"use client";

import { useState, useEffect, useCallback } from "react";
import { AppData, Expense, Category } from "@/lib/types";
import { loadData, saveData, getMonthKey, formatMonthLabel, formatCurrency, getDefaultData } from "@/lib/storage";
import ExpenseModal from "@/components/ExpenseModal";
import CategoryPanel from "@/components/CategoryPanel";
import MonthSummary from "@/components/MonthSummary";

const NAV_ITEMS = [
  { icon: "dashboard", label: "Dashboard", active: true },
  { icon: "trending_up", label: "Investments" },
  { icon: "receipt_long", label: "Fixed Costs" },
  { icon: "show_chart", label: "Variable" },
  { icon: "savings", label: "Savings" },
  { icon: "inventory_2", label: "Archives" },
];

export default function HomePage() {
  const [data, setData] = useState<AppData>(getDefaultData());
  const [currentMonth, setCurrentMonth] = useState(() => getMonthKey(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingSalary, setEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => { setData(loadData()); setIsLoaded(true); }, []);
  useEffect(() => { if (isLoaded) saveData(data); }, [data, isLoaded]);

  const md = data.months[currentMonth] || { salary: 0, expenses: [] };
  const totalSpent = md.expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = md.salary - totalSpent;

  const updateMonth = useCallback(
    (fn: (p: typeof md) => typeof md) => {
      setData((prev) => ({
        ...prev,
        months: { ...prev.months, [currentMonth]: fn(prev.months[currentMonth] || { salary: 0, expenses: [] }) },
      }));
    },
    [currentMonth]
  );

  const navMonth = (d: number) => {
    const [y, m] = currentMonth.split("-").map(Number);
    setCurrentMonth(getMonthKey(new Date(y, m - 1 + d)));
    setVisibleCount(6);
  };

  const addExpense = (e: Expense) => updateMonth((p) => ({ ...p, expenses: [...p.expenses, e] }));
  const delExpense = (id: string) => updateMonth((p) => ({ ...p, expenses: p.expenses.filter((x) => x.id !== id) }));

  const submitSalary = () => {
    const v = parseFloat(salaryInput);
    if (!isNaN(v) && v >= 0) updateMonth((p) => ({ ...p, salary: v }));
    setEditingSalary(false);
  };

  const addCat = (c: Category) => setData((p) => ({ ...p, categories: [...p.categories, c] }));
  const delCat = (id: string) => setData((p) => ({ ...p, categories: p.categories.filter((c) => c.id !== id) }));
  const getCat = (id: string) => data.categories.find((c) => c.id === id);

  const sorted = [...md.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const visible = sorted.slice(0, visibleCount);

  if (!isLoaded) return (
    <div className="flex items-center justify-center h-full w-full bg-[#131315]">
      <div className="w-6 h-6 border-2 border-[#4edea3] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#131315]">
      {/* ─── Sidebar ─── */}
      <aside className="w-56 flex-shrink-0 bg-[#0F172A]/30 backdrop-blur-[25px] border-r border-white/10 shadow-[10px_0_30px_rgba(0,0,0,0.3)] flex flex-col py-6 z-40">
        <div className="px-6 mb-10">
          <h2 className="font-[Space_Grotesk] text-[11px] font-bold text-[#4edea3] uppercase tracking-[0.15em]">Terminal_01</h2>
          <p className="font-[Space_Grotesk] text-[9px] text-[#45464d] uppercase tracking-[0.2em] mt-1">High Net Worth Mode</p>
        </div>
        <nav className="flex-1 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button key={item.label} className={`w-full flex items-center gap-4 px-6 py-3 text-sm font-[Manrope] transition-all duration-300 ${item.active
                ? "bg-[#4edea3]/10 text-[#4edea3] border-r-2 border-[#4edea3] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                : "text-[#45464d] hover:bg-white/5 hover:text-[#c6c6cd]"
              }`}>
              <span className="material-symbols-outlined text-[18px]" style={item.active ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-4 space-y-1 mt-auto">
          <button className="w-full py-3 rounded border border-[#4edea3]/50 bg-[#4edea3]/10 text-[#4edea3] hover:bg-[#4edea3]/20 transition-all text-[10px] tracking-[0.15em] uppercase font-[Space_Grotesk] font-bold shadow-[0_0_15px_rgba(16,185,129,0.1)] glass-inner-border mb-3">
            Manage Categories
          </button>
          {[{ icon: "verified_user", label: "Security" }, { icon: "help_outline", label: "Support" }].map((l) => (
            <button key={l.label} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-[#45464d] hover:text-[#c6c6cd] hover:bg-white/5 transition-all font-[Manrope] rounded">
              <span className="material-symbols-outlined text-[16px]">{l.icon}</span>
              {l.label}
            </button>
          ))}
        </div>
      </aside>

      {/* ─── Main ─── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex-shrink-0 flex items-center justify-between px-10 h-[72px] border-b border-white/10 bg-[#0F172A]/40 backdrop-blur-[20px] shadow-[0_8px_32px_0_rgba(16,185,129,0.08)]">
          <div className="flex items-center gap-10">
            <h1 className="text-xl font-semibold italic text-[#e4e2e4] font-[Newsreader] tracking-tight">Flowledger</h1>
            <nav className="flex items-center gap-7">
              {["Analytics", "Ledger", "Accounts", "Reports"].map((t, i) => (
                <button key={t} className={`text-sm font-[Manrope] font-medium pb-1 transition-all duration-300 ${i === 1
                    ? "text-[#4edea3] border-b-2 border-[#4edea3]/50"
                    : "text-[#45464d] border-b-2 border-transparent hover:text-[#c6c6cd]"
                  }`}>{t}</button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2 text-sm font-[Manrope] font-medium border border-white/10 rounded text-[#c6c6cd] hover:bg-white/5 hover:border-white/20 transition-all glass-inner-border">
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add Transaction
            </button>
            <div className="flex items-center gap-3 text-[#c6c6cd]">
              <button className="hover:text-[#4edea3] transition-colors"><span className="material-symbols-outlined text-[20px]">settings</span></button>
              <button className="hover:text-[#4edea3] transition-colors relative">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-[#4edea3] shadow-[0_0_5px_rgba(78,222,163,0.8)]" />
              </button>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4edea3] to-[#00a572] flex items-center justify-center text-xs font-bold text-white shadow-[0_0_12px_rgba(78,222,163,0.3)]">U</div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-10 py-8">
          {/* Top cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Liquid Assets */}
            <div className="col-span-2 bg-[#353436]/40 backdrop-blur-xl border border-white/10 rounded-lg p-7 relative overflow-hidden liquid-bg-gradient shadow-[0_10px_40px_rgba(0,0,0,0.2)] glass-inner-border group hover:border-[#4edea3]/20 transition-all duration-500">
              <div className="absolute -right-8 -top-8 w-36 h-36 bg-[#4edea3]/10 rounded-full blur-3xl group-hover:bg-[#4edea3]/15 transition-all duration-500" />
              <div className="flex items-start justify-between mb-6">
                <p className="font-[Space_Grotesk] text-[11px] font-bold text-[#909097] uppercase tracking-[0.1em]">Liquid Assets</p>
                <div className="flex items-center gap-2 bg-[#353436]/60 rounded px-3 py-1.5 border border-white/5 glass-inner-border">
                  <button onClick={() => navMonth(-1)} className="text-[#909097] hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                  </button>
                  <span className="font-[Space_Grotesk] text-[12px] text-[#c6c6cd] font-medium min-w-[130px] text-center tracking-wide">
                    📅 {formatMonthLabel(currentMonth)}
                  </span>
                  <button onClick={() => navMonth(1)} className="text-[#909097] hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  </button>
                </div>
              </div>
              <p className={`font-[Space_Grotesk] text-[42px] font-semibold tracking-tight leading-none ${remaining >= 0 ? "text-[#e4e2e4]" : "text-[#ffb4ab]"}`}>
                <span className="text-[#909097] text-[28px] mr-1">$</span>
                {Math.abs(remaining).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {remaining < 0 && <span className="text-sm text-[#ffb4ab]/70 ml-2 font-normal">deficit</span>}
              </p>
            </div>

            {/* Salary */}
            <div className="bg-[#353436]/40 backdrop-blur-xl border border-white/10 rounded-lg p-7 relative overflow-hidden liquid-bg-gradient shadow-[0_10px_40px_rgba(0,0,0,0.2)] glass-inner-border group hover:border-[#ffb95f]/20 transition-all duration-500">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#ffb95f]/10 rounded-full blur-3xl group-hover:bg-[#ffb95f]/15 transition-all duration-500" />
              <p className="font-[Space_Grotesk] text-[11px] font-bold text-[#909097] uppercase tracking-[0.1em] mb-1">Total Inflow</p>
              <p className="text-sm text-[#c6c6cd] font-[Manrope] mb-4">Expected Salary</p>
              {editingSalary ? (
                <div className="flex items-center gap-2">
                  <span className="text-[#909097] text-xl font-[Space_Grotesk]">$</span>
                  <input type="number" value={salaryInput} onChange={(e) => setSalaryInput(e.target.value)}
                    onBlur={submitSalary} onKeyDown={(e) => e.key === "Enter" && submitSalary()}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-2xl font-[Space_Grotesk] text-[#e4e2e4] focus:outline-none focus:ring-1 focus:ring-[#4edea3]/30 glass-inner-border"
                    autoFocus min="0" step="0.01" />
                </div>
              ) : (
                <button onClick={() => { setSalaryInput(md.salary.toString()); setEditingSalary(true); }} className="flex items-center gap-1 group/sal">
                  <span className="text-[#909097] text-xl font-[Space_Grotesk]">$</span>
                  <span className="text-[28px] font-semibold font-[Space_Grotesk] text-[#e4e2e4] group-hover/sal:text-[#4edea3] transition-colors tracking-wide">
                    {md.salary.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom: Categories + Expenses */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-1 space-y-6">
              <CategoryPanel categories={data.categories} expenses={md.expenses} onAddCategory={addCat} onDeleteCategory={delCat} />
              <MonthSummary salary={md.salary} expenses={md.expenses} categories={data.categories} />
            </div>

            {/* Expense Log */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-[Newsreader] text-lg font-medium text-[#e4e2e4]">Expense Log</h3>
                <span className="font-[Space_Grotesk] text-sm tracking-wide text-[#909097]">
                  Total: <span className={totalSpent > 0 ? "text-[#ffb4ab]" : "text-[#45464d]"}>-{formatCurrency(totalSpent)}</span>
                </span>
              </div>

              {sorted.length === 0 ? (
                <div className="bg-[#1f1f21]/40 backdrop-blur-xl border border-white/5 border-dashed rounded-lg p-14 text-center glass-inner-border">
                  <span className="material-symbols-outlined text-[40px] text-[#353436] mb-3 block">receipt_long</span>
                  <p className="text-[#909097] text-sm font-[Manrope] mb-1">No expenses this month</p>
                  <p className="text-[#45464d] text-xs font-[Manrope]">Click <span className="text-[#4edea3]">+ Add Transaction</span> to get started</p>
                </div>
              ) : (
                <div className="bg-[#1f1f21]/60 backdrop-blur-xl border border-white/5 rounded-lg overflow-hidden glass-inner-border shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                  {/* Header */}
                  <div className="grid grid-cols-[80px_1fr_130px_110px_36px] gap-4 px-6 py-3 border-b border-white/10">
                    {["Date", "Description", "Category", "Amount", ""].map((h) => (
                      <span key={h} className="font-[Space_Grotesk] text-[10px] font-bold text-[#909097] uppercase tracking-[0.12em]">{h}</span>
                    ))}
                  </div>
                  {/* Rows */}
                  {visible.map((exp, i) => {
                    const cat = getCat(exp.categoryId);
                    const d = new Date(exp.date + "T00:00:00");
                    return (
                      <div key={exp.id} className="grid grid-cols-[80px_1fr_130px_110px_36px] gap-4 items-center px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors group animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                        <span className="font-[Space_Grotesk] text-xs text-[#909097] tracking-wide">
                          {d.toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
                        </span>
                        <span className="text-sm text-[#e4e2e4] font-[Manrope] font-medium truncate">{exp.description}</span>
                        <span>
                          {cat && (
                            <span className="inline-block px-3 py-0.5 rounded font-[Space_Grotesk] text-[9px] font-bold uppercase tracking-[0.12em]"
                              style={{ backgroundColor: cat.color + "18", color: cat.color, boxShadow: `0 0 8px ${cat.color}15` }}>
                              {cat.name.length > 12 ? cat.name.slice(0, 12) + "…" : cat.name}
                            </span>
                          )}
                        </span>
                        <span className="text-sm font-[Space_Grotesk] tracking-wide text-[#c6c6cd] text-right">-{formatCurrency(exp.amount)}</span>
                        <button onClick={() => delExpense(exp.id)} className="opacity-0 group-hover:opacity-100 text-[#45464d] hover:text-[#ffb4ab] transition-all">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    );
                  })}
                  {sorted.length > visibleCount && (
                    <button onClick={() => setVisibleCount((p) => p + 6)}
                      className="w-full py-3 font-[Space_Grotesk] text-[10px] font-bold text-[#45464d] hover:text-[#4edea3] uppercase tracking-[0.15em] transition-colors">
                      Load More ↓
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Floating button */}
      <button onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 flex items-center gap-2 px-7 py-3.5 bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30 font-[Space_Grotesk] font-bold text-sm tracking-wide rounded hover:bg-[#4edea3]/30 hover:border-[#4edea3]/50 transition-all duration-300 shadow-[0_0_25px_rgba(78,222,163,0.15)] glass-inner-border z-40 active:scale-95">
        <span className="material-symbols-outlined text-[20px]">add</span>
        Add Expense
      </button>

      <ExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addExpense} categories={data.categories} currentMonthKey={currentMonth} />
    </div>
  );
}