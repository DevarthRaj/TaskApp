import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/events/[id] — Single event with its transactions
export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { id } = await params;
    const event = await prisma.event.findFirst({
      where: { id, userId },
      include: {
        categories: true,
        transactions: {
          where: { userId },
          include: { category: true },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Failed to fetch event:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

// PUT /api/events/[id] — Update event (name, description, color, date, categories)
export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { id } = await params;
    
    // Check ownership
    const existing = await prisma.event.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, date, color, categoryIds } = body;

    // Verify categories belong to user if provided
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

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() ?? null;
    if (date !== undefined) updateData.date = date ? new Date(date) : null;
    if (color !== undefined) updateData.color = color;

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...updateData,
        ...(categoryIds !== undefined && {
          categories: {
            set: categoryIds.map((cid: string) => ({ id: cid })),
          },
        }),
      },
      include: { categories: true },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Failed to update event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

// DELETE /api/events/[id]?deleteTransactions=true|false
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { id } = await params;

    // Check ownership
    const existing = await prisma.event.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const shouldDeleteTransactions = searchParams.get("deleteTransactions") === "true";

    if (shouldDeleteTransactions) {
      // Hard delete transactions linked to this event and belonging to this user
      await prisma.transaction.deleteMany({
        where: { eventId: id, userId },
      });
    } else {
      // Just unlink transactions (eventId -> null) for this user
      await prisma.transaction.updateMany({
        where: { eventId: id, userId },
        data: { eventId: null },
      });
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}

