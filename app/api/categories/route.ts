import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/categories — List all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/categories — Create a new category
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name || !color) {
      return NextResponse.json(
        { error: "Name and color are required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: { name, color, isDefault: false },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
