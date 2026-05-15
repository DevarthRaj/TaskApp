import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/transactions?month=2026-04 — List transactions for a month
// GET /api/transactions?months=2026-04,2026-03,2026-02 — List for multiple months
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month");
    const months = searchParams.get("months");

    let dateFilter = {};

    if (month) {
      // Single month filter
      const [year, mon] = month.split("-").map(Number);
      const startDate = new Date(year, mon - 1, 1);
      const endDate = new Date(year, mon, 1);
      dateFilter = {
        date: { gte: startDate, lt: endDate },
      };
    } else if (months) {
      // Multiple months filter
      const monthList = months.split(",");
      const dateRanges = monthList.map((m) => {
        const [year, mon] = m.split("-").map(Number);
        return {
          date: {
            gte: new Date(year, mon - 1, 1),
            lt: new Date(year, mon, 1),
          },
        };
      });
      dateFilter = { OR: dateRanges };
    }

    const transactions = await prisma.transaction.findMany({
      where: dateFilter,
      include: { category: true, event: true },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST /api/transactions — Create a new transaction
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, amount, description, date, categoryId, eventId } = body;

    if (!type || !amount || !description || !date) {
      return NextResponse.json(
        { error: "type, amount, description, and date are required" },
        { status: 400 }
      );
    }

    if (!["INCOME", "EXPENSE"].includes(type)) {
      return NextResponse.json(
        { error: "type must be INCOME or EXPENSE" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        description: description.trim(),
        date: new Date(date),
        categoryId: type === "EXPENSE" ? (categoryId ?? null) : null,
        eventId: eventId ?? null,
      },
      include: { category: true, event: true },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Failed to create transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
