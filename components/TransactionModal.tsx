"use client";

import { useState, useEffect } from "react";
import { Category, Transaction, TransactionType } from "@/lib/types";
import { createTransaction } from "@/lib/storage";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: Transaction) => void;
  categories: Category[];
  currentMonthKey: string;
  defaultType?: TransactionType;
}

export default function TransactionModal({
  isOpen,
  onClose,
  onAdd,
  categories,
  currentMonthKey,
  defaultType = "EXPENSE",
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState(() => {
    const [year, month] = currentMonthKey.split("-");
    const today = new Date();
    const cm = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    if (currentMonthKey === cm) return today.toISOString().split("T")[0];
    return `${year}-${month}-01`;
  });

  // Reset type when defaultType changes (e.g., clicking "Add Income" vs "Add Expense")
  useEffect(() => {
    setType(defaultType);
  }, [defaultType, isOpen]);

  // Reset category when categories change
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !date) return;
    if (type === "EXPENSE" && !categoryId) return;

    setIsSubmitting(true);
    try {
      const transaction = await createTransaction({
        type,
        amount: parseFloat(parseFloat(amount).toFixed(2)),
        description: description.trim(),
        date,
        categoryId: type === "EXPENSE" ? categoryId : null,
      });
      onAdd(transaction);
      setAmount("");
      setDescription("");
      setCategoryId(categories[0]?.id || "");
      onClose();
    } catch (error) {
      console.error("Failed to create transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
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

        {/* Type Toggle */}
        <div className="px-6 pt-5">
          <div className="flex rounded border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={`flex-1 py-2.5 text-sm font-[Space_Grotesk] font-bold tracking-[0.1em] uppercase transition-all ${
                type === "INCOME"
                  ? "bg-[#4edea3]/20 text-[#4edea3] border-r border-[#4edea3]/30"
                  : "bg-white/5 text-[#45464d] hover:text-[#909097] border-r border-white/10"
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={`flex-1 py-2.5 text-sm font-[Space_Grotesk] font-bold tracking-[0.1em] uppercase transition-all ${
                type === "EXPENSE"
                  ? "bg-[#ffb4ab]/20 text-[#ffb4ab]"
                  : "bg-white/5 text-[#45464d] hover:text-[#909097]"
              }`}
            >
              Expense
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block font-[Space_Grotesk] text-[11px] font-bold text-[#909097] uppercase tracking-[0.1em] mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#909097] font-[Space_Grotesk]">₹</span>
              <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded text-[#e4e2e4] placeholder-[#45464d] focus:outline-none focus:border-[#4edea3]/50 focus:ring-1 focus:ring-[#4edea3]/20 transition-all font-[Space_Grotesk] text-lg glass-inner-border"
                required />
            </div>
          </div>

          {/* Category (only for expenses) */}
          {type === "EXPENSE" && (
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
          )}

          <div>
            <label className="block font-[Space_Grotesk] text-[11px] font-bold text-[#909097] uppercase tracking-[0.1em] mb-2">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={type === "INCOME" ? "e.g. Monthly Salary" : "e.g. Whole Foods Market"}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-[#e4e2e4] placeholder-[#45464d] focus:outline-none focus:border-[#4edea3]/50 focus:ring-1 focus:ring-[#4edea3]/20 transition-all glass-inner-border font-[Manrope]"
              required />
          </div>

          <div>
            <label className="block font-[Space_Grotesk] text-[11px] font-bold text-[#909097] uppercase tracking-[0.1em] mb-2">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-[#e4e2e4] focus:outline-none focus:border-[#4edea3]/50 focus:ring-1 focus:ring-[#4edea3]/20 transition-all glass-inner-border font-[Manrope]"
              required />
          </div>

          <button type="submit" disabled={isSubmitting}
            className={`w-full py-3 font-[Space_Grotesk] font-bold text-sm uppercase tracking-[0.1em] rounded transition-all glass-inner-border active:scale-[0.98] disabled:opacity-50 ${
              type === "INCOME"
                ? "bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30 hover:bg-[#4edea3]/30 hover:border-[#4edea3]/50 shadow-[0_0_20px_rgba(78,222,163,0.1)]"
                : "bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/30 hover:bg-[#ffb4ab]/30 hover:border-[#ffb4ab]/50 shadow-[0_0_20px_rgba(255,180,171,0.1)]"
            }`}>
            {isSubmitting ? "Adding..." : type === "INCOME" ? "Add Income" : "Add Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
