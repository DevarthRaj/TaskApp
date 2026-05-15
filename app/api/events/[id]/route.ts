import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// GET /api/events/[id] — Single event with its transactions
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        categories: true,
        transactions: {
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
    const { id } = await params;
    const body = await request.json();
    const { name, description, date, color, categoryIds } = body;

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
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const shouldDeleteTransactions = searchParams.get("deleteTransactions") === "true";

    if (shouldDeleteTransactions) {
      // Hard delete transactions linked to this event
      await prisma.transaction.deleteMany({
        where: { eventId: id },
      });
    } else {
      // Just unlink transactions (eventId -> null)
      await prisma.transaction.updateMany({
        where: { eventId: id },
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
