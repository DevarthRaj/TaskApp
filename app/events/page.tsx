"use client";

import { useState, useEffect, useCallback } from "react";
import { Event, Category, Transaction } from "@/lib/types";
import {
  fetchEvents,
  fetchEvent,
  fetchCategories,
  createEvent,
  updateEvent,
  deleteEvent,
  formatCurrency,
} from "@/lib/storage";
import Link from "next/link";
import ChatBot from "@/components/ChatBot";

const EVENT_COLORS = [
  "#4edea3", "#f43f5e", "#3b82f6", "#f59e0b", "#8b5cf6",
  "#06b6d4", "#ec4899", "#f97316", "#84cc16", "#e11d48",
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<(Event & { transactions: Transaction[] }) | null>(null);
  const [eventToDeleteId, setEventToDeleteId] = useState<string | null>(null);

  // form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formColor, setFormColor] = useState(EVENT_COLORS[0]);
  const [formCatIds, setFormCatIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const [evs, cats] = await Promise.all([fetchEvents(), fetchCategories()]);
    setEvents(evs);
    setCategories(cats);
    setIsLoaded(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditingEvent(null);
    setFormName(""); setFormDesc(""); setFormDate("");
    setFormColor(EVENT_COLORS[0]); setFormCatIds([]);
    setShowModal(true);
  };

  const openEdit = (ev: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(ev);
    setFormName(ev.name);
    setFormDesc(ev.description ?? "");
    setFormDate(ev.date ? ev.date.slice(0, 10) : "");
    setFormColor(ev.color);
    setFormCatIds(ev.categories?.map((c) => c.id) ?? []);
    setShowModal(true);
  };

  const openDetail = async (ev: Event) => {
    try {
      const fullEvent = await fetchEvent(ev.id);
      setSelectedEvent(fullEvent);
      setShowDetailModal(true);
    } catch (err) {
      console.error("Failed to fetch event details:", err);
    }
  };

  const openDeleteConfirm = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEventToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDesc.trim() || undefined,
        date: formDate || undefined,
        color: formColor,
        categoryIds: formCatIds,
      };
      if (editingEvent) {
        const updated = await updateEvent(editingEvent.id, payload);
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
      } else {
        const created = await createEvent(payload);
        setEvents((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handlePerformDelete = async (hardDelete: boolean) => {
    if (!eventToDeleteId) return;
    setDeleting(true);
    try {
      await deleteEvent(eventToDeleteId, hardDelete);
      setEvents((prev) => prev.filter((e) => e.id !== eventToDeleteId));
      setShowDeleteConfirm(false);
      if (selectedEvent?.id === eventToDeleteId) {
        setShowDetailModal(false);
      }
    } catch (err) {
      console.error("Failed to delete event:", err);
    } finally {
      setDeleting(false);
      setEventToDeleteId(null);
    }
  };

  const toggleCat = (id: string) =>
    setFormCatIds((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  if (!isLoaded)
    return (
      <div className="flex items-center justify-center h-screen w-full bg-[#131315]">
        <div className="w-6 h-6 border-2 border-[#4edea3] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#131315] flex-col md:flex-row relative">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-[#0F172A]/30 backdrop-blur-[25px] border-r border-white/10 flex-col py-6 z-40">
        <div className="px-6 mb-10">
          <h2 className="font-[Space_Grotesk] text-[11px] font-bold text-[#4edea3] uppercase tracking-[0.15em]">Terminal_01</h2>
          <p className="font-[Space_Grotesk] text-[9px] text-[#45464d] uppercase tracking-[0.2em] mt-1">High Net Worth Mode</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {[
            { icon: "dashboard", label: "Dashboard", href: "/" },
            { icon: "event", label: "Event Planner", href: "/events", active: true },
            { icon: "monitoring", label: "Analytics", href: "/analytics" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`w-full flex items-center gap-4 px-3 py-3 text-sm font-[Manrope] transition-all duration-300 rounded ${
                item.active
                  ? "bg-[#4edea3]/10 text-[#4edea3] border-r-2 border-[#4edea3]"
                  : "text-[#45464d] hover:bg-white/5 hover:text-[#c6c6cd]"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]" style={item.active ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 pb-[72px] md:pb-0">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-10 h-[60px] md:h-[72px] border-b border-white/10 bg-[#0F172A]/40 backdrop-blur-[20px]">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-[Newsreader] text-lg font-semibold italic text-[#e4e2e4] tracking-tight">Flowledger</Link>
            <nav className="hidden sm:flex items-center gap-6">
              {[
                { label: "Ledger", href: "/" },
                { label: "Event Planner", href: "/events", active: true },
                { label: "Analytics", href: "/analytics" },
              ].map((t) => (
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
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30 font-[Space_Grotesk] font-bold text-xs tracking-wide rounded hover:bg-[#4edea3]/30 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Event
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-10 py-8">
          <div className="mb-6">
            <h1 className="font-[Newsreader] text-2xl font-medium text-[#e4e2e4]">Event Planner</h1>
            <p className="text-[#45464d] text-sm font-[Manrope] mt-1">Create events and track expenses for each one.</p>
          </div>

          {events.length === 0 ? (
            <div className="bg-[#1f1f21]/40 border border-white/5 border-dashed rounded-lg p-16 text-center">
              <span className="material-symbols-outlined text-[48px] text-[#353436] block mb-3">event</span>
              <p className="text-[#909097] text-sm font-[Manrope] mb-1">No events yet</p>
              <p className="text-[#45464d] text-xs font-[Manrope]">Click <span className="text-[#4edea3]">+ New Event</span> to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => openDetail(ev)}
                  className="bg-[#1f1f21]/60 backdrop-blur-xl border border-white/5 rounded-lg p-5 hover:border-white/10 transition-all group relative overflow-hidden cursor-pointer"
                  style={{ boxShadow: `0 0 30px ${ev.color}08` }}
                >
                  {/* colour accent */}
                  <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg" style={{ backgroundColor: ev.color }} />

                  <div className="pl-3">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-[Space_Grotesk] text-sm font-bold text-[#e4e2e4] tracking-wide">{ev.name}</h3>
                        {ev.date && (
                          <p className="text-[10px] text-[#45464d] font-[Manrope] mt-0.5">
                            {new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => openEdit(ev, e)} className="p-1 text-[#45464d] hover:text-[#c6c6cd] transition-colors">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button onClick={(e) => openDeleteConfirm(ev.id, e)} className="p-1 text-[#45464d] hover:text-[#ffb4ab] transition-colors">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {ev.description && (
                      <p className="text-xs text-[#909097] font-[Manrope] mb-3 leading-relaxed line-clamp-2">{ev.description}</p>
                    )}

                    {/* Categories */}
                    {ev.categories && ev.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {ev.categories.map((cat) => (
                          <span
                            key={cat.id}
                            className="px-2 py-0.5 rounded text-[9px] font-[Space_Grotesk] font-bold uppercase tracking-[0.1em]"
                            style={{ backgroundColor: cat.color + "18", color: cat.color }}
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Totals */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <span className="text-[10px] text-[#45464d] font-[Manrope]">
                        {ev.transactionCount ?? 0} transactions
                      </span>
                      <span className="font-[Space_Grotesk] text-sm font-semibold" style={{ color: ev.color }}>
                        {formatCurrency(ev.totalSpent ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-[#0F172A]/80 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-2 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
        {[
          { icon: "dashboard", label: "Ledger", href: "/" },
          { icon: "monitoring", label: "Analytics", href: "/analytics" },
          { icon: "celebration", label: "Events", href: "/events", active: true },
          { icon: "account_balance", label: "Finance", href: "/" },
        ].map((item, i) => (
          <Link key={i} href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${item.active ? "text-[#4edea3]" : "text-[#45464d] hover:text-[#c6c6cd]"}`}
          >
            <span className="material-symbols-outlined text-[24px]" style={item.active ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
            <span className="text-[9px] font-[Space_Grotesk] font-bold uppercase tracking-[0.08em]">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1a1a1c] border-t sm:border border-white/10 rounded-t-2xl sm:rounded-xl w-full max-w-md shadow-2xl p-6 animate-modal-in max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-[Newsreader] text-lg text-[#e4e2e4]">
                {editingEvent ? "Edit Event" : "New Event"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#45464d] hover:text-[#c6c6cd] transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[10px] font-[Space_Grotesk] font-bold text-[#45464d] uppercase tracking-[0.1em] mb-1.5">Event Name *</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Goa Trip, Wedding"
                  className="w-full bg-[#131315] border border-white/10 rounded px-3 py-2.5 text-sm text-[#e4e2e4] font-[Manrope] placeholder-[#45464d] focus:outline-none focus:border-[#4edea3]/50 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-[Space_Grotesk] font-bold text-[#45464d] uppercase tracking-[0.1em] mb-1.5">Description</label>
                <input
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Optional notes"
                  className="w-full bg-[#131315] border border-white/10 rounded px-3 py-2.5 text-sm text-[#e4e2e4] font-[Manrope] placeholder-[#45464d] focus:outline-none focus:border-[#4edea3]/50 transition-colors"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-[Space_Grotesk] font-bold text-[#45464d] uppercase tracking-[0.1em] mb-1.5">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-[#131315] border border-white/10 rounded px-3 py-2.5 text-sm text-[#e4e2e4] font-[Manrope] focus:outline-none focus:border-[#4edea3]/50 transition-colors"
                />
              </div>

              {/* Colour picker */}
              <div>
                <label className="block text-[10px] font-[Space_Grotesk] font-bold text-[#45464d] uppercase tracking-[0.1em] mb-2">Colour</label>
                <div className="flex gap-2 flex-wrap">
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setFormColor(c)}
                      className="w-6 h-6 rounded-full transition-all"
                      style={{
                        backgroundColor: c,
                        boxShadow: formColor === c ? `0 0 0 2px #131315, 0 0 0 4px ${c}` : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div>
                  <label className="block text-[10px] font-[Space_Grotesk] font-bold text-[#45464d] uppercase tracking-[0.1em] mb-2">Linked Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const selected = formCatIds.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => toggleCat(cat.id)}
                          className="px-3 py-1 rounded text-[10px] font-[Space_Grotesk] font-bold uppercase tracking-[0.1em] transition-all"
                          style={{
                            backgroundColor: selected ? cat.color + "30" : cat.color + "10",
                            color: cat.color,
                            border: `1px solid ${selected ? cat.color + "60" : cat.color + "20"}`,
                          }}
                        >
                          {selected && "✓ "}{cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-white/10 rounded text-sm text-[#909097] font-[Manrope] hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formName.trim() || saving}
                className="flex-1 py-3 bg-[#4edea3]/20 border border-[#4edea3]/30 rounded text-sm font-[Space_Grotesk] font-bold text-[#4edea3] hover:bg-[#4edea3]/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : editingEvent ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1a1a1c] border-t sm:border border-white/10 rounded-t-2xl sm:rounded-xl w-full max-w-2xl shadow-2xl p-5 sm:p-6 animate-modal-in max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: selectedEvent.color }} />
                <h2 className="font-[Newsreader] text-lg sm:text-xl text-[#e4e2e4] truncate max-w-[200px] sm:max-w-none">{selectedEvent.name}</h2>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 text-[#45464d] hover:text-[#c6c6cd] transition-colors">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1 sm:pr-2 custom-scrollbar">
              {/* Event Info */}
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/5">
                  <p className="text-[9px] sm:text-[10px] font-[Space_Grotesk] font-bold text-[#45464d] uppercase tracking-[0.1em] mb-1">Total Spent</p>
                  <p className="text-xl sm:text-2xl font-[Space_Grotesk] font-bold" style={{ color: selectedEvent.color }}>
                    {formatCurrency(selectedEvent.transactions?.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0) || 0)}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/5">
                  <p className="text-[9px] sm:text-[10px] font-[Space_Grotesk] font-bold text-[#45464d] uppercase tracking-[0.1em] mb-1">Transactions</p>
                  <p className="text-xl sm:text-2xl font-[Space_Grotesk] font-bold text-[#e4e2e4]">
                    {selectedEvent.transactions?.length || 0}
                  </p>
                </div>
              </div>

              {selectedEvent.description && (
                <div>
                  <p className="text-[10px] font-[Space_Grotesk] font-bold text-[#45464d] uppercase tracking-[0.1em] mb-2">Description</p>
                  <p className="text-sm text-[#909097] font-[Manrope] leading-relaxed bg-white/5 p-3 rounded border border-white/5">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {/* Transaction List */}
              <div className="pb-4">
                <p className="text-[10px] font-[Space_Grotesk] font-bold text-[#45464d] uppercase tracking-[0.1em] mb-3">Linked Transactions</p>
                <div className="space-y-2">
                  {!selectedEvent.transactions || selectedEvent.transactions.length === 0 ? (
                    <p className="text-xs text-[#45464d] italic py-8 text-center border border-white/5 border-dashed rounded">No transactions linked to this event yet.</p>
                  ) : (
                    selectedEvent.transactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5 hover:bg-white/[0.07] transition-colors gap-3">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs text-[#e4e2e4] font-medium truncate">{t.description}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-[#45464d] flex-shrink-0">
                              {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                            {t.category && (
                              <span className="px-1.5 py-0.5 rounded-[2px] text-[8px] font-bold uppercase tracking-wider truncate max-w-[80px]" style={{ backgroundColor: t.category.color + "15", color: t.category.color }}>
                                {t.category.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-sm font-[Space_Grotesk] font-bold flex-shrink-0 ${t.type === "INCOME" ? "text-[#4edea3]" : "text-[#ffb4ab]"}`}>
                          {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col-reverse sm:flex-row justify-between gap-3">
               <button 
                onClick={(e) => openDeleteConfirm(selectedEvent.id, e)}
                className="w-full sm:w-auto px-4 py-2.5 text-[10px] font-[Space_Grotesk] font-bold uppercase tracking-[0.1em] text-[#ffb4ab]/60 hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 rounded transition-all"
              >
                Delete Event
              </button>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="w-full sm:w-auto px-8 py-2.5 bg-white/10 hover:bg-white/15 text-[#e4e2e4] rounded text-xs font-[Space_Grotesk] font-bold uppercase tracking-[0.1em] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#1a1a1c] border-t sm:border border-white/10 rounded-t-2xl sm:rounded-xl w-full max-w-sm shadow-2xl p-6 animate-modal-in">
            <div className="flex items-center gap-3 mb-4 text-[#ffb4ab]">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <h2 className="font-[Newsreader] text-lg text-[#e4e2e4]">Delete Event</h2>
            </div>
            
            <p className="text-sm text-[#909097] font-[Manrope] mb-6 leading-relaxed">
              How would you like to handle the transactions linked to this event?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handlePerformDelete(true)}
                disabled={deleting}
                className="w-full py-3.5 bg-[#ffb4ab]/20 border border-[#ffb4ab]/30 rounded text-xs font-[Space_Grotesk] font-bold text-[#ffb4ab] hover:bg-[#ffb4ab]/30 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                Delete Transactions with Event
              </button>
              
              <button
                onClick={() => handlePerformDelete(false)}
                disabled={deleting}
                className="w-full py-3.5 bg-white/5 border border-white/10 rounded text-xs font-[Space_Grotesk] font-bold text-[#c6c6cd] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">link_off</span>
                Just Unlink Transactions
              </button>

              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="w-full py-3 text-xs font-[Space_Grotesk] font-bold text-[#45464d] hover:text-[#909097] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FlowBot — RAG Finance AI */}
      <ChatBot />
    </div>
  );
}
