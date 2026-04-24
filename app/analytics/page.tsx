"use client";

import { useState, useEffect, useMemo } from "react";
import { Category, Transaction } from "@/lib/types";
import {
  fetchCategories,
  fetchTransactions,
  fetchMultiMonthTransactions,
  getMonthKey,
  formatCurrency,
} from "@/lib/storage";
import Link from "next/link";

const NAV = [
  { icon: "grid_view", label: "Overview", href: "/" },
  { icon: "monitoring", label: "Analytics", href: "/analytics", active: true },
  { icon: "receipt_long", label: "Ledger", href: "/" },
  { icon: "account_balance", label: "Vault", href: "/" },
];

export default function AnalyticsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentTransactions, setCurrentTransactions] = useState<Transaction[]>([]);
  const [historicalTransactions, setHistoricalTransactions] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);

  const now = new Date();
  const currentKey = getMonthKey(now);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, currentTxns] = await Promise.all([
          fetchCategories(),
          fetchTransactions(currentKey),
        ]);
        setCategories(cats);
        setCurrentTransactions(currentTxns);

        // Load last 6 months for bar chart
        const monthKeys: string[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          monthKeys.push(getMonthKey(d));
        }
        const historical = await fetchMultiMonthTransactions(monthKeys);
        setHistoricalTransactions(historical);
      } catch (error) {
        console.error("Failed to load analytics data:", error);
      } finally {
        setLoaded(true);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Computed metrics ──
  const expenses = currentTransactions.filter((t) => t.type === "EXPENSE");
  const incomes = currentTransactions.filter((t) => t.type === "INCOME");
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysSoFar = Math.max(now.getDate(), 1);
  const avgDaily = totalSpent / daysSoFar;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0;

  // ── Category breakdown ──
  const catBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      if (e.categoryId) map.set(e.categoryId, (map.get(e.categoryId) || 0) + e.amount);
    });
    return categories
      .map((c) => ({
        ...c,
        total: map.get(c.id) || 0,
        pct: totalSpent > 0 ? ((map.get(c.id) || 0) / totalSpent) * 100 : 0,
      }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [categories, expenses, totalSpent]);

  // ── Conic gradient for donut ──
  const conicStops = useMemo(() => {
    let acc = 0;
    return (
      catBreakdown
        .map((c) => {
          const start = acc;
          acc += c.pct;
          return `${c.color} ${start}% ${acc}%`;
        })
        .join(", ") || "#1a211d 0% 100%"
    );
  }, [catBreakdown]);

  // ── Last 6 months bars ──
  const monthBars = useMemo(() => {
    const bars: { label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = getMonthKey(d);
      const monthExpenses = historicalTransactions.filter((t) => {
        if (t.type !== "EXPENSE") return false;
        const tDate = new Date(t.date);
        return getMonthKey(tDate) === k;
      });
      const t = monthExpenses.reduce((s, e) => s + e.amount, 0);
      bars.push({
        label: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
        total: t,
      });
    }
    return bars;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historicalTransactions]);

  const maxBar = Math.max(...monthBars.map((b) => b.total), 1);

  // ── Largest expenses ──
  const topExpenses = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 3);

  // ── Budget per category (percentage of income) ──
  const budgetItems = useMemo(() => {
    return catBreakdown.slice(0, 3).map((c) => ({
      name: c.name,
      pct: totalIncome > 0 ? Math.min((c.total / totalIncome) * 100, 100) : 0,
      color: c.color,
    }));
  }, [catBreakdown, totalIncome]);

  if (!loaded)
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#0e1511]">
        <div className="w-6 h-6 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#0e1511] text-[#dde4dd] font-[Manrope]">
      {/* ─── Sidebar ─── */}
      <nav className="w-64 flex-shrink-0 h-full bg-[#161B22] border-r border-[#2D333B] flex flex-col py-8 z-40">
        <div className="px-6 pb-4 border-b border-[#2D333B] flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-sm font-bold text-white">
            U
          </div>
          <div>
            <div className="text-lg font-[Newsreader] italic text-white leading-none">
              Flowledger
            </div>
            <div className="text-[10px] text-[#8B949E] font-[Space_Grotesk] uppercase tracking-[0.15em] mt-1">
              Private Terminal
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col space-y-1 mt-4">
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className={`flex items-center gap-4 pl-4 py-3 font-[Space_Grotesk] uppercase tracking-[0.15em] text-[10px] transition-all ${
                n.active
                  ? "text-[#10B981] border-l-2 border-[#10B981] bg-[#0A0E14] translate-x-[4px]"
                  : "text-[#8B949E] hover:text-white hover:bg-[#2D333B]"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </div>
        <div className="mt-auto flex flex-col space-y-1 border-t border-[#2D333B] pt-4">
          {[
            { icon: "shield", label: "Security" },
            { icon: "help_outline", label: "Support" },
          ].map((l) => (
            <button
              key={l.label}
              className="flex items-center gap-4 pl-4 py-3 text-[#8B949E] hover:text-white hover:bg-[#2D333B] transition-all font-[Space_Grotesk] uppercase tracking-[0.15em] text-[10px]"
            >
              <span className="material-symbols-outlined text-[18px]">{l.icon}</span>
              {l.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ─── Main ─── */}
      <main className="flex-1 min-w-0 overflow-y-auto p-16 max-w-[1400px] mx-auto w-full flex flex-col gap-10">
        {/* Header */}
        <header className="flex items-end justify-between border-b border-[#3c4a42] pb-6">
          <div>
            <h1 className="font-[Newsreader] text-[32px] font-normal text-[#dde4dd]">
              Financial Intelligence
            </h1>
            <p className="font-[Space_Grotesk] text-[14px] tracking-[0.03em] text-[#bbcabf] mt-2">
              Comprehensive analysis of terminal activity.
            </p>
          </div>
          <div className="flex items-center gap-2 border border-[#3c4a42] rounded px-4 py-2 bg-[#161d19] text-[#dde4dd] font-[Space_Grotesk] text-[14px] tracking-[0.03em] cursor-pointer hover:bg-[#1a211d] transition-colors">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            <span>Last 30 Days</span>
            <span className="material-symbols-outlined text-[18px] ml-2">arrow_drop_down</span>
          </div>
        </header>

        {/* KPI Cards */}
        <section className="grid grid-cols-3 gap-6">
          <div className="border border-[#3c4a42] p-6 bg-[#1a211d] flex flex-col gap-2 group hover:border-[#4edea3] transition-colors">
            <div className="font-[Space_Grotesk] text-[12px] font-semibold text-[#bbcabf] uppercase tracking-[0.15em]">
              Total Spent
            </div>
            <div className="font-[Space_Grotesk] text-[20px] font-medium tracking-[0.05em] text-[#dde4dd]">
              {formatCurrency(totalSpent)}
            </div>
            <div className="text-[#ffb4ab] font-[Space_Grotesk] text-[14px] tracking-[0.03em] flex items-center mt-auto pt-4 border-t border-[#3c4a42]/50">
              <span className="material-symbols-outlined text-[16px] mr-1">trending_up</span>
              vs last period
            </div>
          </div>
          <div className="border border-[#3c4a42] p-6 bg-[#1a211d] flex flex-col gap-2 group hover:border-[#4edea3] transition-colors">
            <div className="font-[Space_Grotesk] text-[12px] font-semibold text-[#bbcabf] uppercase tracking-[0.15em]">
              Avg. Daily Spend
            </div>
            <div className="font-[Space_Grotesk] text-[20px] font-medium tracking-[0.05em] text-[#dde4dd]">
              {formatCurrency(avgDaily)}
            </div>
            <div className="text-[#bbcabf] font-[Space_Grotesk] text-[14px] tracking-[0.03em] flex items-center mt-auto pt-4 border-t border-[#3c4a42]/50">
              <span className="material-symbols-outlined text-[16px] mr-1">
                horizontal_rule
              </span>{" "}
              {daysInMonth - daysSoFar} days remaining
            </div>
          </div>
          <div className="border border-[#3c4a42] p-6 bg-[#1a211d] flex flex-col gap-2 group hover:border-[#4edea3] transition-colors">
            <div className="font-[Space_Grotesk] text-[12px] font-semibold text-[#bbcabf] uppercase tracking-[0.15em]">
              Savings Rate
            </div>
            <div
              className={`font-[Space_Grotesk] text-[20px] font-medium tracking-[0.05em] ${
                savingsRate >= 0 ? "text-[#4edea3]" : "text-[#ffb4ab]"
              }`}
            >
              {savingsRate.toFixed(1)}%
            </div>
            <div
              className={`font-[Space_Grotesk] text-[14px] tracking-[0.03em] flex items-center mt-auto pt-4 border-t border-[#3c4a42]/50 ${
                savingsRate >= 0 ? "text-[#4edea3]" : "text-[#ffb4ab]"
              }`}
            >
              <span className="material-symbols-outlined text-[16px] mr-1">
                {savingsRate >= 20 ? "trending_up" : "trending_down"}
              </span>{" "}
              {totalIncome > 0 ? "of income retained" : "add income first"}
            </div>
          </div>
        </section>

        {/* Charts */}
        <section className="grid grid-cols-12 gap-6 min-h-[400px]">
          {/* Donut */}
          <div className="col-span-5 border border-[#3c4a42] bg-[#1a211d] p-6 flex flex-col">
            <h3 className="font-[Space_Grotesk] text-[12px] font-semibold text-[#bbcabf] uppercase tracking-[0.15em] mb-6 border-b border-[#3c4a42] pb-2">
              Spending by Category
            </h3>
            <div className="flex-1 flex flex-col justify-center items-center">
              <div
                className="w-48 h-48 rounded-full relative flex items-center justify-center shadow-inner overflow-hidden"
                style={{ background: `conic-gradient(from 0deg, ${conicStops})` }}
              >
                <div className="w-36 h-36 bg-[#1a211d] rounded-full absolute z-10 flex flex-col items-center justify-center border border-[#3c4a42]/20">
                  <span className="font-[Space_Grotesk] text-[14px] tracking-[0.03em] text-[#bbcabf]">
                    Top Cat.
                  </span>
                  <span className="font-[Space_Grotesk] text-[20px] font-medium tracking-[0.05em] text-[#4edea3]">
                    {catBreakdown[0]?.pct.toFixed(0) || 0}%
                  </span>
                </div>
              </div>
              <div className="w-full mt-8 flex flex-col gap-2 px-4">
                {catBreakdown.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center font-[Space_Grotesk] text-[14px] tracking-[0.03em]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-[#dde4dd]">{c.name}</span>
                    </div>
                    <span className="text-[#bbcabf]">{c.pct.toFixed(0)}%</span>
                  </div>
                ))}
                {catBreakdown.length === 0 && (
                  <p className="text-[#3c4a42] text-sm text-center">No data yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <div className="col-span-7 border border-[#3c4a42] bg-[#1a211d] p-6 flex flex-col">
            <h3 className="font-[Space_Grotesk] text-[12px] font-semibold text-[#bbcabf] uppercase tracking-[0.15em] mb-6 border-b border-[#3c4a42] pb-2">
              Monthly Cash Flow Trend
            </h3>
            <div className="flex-1 w-full relative flex items-end pt-8 pb-4">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-4 pt-8">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="border-t border-[#3c4a42]/30 w-full h-0" />
                ))}
              </div>
              {/* Bars */}
              <div className="w-full h-full relative z-10 flex items-end gap-2 px-4">
                {monthBars.map((b, i) => {
                  const isCurrentMonth = i === monthBars.length - 1;
                  const h = maxBar > 0 ? (b.total / maxBar) * 100 : 0;
                  return (
                    <div
                      key={b.label}
                      className="flex-1 flex flex-col items-center justify-end gap-2 group"
                    >
                      <div
                        className={`w-full relative transition-colors ${
                          isCurrentMonth
                            ? "bg-[#10b981]/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            : "bg-[#2f3632] group-hover:bg-[#3c4a42]"
                        }`}
                        style={{ height: `${Math.max(h, 2)}%` }}
                      >
                        <div
                          className={`absolute inset-0 ${
                            isCurrentMonth
                              ? "bg-gradient-to-t from-transparent to-white/20"
                              : "bg-gradient-to-t from-transparent to-white/5"
                          }`}
                        />
                      </div>
                      <span
                        className={`font-[Space_Grotesk] text-[10px] tracking-[0.05em] ${
                          isCurrentMonth ? "text-[#4edea3]" : "text-[#bbcabf]"
                        }`}
                      >
                        {b.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom lists */}
        <section className="grid grid-cols-2 gap-6">
          {/* Largest expenses */}
          <div className="border border-[#3c4a42] bg-[#1a211d] flex flex-col">
            <div className="p-6 border-b border-[#3c4a42]">
              <h3 className="font-[Space_Grotesk] text-[12px] font-semibold text-[#bbcabf] uppercase tracking-[0.15em]">
                Largest Expenses This Period
              </h3>
            </div>
            {topExpenses.length === 0 ? (
              <div className="p-6 text-[#3c4a42] font-[Space_Grotesk] text-sm text-center">
                No expenses yet
              </div>
            ) : (
              topExpenses.map((exp, i) => {
                const cat = categories.find((c) => c.id === exp.categoryId);
                return (
                  <div
                    key={exp.id}
                    className={`flex justify-between items-center p-6 hover:bg-[#242c27] transition-colors ${
                      i < topExpenses.length - 1 ? "border-b border-[#3c4a42]/50" : ""
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-[Newsreader] text-[24px] font-normal text-[#dde4dd]">
                        {exp.description}
                      </span>
                      <span className="font-[Space_Grotesk] text-[14px] tracking-[0.03em] text-[#bbcabf]">
                        {cat?.name || "Unknown"}
                      </span>
                    </div>
                    <span className="font-[Space_Grotesk] text-[20px] font-medium tracking-[0.05em] text-[#dde4dd]">
                      -{formatCurrency(exp.amount)}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Budget status */}
          <div className="border border-[#3c4a42] bg-[#1a211d] flex flex-col p-6">
            <h3 className="font-[Space_Grotesk] text-[12px] font-semibold text-[#bbcabf] uppercase tracking-[0.15em] mb-6 border-b border-[#3c4a42] pb-2">
              Budget Status
            </h3>
            {budgetItems.length === 0 ? (
              <p className="text-[#3c4a42] font-[Space_Grotesk] text-sm text-center mt-4">
                Add expenses to see budget status
              </p>
            ) : (
              <div className="flex flex-col gap-6 mt-2">
                {budgetItems.map((b) => (
                  <div key={b.name} className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <span className="font-[Space_Grotesk] text-[14px] tracking-[0.03em] text-[#dde4dd]">
                        {b.name}
                      </span>
                      <span className="font-[Space_Grotesk] text-[14px] tracking-[0.03em] text-[#bbcabf]">
                        <span className={b.pct > 90 ? "text-[#ffb4ab]" : "text-[#dde4dd]"}>
                          {b.pct.toFixed(0)}%
                        </span>{" "}
                        utilized
                      </span>
                    </div>
                    <div className="w-full h-1 bg-[#2f3632] overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${b.pct}%`,
                          backgroundColor: b.pct > 90 ? "#ffb4ab" : b.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
