import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured. Add GEMINI_API_KEY to your .env file." },
      { status: 500 }
    );
  }

  // ── 1. RETRIEVE — Pull financial data from Postgres ──────────────────
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [transactions, categories, events] = await Promise.all([
    prisma.transaction.findMany({
      where: { date: { gte: sixMonthsAgo } },
      include: { category: true, event: true },
      orderBy: { date: "desc" },
    }),
    prisma.category.findMany(),
    prisma.event.findMany({
      include: {
        transactions: { select: { amount: true, type: true } },
      },
    }),
  ]);

  // ── 2. AUGMENT — Build structured context from retrieved data ─────────

  // Monthly income/expense summaries
  const monthlyMap: Record<string, { income: number; expense: number }> = {};
  for (const t of transactions) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expense: 0 };
    if (t.type === "INCOME") monthlyMap[key].income += t.amount;
    else monthlyMap[key].expense += t.amount;
  }

  // Category-wise spending
  const categorySpend: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type === "EXPENSE") {
      const name = t.category?.name ?? "Uncategorized";
      categorySpend[name] = (categorySpend[name] ?? 0) + t.amount;
    }
  }

  // Event totals
  const eventSummaries = events.map((e) => ({
    name: e.name,
    date: e.date ? e.date.toLocaleDateString("en-IN") : "No date",
    totalSpent: e.transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((s, t) => s + t.amount, 0),
    transactionCount: e.transactions.length,
  }));

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const monthlySummaryText = Object.entries(monthlyMap)
    .sort()
    .reverse()
    .map(([month, d]) => {
      const [yr, mo] = month.split("-");
      const label = new Date(Number(yr), Number(mo) - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      return `  ${label}: Income ${fmt(d.income)}, Expenses ${fmt(d.expense)}, Net ${fmt(d.income - d.expense)}`;
    })
    .join("\n");

  const categoryText = Object.entries(categorySpend)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `  ${cat}: ${fmt(amt)}`)
    .join("\n");

  const eventText =
    eventSummaries.length > 0
      ? eventSummaries
        .map((e) => `  "${e.name}" (${e.date}): ${fmt(e.totalSpent)} across ${e.transactionCount} transactions`)
        .join("\n")
      : "  No events created yet.";

  const recentTxText = transactions
    .slice(0, 25)
    .map((t) => {
      const d = t.date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      const cat = t.category?.name ?? "Uncategorized";
      const ev = t.event ? ` [Event: ${t.event.name}]` : "";
      return `  ${d} | ${t.type} | ${fmt(t.amount)} | "${t.description}" | ${cat}${ev}`;
    })
    .join("\n");

  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const financialContext = `
Today's Date: ${today}
Currency: Indian Rupees (₹)

━━ MONTHLY SUMMARY (last 6 months) ━━
${monthlySummaryText || "  No data available."}

━━ SPENDING BY CATEGORY (last 6 months) ━━
${categoryText || "  No expenses recorded."}

━━ EVENTS ━━
${eventText}

━━ RECENT 25 TRANSACTIONS ━━
${recentTxText || "  No transactions found."}

━━ ALL CATEGORIES ━━
  ${categories.map((c) => c.name).join(", ") || "None created yet."}
`.trim();

  // ── 3. GENERATE — Call Gemini with the augmented prompt ───────────────
  const systemPrompt = `You are FlowBot, an intelligent personal finance AI assistant embedded inside Flowledger — a personal finance tracker app.

You have access to the user's REAL financial data below. Your job is to answer their questions ONLY based on this data.

Rules:
- Be conversational, specific, and insightful
- Always use ₹ for amounts and format them like ₹12,500 (not 12500.00)
- Keep responses concise — 2-4 sentences unless detail is needed
- If the user asks about something outside your data (e.g., stock tips), politely redirect
- If you don't have enough data to answer accurately, say so honestly
- You can do math and comparisons across months, categories, and events
- Refer to the user in second person ("you spent", "your income")

USER'S FINANCIAL DATA:
${financialContext}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(message);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (err: unknown) {
    console.error("Gemini API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate response: ${message}` },
      { status: 500 }
    );
  }
}
