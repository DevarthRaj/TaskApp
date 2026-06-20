import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

// GET — list all saved descriptions
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const descriptions = await prisma.savedDescription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(descriptions);
  } catch (error) {
    console.error("Failed to fetch saved descriptions:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST — save a new description
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { text } = await req.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const saved = await prisma.savedDescription.upsert({
      where: {
        userId_text: {
          userId,
          text: text.trim(),
        },
      },
      update: {},               // already exists — no-op
      create: { userId, text: text.trim() },
    });
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Failed to save description:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

