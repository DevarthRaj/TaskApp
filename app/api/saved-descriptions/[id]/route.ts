import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE — remove a saved description
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.savedDescription.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete saved description:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
