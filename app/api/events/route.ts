import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

// GET /api/events — List all events with totals
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const events = await prisma.event.findMany({
      where: { userId },
      include: {
        categories: true,
        transactions: {
          where: { type: "EXPENSE", userId },
          select: { amount: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = events.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      date: e.date,
      color: e.color,
      createdAt: e.createdAt,
      categories: e.categories,
      totalSpent: e.transactions.reduce((s, t) => s + t.amount, 0),
      transactionCount: e.transactions.length,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST /api/events — Create a new event
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { name, description, date, color, categoryIds } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    if (categoryIds?.length) {
      const userCats = await prisma.category.count({
        where: {
          id: { in: categoryIds },
          userId,
        },
      });
      if (userCats !== categoryIds.length) {
        return NextResponse.json({ error: "Invalid categories" }, { status: 400 });
      }
    }

    const event = await prisma.event.create({
      data: {
        userId,
        name: name.trim(),
        description: description?.trim() ?? null,
        date: date ? new Date(date) : null,
        color: color ?? "#4edea3",
        categories: categoryIds?.length
          ? { connect: categoryIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: { categories: true },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

