"use client";

import { useState } from "react";
import { Category, Expense } from "@/lib/types";
import { generateId } from "@/lib/storage";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (expense: Expense) => void;
  categories: Category[];
  currentMonthKey: string;
}

export default function ExpenseModal({
  isOpen,
  onClose,
  onAdd,
  categories,
  currentMonthKey,
}: ExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => {
    const [year, month] = currentMonthKey.split("-");
    const today = new Date();
    const cm = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    if (currentMonthKey === cm) return today.toISOString().split("T")[0];
    return `${year}-${month}-01`;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !description || !date) return;
    const expense: Expense = {
      id: generateId(),
      amount: parseFloat(parseFloat(amount).toFixed(2)),
      categoryId,
      description: description.trim(),
      date,
    };
    onAdd(expense);
    setAmount("");
    setDescription("");
    setCategoryId(categories[0]?.id || "");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-[#1f1f21]/95 backdrop-blur-2xl border border-white/10 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-modal-in glass-inner-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="font-[Newsreader] text-xl font-medium text-[#e4e2e4]">Add Transaction</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-[#909097] hover:text-[#e4e2e4] hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block font-[Space_Grotesk] text-[11px] font-bold text-[#909097] uppercase tracking-[0.1em] mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#909097] font-[Space_Grotesk]">$</span>
              <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded text-[#e4e2e4] placeholder-[#45464d] focus:outline-none focus:border-[#4edea3]/50 focus:ring-1 focus:ring-[#4edea3]/20 transition-all font-[Space_Grotesk] text-lg glass-inner-border"
                required />
            </div>
          </div>
          <div>
            <label className="block font-[Space_Grotesk] text-[11px] font-bold text-[#909097] uppercase tracking-[0.1em] mb-2">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-[#e4e2e4] focus:outline-none focus:border-[#4edea3]/50 focus:ring-1 focus:ring-[#4edea3]/20 transition-all appearance-none cursor-pointer glass-inner-border font-[Manrope]"
              required>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#1f1f21]">{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-[Space_Grotesk] text-[11px] font-bold text-[#909097] uppercase tracking-[0.1em] mb-2">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Whole Foods Market"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-[#e4e2e4] placeholder-[#45464d] focus:outline-none focus:border-[#4edea3]/50 focus:ring-1 focus:ring-[#4edea3]/20 transition-all glass-inner-border font-[Manrope]"
              required />
          </div>
          <div>
            <label className="block font-[Space_Grotesk] text-[11px] font-bold text-[#909097] uppercase tracking-[0.1em] mb-2">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-[#e4e2e4] focus:outline-none focus:border-[#4edea3]/50 focus:ring-1 focus:ring-[#4edea3]/20 transition-all glass-inner-border font-[Manrope]"
              required />
          </div>
          <button type="submit"
            className="w-full py-3 bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30 font-[Space_Grotesk] font-bold text-sm uppercase tracking-[0.1em] rounded hover:bg-[#4edea3]/30 hover:border-[#4edea3]/50 transition-all shadow-[0_0_20px_rgba(78,222,163,0.1)] glass-inner-border active:scale-[0.98]">
            Add Expense
          </button>
        </form>
      </div>
    </div>
  );
}
