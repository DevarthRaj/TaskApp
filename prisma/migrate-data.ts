import { PrismaClient } from "@prisma/client"
import { hash } from "@node-rs/argon2"

const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Starting data migration...")

  const email = "admin@flowledger.com"
  
  // 1. Ensure the default user exists
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.log(`👤 Creating user profile for ${email}...`)
    const passwordHash = await hash("Password123!", {
      memoryCost: 65536,
      timeCost: 3,
      outputLen: 32,
      parallelism: 4,
    })
    user = await prisma.user.create({
      data: {
        name: "Admin User",
        email,
        passwordHash,
      },
    })
    console.log("✅ User profile created.")
  } else {
    console.log("👤 User profile already exists.")
  }

  const userId = user.id

  // 2. Add raw SQL migrations to add userId columns if they don't exist,
  // set them to the default user ID, and make them NOT NULL.
  console.log("🔧 Migrating database tables...")
  
  try {
    // Categories
    await prisma.$executeRawUnsafe(`ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "userId" TEXT;`)
    await prisma.$executeRawUnsafe(`UPDATE "categories" SET "userId" = '${userId}' WHERE "userId" IS NULL;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "categories" ALTER COLUMN "userId" SET NOT NULL;`)
    console.log("  ✅ Categories migrated.")

    // Transactions
    await prisma.$executeRawUnsafe(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "userId" TEXT;`)
    await prisma.$executeRawUnsafe(`UPDATE "transactions" SET "userId" = '${userId}' WHERE "userId" IS NULL;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "transactions" ALTER COLUMN "userId" SET NOT NULL;`)
    console.log("  ✅ Transactions migrated.")

    // Events
    await prisma.$executeRawUnsafe(`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "userId" TEXT;`)
    await prisma.$executeRawUnsafe(`UPDATE "events" SET "userId" = '${userId}' WHERE "userId" IS NULL;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "events" ALTER COLUMN "userId" SET NOT NULL;`)
    console.log("  ✅ Events migrated.")

    // Saved Descriptions
    await prisma.$executeRawUnsafe(`ALTER TABLE "saved_descriptions" ADD COLUMN IF NOT EXISTS "userId" TEXT;`)
    await prisma.$executeRawUnsafe(`UPDATE "saved_descriptions" SET "userId" = '${userId}' WHERE "userId" IS NULL;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "saved_descriptions" ALTER COLUMN "userId" SET NOT NULL;`)
    // Re-apply unique constraint if it was dropped
    await prisma.$executeRawUnsafe(`ALTER TABLE "saved_descriptions" DROP CONSTRAINT IF EXISTS "saved_descriptions_text_key";`)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "saved_descriptions_userId_text_key" ON "saved_descriptions"("userId", "text");`)
    console.log("  ✅ Saved Descriptions migrated.")

    console.log("✨ Data migration completed successfully! All existing data is now owned by " + email)
  } catch (error) {
    console.error("❌ Migration failed:", error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
