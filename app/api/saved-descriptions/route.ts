import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — list all saved descriptions
export async function GET() {
  try {
    const descriptions = await prisma.savedDescription.findMany({
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
    const { text } = await req.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const saved = await prisma.savedDescription.upsert({
      where: { text: text.trim() },
      update: {},               // already exists — no-op
      create: { text: text.trim() },
    });
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Failed to save description:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
