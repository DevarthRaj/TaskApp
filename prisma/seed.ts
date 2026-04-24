import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", color: "#f59e0b", isDefault: true },
  { name: "Health & Wellness", color: "#10b981", isDefault: true },
  { name: "Transportation", color: "#3b82f6", isDefault: true },
  { name: "Investments", color: "#8b5cf6", isDefault: true },
  { name: "Entertainment", color: "#ec4899", isDefault: true },
  { name: "Housing", color: "#06b6d4", isDefault: true },
  { name: "Others", color: "#6b7280", isDefault: true },
];

async function main() {
  console.log("🌱 Seeding default categories...");

  for (const cat of DEFAULT_CATEGORIES) {
    // Upsert by name to avoid duplicates on re-seed
    const existing = await prisma.category.findFirst({
      where: { name: cat.name },
    });

    if (!existing) {
      await prisma.category.create({ data: cat });
      console.log(`  ✅ Created: ${cat.name}`);
    } else {
      console.log(`  ⏭️  Skipped (exists): ${cat.name}`);
    }
  }

  console.log("✨ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
