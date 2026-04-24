"use client";

import { useState } from "react";
import { Category, Transaction } from "@/lib/types";
import { formatCurrency, getNextColor, createCategory, deleteCategory } from "@/lib/storage";

interface CategoryPanelProps {
  categories: Category[];
  transactions: Transaction[];
  onCategoriesChange: () => void;
}

export default function CategoryPanel({ categories, transactions, onCategoriesChange }: CategoryPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const expenses = transactions.filter((t) => t.type === "EXPENSE");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setIsLoading(true);
    try {
      const color = getNextColor(categories);
      await createCategory(newName.trim(), color);
      onCategoriesChange();
      setNewName("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (catId: string) => {
    if (expenses.some((e) => e.categoryId === catId) && deleteConfirm !== catId) {
      setDeleteConfirm(catId);
      return;
    }
    setIsLoading(true);
    try {
      await deleteCategory(catId);
      onCategoriesChange();
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryTotal = (catId: string): number =>
    expenses.filter((e) => e.categoryId === catId).reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-[Newsreader] text-lg font-medium text-[#e4e2e4]">Category Manager</h3>
        <button onClick={() => setIsAdding(!isAdding)} className="text-[#909097] hover:text-[#4edea3] transition-colors">
          <span className="material-symbols-outlined text-[20px]">tune</span>
        </button>
      </div>

      <div className="bg-[#1f1f21]/60 backdrop-blur-xl border border-white/5 rounded-lg overflow-hidden glass-inner-border shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        {categories.map((cat) => {
          const total = getCategoryTotal(cat.id);
          return (
            <div key={cat.id} className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 last:border-0 group hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-[0_0_8px_var(--dot-glow)]" style={{ backgroundColor: cat.color, "--dot-glow": cat.color + "60" } as React.CSSProperties} />
                <span className="text-sm font-medium text-[#e4e2e4] font-[Manrope]">{cat.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#c6c6cd] font-[Space_Grotesk] tracking-wide">{formatCurrency(total)}</span>
                {deleteConfirm === cat.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDelete(cat.id)} disabled={isLoading} className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors font-[Space_Grotesk] font-bold tracking-wider">DELETE</button>
                    <button onClick={() => setDeleteConfirm(null)} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#909097] hover:bg-white/10 transition-colors font-[Space_Grotesk] font-bold tracking-wider">CANCEL</button>
                  </div>
                ) : (
                  <button onClick={() => handleDelete(cat.id)} disabled={isLoading} className="opacity-0 group-hover:opacity-100 text-[#45464d] hover:text-red-400 transition-all">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isAdding ? (
          <div className="px-5 py-3.5 border-t border-white/5">
            <div className="flex items-center gap-2">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Category name..."
                className="flex-1 px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded text-[#e4e2e4] placeholder-[#45464d] focus:outline-none focus:border-[#4edea3]/40 font-[Manrope]"
                autoFocus disabled={isLoading} />
              <button onClick={handleAdd} disabled={isLoading} className="px-3 py-1.5 text-[10px] font-bold bg-[#4edea3]/15 text-[#4edea3] rounded hover:bg-[#4edea3]/25 transition-colors font-[Space_Grotesk] tracking-wider">ADD</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsAdding(true)} className="w-full px-5 py-3.5 text-left text-sm text-[#45464d] hover:text-[#c6c6cd] hover:bg-white/[0.02] transition-colors border-t border-white/5 flex items-center gap-2 font-[Manrope]">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Category...
          </button>
        )}
      </div>
    </div>
  );
}
