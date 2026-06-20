import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "@node-rs/argon2"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  turnstileToken: z.string().min(1, "CAPTCHA token is required"),
})

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", color: "#f59e0b", isDefault: true },
  { name: "Health & Wellness", color: "#10b981", isDefault: true },
  { name: "Transportation", color: "#3b82f6", isDefault: true },
  { name: "Investments", color: "#8b5cf6", isDefault: true },
  { name: "Entertainment", color: "#ec4899", isDefault: true },
  { name: "Housing", color: "#06b6d4", isDefault: true },
  { name: "Others", color: "#6b7280", isDefault: true },
]

async function verifyTurnstileToken(token: string, ip?: string) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ TURNSTILE_SECRET_KEY is not set. Bypassing Turnstile verification in development.")
      return true
    }
    return false
  }

  try {
    const formData = new URLSearchParams()
    formData.append("secret", secretKey)
    formData.append("response", token)
    if (ip) {
      formData.append("remoteip", ip)
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })

    const data = await res.json()
    return data.success === true
  } catch (error) {
    console.error("Turnstile verification error:", error)
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown"
    const body = await req.json()
    
    // 1. Validate inputs
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, email, password, turnstileToken } = parsed.data

    // 2. Rate Limiting check (max 3 registration attempts per hour per IP)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentAttempts = await prisma.loginAttempt.count({
      where: {
        ip,
        email: `register_${email}`, // Prefixed to distinguish registration vs login rate limits
        createdAt: { gte: oneHourAgo },
      },
    })

    if (recentAttempts >= 3) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again in an hour." },
        { status: 429 }
      )
    }

    // Record the attempt
    await prisma.loginAttempt.create({
      data: {
        ip,
        email: `register_${email}`,
        success: false, // Default to false until successful
      },
    })

    // 3. CAPTCHA turnstile check
    const isHuman = await verifyTurnstileToken(turnstileToken, ip)
    if (!isHuman) {
      return NextResponse.json(
        { error: "CAPTCHA verification failed. Please try again." },
        { status: 400 }
      )
    }

    // 4. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      )
    }

    // 5. Hash password with Argon2id
    const passwordHash = await hash(password, {
      memoryCost: 65536,
      timeCost: 3,
      outputLen: 32,
      parallelism: 4,
    })

    // 6. Create User and Seed default categories in a single transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
      })

      // Seed categories for this specific user
      await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((cat) => ({
          userId: user.id,
          name: cat.name,
          color: cat.color,
          isDefault: cat.isDefault,
        })),
      })

      return user
    })

    // Update the last attempt to success
    const lastAttempt = await prisma.loginAttempt.findFirst({
      where: { ip, email: `register_${email}` },
      orderBy: { createdAt: "desc" },
    })
    if (lastAttempt) {
      await prisma.loginAttempt.update({
        where: { id: lastAttempt.id },
        data: { success: true },
      })
    }

    return NextResponse.json(
      { message: "Registration successful", userId: newUser.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "An error occurred during registration. Please try again." },
      { status: 500 }
    )
  }
}
