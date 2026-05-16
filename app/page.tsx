"use client";

import { useState, useEffect, useCallback } from "react";
import { Category, Transaction, TransactionType, Event } from "@/lib/types";
import {
  fetchCategories,
  fetchTransactions,
  fetchEvents,
  deleteTransaction,
  getMonthKey,
  formatMonthLabel,
  formatCurrency,
} from "@/lib/storage";
import Link from "next/link";
import TransactionModal from "@/components/TransactionModal";
import CategoryPanel from "@/components/CategoryPanel";
import MonthSummary from "@/components/MonthSummary";
import ChatBot from "@/components/ChatBot";

const NAV_ITEMS = [
  { icon: "dashboard", label: "Dashboard", active: true },
  { icon: "trending_up", label: "Investments" },
  { icon: "receipt_long", label: "Fixed Costs" },
  { icon: "show_chart", label: "Variable" },
  { icon: "savings", label: "Savings" },
  { icon: "inventory_2", label: "Archives" },
];

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => getMonthKey(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<TransactionType>("EXPENSE");
  const [isLoaded, setIsLoaded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  // ── Fetch data from API ──
  const loadCategories = useCallback(async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      const txns = await fetchTransactions(currentMonth);
      setTransactions(txns);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  }, [currentMonth]);

  useEffect(() => {
    Promise.all([loadCategories(), loadTransactions(), fetchEvents().then(setEvents)]).then(() => setIsLoaded(true));
  }, [loadCategories, loadTransactions]);

  // ── Derived state ──
  const incomeTransactions = transactions.filter((t) => t.type === "INCOME");
  const expenseTransactions = transactions.filter((t) => t.type === "EXPENSE");
  const totalIncome = incomeTransactions.reduce((s, t) => s + t.amount, 0);
  const totalSpent = expenseTransactions.reduce((s, e) => s + e.amount, 0);
  const remaining = totalIncome - totalSpent;

  const navMonth = (d: number) => {
    const [y, m] = currentMonth.split("-").map(Number);
    setCurrentMonth(getMonthKey(new Date(y, m - 1 + d)));
    setVisibleCount(6);
  };

  const handleAddTransaction = (t: Transaction) => {
    setTransactions((prev) => [t, ...prev]);
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

  const openModal = (type: TransactionType) => {
    setModalDefaultType(type);
    setIsModalOpen(true);
  };

  const getCat = (id: string | null) => (id ? categories.find((c) => c.id === id) : null);

  const sorted = [...expenseTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const visible = sorted.slice(0, visibleCount);

  if (!isLoaded)
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#131315]">
        <div className="w-6 h-6 border-2 border-[#4edea3] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#131315] flex-col md:flex-row relative">
      {/* ─── Sidebar (Desktop) ─── */}
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-[#0F172A]/30 backdrop-blur-[25px] border-r border-white/10 shadow-[10px_0_30px_rgba(0,0,0,0.3)] flex-col py-6 z-40">
        <div className="px-6 mb-10">
          <h2 className="font-[Space_Grotesk] text-[11px] font-bold text-[#4edea3] uppercase tracking-[0.15em]">
            Terminal_01
          </h2>
          <p className="font-[Space_Grotesk] text-[9px] text-[#45464d] uppercase tracking-[0.2em] mt-1">
            High Net Worth Mode
          </p>
        </div>
        <nav className="flex-1 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-4 px-6 py-3 text-sm font-[Manrope] transition-all duration-300 ${
                item.active
                  ? "bg-[#4edea3]/10 text-[#4edea3] border-r-2 border-[#4edea3] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                  : "text-[#45464d] hover:bg-white/5 hover:text-[#c6c6cd]"
              }`}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={item.active ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-4 space-y-1 mt-auto">
          <button className="w-full py-3 rounded border border-[#4edea3]/50 bg-[#4edea3]/10 text-[#4edea3] hover:bg-[#4edea3]/20 transition-all text-[10px] tracking-[0.15em] uppercase font-[Space_Grotesk] font-bold shadow-[0_0_15px_rgba(16,185,129,0.1)] glass-inner-border mb-3">
            Manage Categories
          </button>
          {[
            { icon: "verified_user", label: "Security" },
            { icon: "help_outline", label: "Support" },
          ].map((l) => (
            <button
              key={l.label}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-[#45464d] hover:text-[#c6c6cd] hover:bg-white/5 transition-all font-[Manrope] rounded"
            >
              <span className="material-symbols-outlined text-[16px]">{l.icon}</span>
              {l.label}
            </button>
          ))}
        </div>
      </aside>

      {/* ─── Main ─── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 pb-[72px] md:pb-0">
        {/* Top bar */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-10 h-[60px] md:h-[72px] border-b border-white/10 bg-[#0F172A]/40 backdrop-blur-[20px] shadow-[0_8px_32px_0_rgba(16,185,129,0.08)] overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-6 md:gap-10">
            <h1 className="text-lg md:text-xl font-semibold italic text-[#e4e2e4] font-[Newsreader] tracking-tight">
              Flowledger
            </h1>
            <nav className="hidden sm:flex items-center gap-4 md:gap-7">
              {[
                { label: "Analytics", href: "/analytics" },
                { label: "Ledger", href: "/", active: true },
                { label: "Event Planner", href: "/events" },
                { label: "Reports", href: "/analytics" },
              ].map((t, i) => (
                <Link
                  key={t.label}
                  href={t.href}
                  className={`text-sm font-[Manrope] font-medium pb-1 transition-all duration-300 ${
                    t.active
                      ? "text-[#4edea3] border-b-2 border-[#4edea3]/50"
                      : "text-[#45464d] border-b-2 border-transparent hover:text-[#c6c6cd]"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 md:gap-5 ml-auto">
            <button
              onClick={() => openModal("EXPENSE")}
              className="hidden sm:flex items-center gap-2 px-4 md:px-5 py-1.5 md:py-2 text-xs md:text-sm font-[Manrope] font-medium border border-white/10 rounded text-[#c6c6cd] hover:bg-white/5 hover:border-white/20 transition-all glass-inner-border whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Transaction
            </button>
            <div className="flex items-center gap-3 text-[#c6c6cd]">
              <button className="hover:text-[#4edea3] transition-colors relative">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-[#4edea3] shadow-[0_0_5px_rgba(78,222,163,0.8)]" />
              </button>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4edea3] to-[#00a572] flex items-center justify-center text-xs font-bold text-white shadow-[0_0_12px_rgba(78,222,163,0.3)]">
              U
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8">
          {/* Top cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Liquid Assets */}
            <div className="col-span-1 lg:col-span-2 bg-[#353436]/40 backdrop-blur-xl border border-white/10 rounded-lg p-5 md:p-7 relative overflow-hidden liquid-bg-gradient shadow-[0_10px_40px_rgba(0,0,0,0.2)] glass-inner-border group hover:border-[#4edea3]/20 transition-all duration-500">
              <div className="absolute -right-8 -top-8 w-36 h-36 bg-[#4edea3]/10 rounded-full blur-3xl group-hover:bg-[#4edea3]/15 transition-all duration-500 pointer-events-none" />
              <div className="flex items-start justify-between mb-6 relative z-10">
                <p className="font-[Space_Grotesk] text-[11px] font-bold text-[#909097] uppercase tracking-[0.1em]">
                  Liquid Assets
                </p>
                <div className="flex items-center gap-2 bg-[#353436]/60 rounded px-3 py-1.5 border border-white/5 glass-inner-border">
                  <button
                    onClick={() => navMonth(-1)}
                    className="text-[#909097] hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                  </button>
                  <span className="font-[Space_Grotesk] text-[12px] text-[#c6c6cd] font-medium min-w-[130px] text-center tracking-wide">
                    📅 {formatMonthLabel(currentMonth)}
                  </span>
                  <button
                    onClick={() => navMonth(1)}
                    className="text-[#909097] hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  </button>
                </div>
              </div>
              <p
                className={`font-[Space_Grotesk] text-[32px] md:text-[42px] font-semibold tracking-tight leading-none ${
                  remaining >= 0 ? "text-[#e4e2e4]" : "text-[#ffb4ab]"
                }`}
              >
                <span className="text-[#909097] text-[20px] md:text-[28px] mr-1">₹</span>
                {Math.abs(remaining).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                {remaining < 0 && (
                  <span className="text-sm text-[#ffb4ab]/70 ml-2 font-normal">deficit</span>
                )}
              </p>
            </div>

            {/* Total Inflow — Dynamic Income */}
            <div className="col-span-1 bg-[#353436]/40 backdrop-blur-xl border border-white/10 rounded-lg p-5 md:p-7 relative overflow-hidden liquid-bg-gradient shadow-[0_10px_40px_rgba(0,0,0,0.2)] glass-inner-border group hover:border-[#ffb95f]/20 transition-all duration-500">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#ffb95f]/10 rounded-full blur-3xl group-hover:bg-[#ffb95f]/15 transition-all duration-500" />
              <p className="font-[Space_Grotesk] text-[11px] font-bold text-[#909097] uppercase tracking-[0.1em] mb-1">
                Total Inflow
              </p>
              <p className="font-[Space_Grotesk] text-[28px] font-semibold text-[#e4e2e4] tracking-wide mb-3">
                <span className="text-[#909097] text-xl mr-1">₹</span>
                {totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>

              {/* Income entries */}
              {incomeTransactions.length > 0 && (
                <div className="space-y-1.5 mb-3 max-h-[120px] overflow-y-auto">
                  {incomeTransactions.map((inc) => (
                    <div
                      key={inc.id}
                      className="flex items-center justify-between text-sm group/inc"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[#909097] font-[Space_Grotesk] text-[10px] tracking-wide whitespace-nowrap">
                          {new Date(inc.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
                        </span>
                        <span className="text-[#c6c6cd] font-[Manrope] truncate">
                          {inc.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#4edea3] font-[Space_Grotesk] text-xs tracking-wide whitespace-nowrap">
                          +{formatCurrency(inc.amount)}
                        </span>
                        <button
                          onClick={() => handleDeleteTransaction(inc.id)}
                          className="opacity-0 group-hover/inc:opacity-100 text-[#45464d] hover:text-[#ffb4ab] transition-all"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => openModal("INCOME")}
                className="flex items-center gap-1.5 text-[#4edea3] hover:text-[#6aedb8] transition-colors font-[Space_Grotesk] text-[11px] font-bold uppercase tracking-[0.1em]"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add Inflow
              </button>
            </div>
          </div>

          {/* Bottom: Categories + Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="col-span-1 space-y-4 md:space-y-6">
              <CategoryPanel
                categories={categories}
                transactions={transactions}
                onCategoriesChange={loadCategories}
              />
              <MonthSummary transactions={transactions} categories={categories} />
            </div>

            {/* Expense Log */}
            <div className="col-span-1 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-[Newsreader] text-lg font-medium text-[#e4e2e4]">
                  Expense Log
                </h3>
                <span className="font-[Space_Grotesk] text-sm tracking-wide text-[#909097]">
                  Total:{" "}
                  <span className={totalSpent > 0 ? "text-[#ffb4ab]" : "text-[#45464d]"}>
                    -{formatCurrency(totalSpent)}
                  </span>
                </span>
              </div>

              {sorted.length === 0 ? (
                <div className="bg-[#1f1f21]/40 backdrop-blur-xl border border-white/5 border-dashed rounded-lg p-14 text-center glass-inner-border">
                  <span className="material-symbols-outlined text-[40px] text-[#353436] mb-3 block">
                    receipt_long
                  </span>
                  <p className="text-[#909097] text-sm font-[Manrope] mb-1">
                    No expenses this month
                  </p>
                  <p className="text-[#45464d] text-xs font-[Manrope]">
                    Click{" "}
                    <span className="text-[#4edea3]">+ Add Transaction</span> to get
                    started
                  </p>
                </div>
              ) : (
                <div className="bg-[#1f1f21]/60 backdrop-blur-xl border border-white/5 rounded-lg overflow-hidden glass-inner-border shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                  {/* Header */}
                  <div className="grid grid-cols-[60px_1fr_80px_28px] sm:grid-cols-[80px_1fr_130px_110px_36px] gap-2 md:gap-4 px-4 md:px-6 py-3 border-b border-white/10">
                    <span className="font-[Space_Grotesk] text-[9px] md:text-[10px] font-bold text-[#909097] uppercase tracking-[0.12em]">Date</span>
                    <span className="font-[Space_Grotesk] text-[9px] md:text-[10px] font-bold text-[#909097] uppercase tracking-[0.12em]">Description</span>
                    <span className="font-[Space_Grotesk] text-[9px] md:text-[10px] font-bold text-[#909097] uppercase tracking-[0.12em] hidden sm:block">Category</span>
                    <span className="font-[Space_Grotesk] text-[9px] md:text-[10px] font-bold text-[#909097] uppercase tracking-[0.12em] text-right sm:text-left">Amount</span>
                    <span></span>
                  </div>
                  {/* Rows */}
                  {visible.map((exp, i) => {
                    const cat = getCat(exp.categoryId);
                    const d = new Date(exp.date);
                    return (
                      <div
                        key={exp.id}
                        className="grid grid-cols-[60px_1fr_80px_28px] sm:grid-cols-[80px_1fr_130px_110px_36px] gap-2 md:gap-4 items-center px-4 md:px-6 py-3 md:py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors group animate-fade-in"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <span className="font-[Space_Grotesk] text-[10px] md:text-xs text-[#909097] tracking-wide">
                          {d.toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs md:text-sm text-[#e4e2e4] font-[Manrope] font-medium truncate">
                            {exp.description}
                          </span>
                          {/* Event pill */}
                          {exp.event && (
                            <span
                              className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded text-[9px] font-[Space_Grotesk] font-bold uppercase tracking-[0.1em] w-fit"
                              style={{ backgroundColor: exp.event.color + "20", color: exp.event.color }}
                            >
                              <span className="material-symbols-outlined text-[10px]">event</span>
                              {exp.event.name}
                            </span>
                          )}
                          {/* Mobile category */}
                          {cat && (
                            <span className="sm:hidden text-[9px] text-[#909097] truncate mt-0.5" style={{ color: cat.color }}>
                              {cat.name}
                            </span>
                          )}
                        </div>
                        <span className="hidden sm:block">
                          {cat && (
                            <span
                              className="inline-block px-3 py-0.5 rounded font-[Space_Grotesk] text-[9px] font-bold uppercase tracking-[0.12em] truncate max-w-full"
                              style={{
                                backgroundColor: cat.color + "18",
                                color: cat.color,
                                boxShadow: `0 0 8px ${cat.color}15`,
                              }}
                            >
                              {cat.name.length > 15 ? cat.name.slice(0, 15) + "…" : cat.name}
                            </span>
                          )}
                        </span>
                        <span className="text-xs md:text-sm font-[Space_Grotesk] tracking-wide text-[#c6c6cd] text-right">
                          -{formatCurrency(exp.amount)}
                        </span>
                        <button
                          onClick={() => handleDeleteTransaction(exp.id)}
                          className="md:opacity-0 group-hover:opacity-100 text-[#45464d] hover:text-[#ffb4ab] transition-all flex justify-end"
                        >
                          <span className="material-symbols-outlined text-[14px] md:text-[16px]">delete</span>
                        </button>
                      </div>
                    );
                  })}
                  {sorted.length > visibleCount && (
                    <button
                      onClick={() => setVisibleCount((p) => p + 6)}
                      className="w-full py-3 font-[Space_Grotesk] text-[10px] font-bold text-[#45464d] hover:text-[#4edea3] uppercase tracking-[0.15em] transition-colors"
                    >
                      Load More ↓
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Floating Add Expense button — bottom LEFT */}
      <button
        onClick={() => openModal("EXPENSE")}
        className="fixed bottom-[88px] md:bottom-8 left-4 md:left-8 flex items-center gap-2 px-5 md:px-7 py-3 md:py-3.5 bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30 font-[Space_Grotesk] font-bold text-xs md:text-sm tracking-wide rounded-full md:rounded hover:bg-[#4edea3]/30 hover:border-[#4edea3]/50 transition-all duration-300 shadow-[0_0_25px_rgba(78,222,163,0.15)] glass-inner-border z-40 active:scale-95"
      >
        <span className="material-symbols-outlined text-[18px] md:text-[20px]">add</span>
        <span className="hidden sm:inline">Add Expense</span>
      </button>

      {/* FlowBot — RAG Finance AI */}
      <ChatBot currentMonth={currentMonth} />

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-[#0F172A]/80 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-2 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
        {[
          { icon: "dashboard", label: "Ledger", href: "/" },
          { icon: "monitoring", label: "Analytics", href: "/analytics" },
          { icon: "celebration", label: "Events", href: "/events" },
          { icon: "account_balance", label: "Finance", href: "/" },
        ].map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
              i === 0 ? "text-[#4edea3]" : "text-[#45464d] hover:text-[#c6c6cd]"
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={i === 0 ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {item.icon}
            </span>
            <span className="text-[9px] font-[Space_Grotesk] font-bold uppercase tracking-[0.08em]">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddTransaction}
        categories={categories}
        currentMonthKey={currentMonth}
        defaultType={modalDefaultType}
      />
    </div>
  );
}