import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

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
  console.log("🌱 Seeding database...");

  // 1. Check/create default admin user
  const email = "admin@flowledger.com";
  let admin = await prisma.user.findUnique({
    where: { email },
  });

  if (!admin) {
    console.log(`  👤 Creating default user: ${email}...`);
    const passwordHash = await hash("Password123!", {
      memoryCost: 65536,
      timeCost: 3,
      outputLen: 32,
      parallelism: 4,
    });

    admin = await prisma.user.create({
      data: {
        name: "Admin User",
        email,
        passwordHash,
      },
    });
    console.log("  ✅ Created user!");
  } else {
    console.log(`  ⏭️  Skipped user creation (exists: ${email})`);
  }

  // 2. Seed categories for the user
  console.log(`  🌱 Seeding default categories for user ${email}...`);
  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, userId: admin.id },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          ...cat,
          userId: admin.id,
        },
      });
      console.log(`    ✅ Created category: ${cat.name}`);
    } else {
      console.log(`    ⏭️  Skipped category (exists): ${cat.name}`);
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

