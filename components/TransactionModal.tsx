"use client";

import { useState, useEffect } from "react";
import { Category, Transaction, TransactionType, Event } from "@/lib/types";
import {
  createTransaction,
  fetchSavedDescriptions,
  fetchEvents,
  createSavedDescription,
  deleteSavedDescription,
} from "@/lib/storage";

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

  // ── Saved descriptions ──
  const [savedDescs, setSavedDescs] = useState<{ id: string; text: string }[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [savePromptVisible, setSavePromptVisible] = useState(false);

  // ── Events ──
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState<string>("");

  // Reset type when defaultType changes
  useEffect(() => {
    setType(defaultType);
  }, [defaultType, isOpen]);

  // Reset category when categories change
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  // Load saved descriptions when modal opens
  useEffect(() => {
    if (isOpen) {
      let active = true;
      fetchSavedDescriptions()
        .then((data) => {
          if (!active) return;
          setSavedDescs((prev) => {
            // Merge to prevent overwriting items the user just saved locally
            const newIds = new Set(data.map((d) => d.id));
            const locallyAdded = prev.filter((p) => !newIds.has(p.id));
            return [...locallyAdded, ...data];
          });
        })
        .catch(() => {});
      fetchEvents().then((evs) => { if (active) setEvents(evs); }).catch(() => {});
      return () => { active = false; };
    }
  }, [isOpen]);

  const isAlreadySaved = savedDescs.some(
    (d) => d.text.toLowerCase() === description.trim().toLowerCase()
  );

  const handleSaveDescription = async () => {
    if (!description.trim() || isAlreadySaved) return;
    try {
      const saved = await createSavedDescription(description.trim());
      setSavedDescs((prev) => [saved, ...prev]);
      setSavePromptVisible(false);
    } catch (err) {
      console.error("Failed to save description:", err);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    try {
      await deleteSavedDescription(id);
      setSavedDescs((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Failed to delete saved description:", err);
    }
  };

  const handleSelectSaved = (text: string) => {
    setDescription(text);
    setShowPicker(false);
    setSavePromptVisible(false);
  };

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
        eventId: eventId || null,
      });
      onAdd(transaction);
      setAmount("");
      setDescription("");
      setCategoryId(categories[0]?.id || "");
      setSavePromptVisible(false);
      setShowPicker(false);
      onClose();
    } catch (error) {
      console.error("Failed to create transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ──── Main Transaction Modal ──── */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 w-full sm:max-w-md sm:mx-4 max-h-[92vh] bg-[#1f1f21]/95 backdrop-blur-2xl border border-white/10 rounded-t-2xl sm:rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-modal-in glass-inner-border flex flex-col overflow-hidden">
          {/* Drag handle (mobile) */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-white/10 flex-shrink-0">
            <h2 className="font-[Newsreader] text-lg sm:text-xl font-medium text-[#e4e2e4]">Add Transaction</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[#909097] hover:text-[#e4e2e4] hover:bg-white/5 transition-colors active:scale-90">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Type Toggle */}
            <div className="px-5 sm:px-6 pt-4 sm:pt-5">
              <div className="flex rounded border border-white/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setType("INCOME")}
                  className={`flex-1 py-2.5 text-sm font-[Space_Grotesk] font-bold tracking-[0.1em] uppercase transition-all active:scale-95 ${
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
                  className={`flex-1 py-2.5 text-sm font-[Space_Grotesk] font-bold tracking-[0.1em] uppercase transition-all active:scale-95 ${
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
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5">
              {/* Amount */}
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

              {/* Link to Event (optional) */}
              {events.length > 0 && (
                <div>
                  <label className="block font-[Space_Grotesk] text-[11px] font-bold text-[#909097] uppercase tracking-[0.1em] mb-2">
                    Link to Event <span className="text-[#45464d] normal-case tracking-normal font-normal">(optional)</span>
                  </label>
                  <select
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-[#e4e2e4] focus:outline-none focus:border-[#4edea3]/50 focus:ring-1 focus:ring-[#4edea3]/20 transition-all appearance-none cursor-pointer glass-inner-border font-[Manrope]"
                  >
                    <option value="" className="bg-[#1f1f21]">— No event —</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id} className="bg-[#1f1f21]">{ev.name}</option>
                    ))}
                  </select>
                </div>
              )}


              <div>
                <label className="block font-[Space_Grotesk] text-[11px] font-bold text-[#909097] uppercase tracking-[0.1em] mb-2">
                  Description
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setSavePromptVisible(false);
                    }}
                    placeholder={type === "INCOME" ? "e.g. Monthly Salary" : "e.g. Whole Foods Market"}
                    className="flex-1 min-w-0 px-4 py-3 bg-white/5 border border-white/10 rounded text-[#e4e2e4] placeholder-[#45464d] focus:outline-none focus:border-[#4edea3]/50 focus:ring-1 focus:ring-[#4edea3]/20 transition-all glass-inner-border font-[Manrope]"
                    required
                    autoComplete="off"
                  />
                  {/* Choose button — opens saved descriptions picker */}
                  <button
                    type="button"
                    onClick={() => setShowPicker(true)}
                    className="flex-shrink-0 px-3 sm:px-4 py-3 bg-white/5 border border-white/10 rounded text-[#909097] hover:text-[#4edea3] hover:bg-[#4edea3]/10 hover:border-[#4edea3]/30 transition-all active:scale-95 font-[Space_Grotesk] text-[11px] font-bold uppercase tracking-[0.08em] whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Choose</span>
                    <span className="material-symbols-outlined text-[18px] sm:hidden">bookmarks</span>
                  </button>
                </div>

                {/* Save description prompt */}
                {description.trim() && !isAlreadySaved && (
                  <div className="mt-2">
                    {!savePromptVisible ? (
                      <button
                        type="button"
                        onClick={() => setSavePromptVisible(true)}
                        className="flex items-center gap-1.5 text-[#45464d] hover:text-[#4edea3] transition-colors font-[Space_Grotesk] text-[10px] font-bold uppercase tracking-[0.08em] active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[14px]">bookmark_add</span>
                        Save for later
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-[#4edea3]/10 border border-[#4edea3]/20 rounded animate-fade-in">
                        <span className="material-symbols-outlined text-[14px] text-[#4edea3] flex-shrink-0">bookmark_add</span>
                        <span className="text-[12px] text-[#c6c6cd] font-[Manrope] flex-1 truncate">
                          Save &quot;{description.trim()}&quot;?
                        </span>
                        <button
                          type="button"
                          onClick={handleSaveDescription}
                          className="text-[11px] font-[Space_Grotesk] font-bold text-[#4edea3] uppercase tracking-[0.08em] hover:text-[#6aedb8] transition-colors flex-shrink-0 active:scale-90"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setSavePromptVisible(false)}
                          className="text-[#45464d] hover:text-[#909097] transition-colors flex-shrink-0 active:scale-90"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Already saved indicator */}
                {description.trim() && isAlreadySaved && (
                  <div className="mt-1.5 flex items-center gap-1 text-[#4edea3]/60">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                    <span className="text-[10px] font-[Space_Grotesk] uppercase tracking-[0.08em]">Saved</span>
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block font-[Space_Grotesk] text-[11px] font-bold text-[#909097] uppercase tracking-[0.1em] mb-2">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-[#e4e2e4] focus:outline-none focus:border-[#4edea3]/50 focus:ring-1 focus:ring-[#4edea3]/20 transition-all glass-inner-border font-[Manrope]"
                  required />
              </div>

              {/* Submit */}
              <button type="submit" disabled={isSubmitting}
                className={`w-full py-3.5 font-[Space_Grotesk] font-bold text-sm uppercase tracking-[0.1em] rounded transition-all glass-inner-border active:scale-[0.98] disabled:opacity-50 ${
                  type === "INCOME"
                    ? "bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30 hover:bg-[#4edea3]/30 hover:border-[#4edea3]/50 shadow-[0_0_20px_rgba(78,222,163,0.1)]"
                    : "bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/30 hover:bg-[#ffb4ab]/30 hover:border-[#ffb4ab]/50 shadow-[0_0_20px_rgba(255,180,171,0.1)]"
                }`}>
                {isSubmitting ? "Adding..." : type === "INCOME" ? "Add Income" : "Add Expense"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ──── Saved Descriptions Picker Popup ──── */}
      {showPicker && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPicker(false)} />
          <div className="relative z-10 w-full sm:max-w-sm sm:mx-4 max-h-[70vh] bg-[#1f1f21] backdrop-blur-2xl border border-white/10 rounded-t-2xl sm:rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.6)] glass-inner-border flex flex-col overflow-hidden animate-modal-in">
            {/* Drag handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Picker header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#4edea3]" style={{ fontVariationSettings: "'FILL' 1" }}>bookmarks</span>
                <h3 className="font-[Space_Grotesk] text-sm font-bold text-[#e4e2e4] uppercase tracking-[0.08em]">
                  Saved Descriptions
                </h3>
              </div>
              <button
                onClick={() => setShowPicker(false)}
                className="p-1.5 rounded-lg text-[#909097] hover:text-[#e4e2e4] hover:bg-white/5 transition-colors active:scale-90"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Picker content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {savedDescs.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-[36px] text-[#353436] mb-3 block">bookmark_border</span>
                  <p className="text-[#909097] text-sm font-[Manrope] mb-1">No saved descriptions yet</p>
                  <p className="text-[#45464d] text-xs font-[Manrope]">
                    Type a description and click &quot;Save for later&quot; to save it here
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  {savedDescs.map((desc) => (
                    <div
                      key={desc.id}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 active:bg-white/8 transition-colors cursor-pointer border-b border-white/5 last:border-0 group"
                      onClick={() => handleSelectSaved(desc.text)}
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#4edea3]/50 flex-shrink-0">description</span>
                      <span className="flex-1 text-sm text-[#c6c6cd] font-[Manrope] truncate group-hover:text-[#e4e2e4] transition-colors">
                        {desc.text}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSaved(desc.id);
                        }}
                        className="flex-shrink-0 p-1.5 rounded text-[#45464d] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-all active:scale-90"
                        title="Remove"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
