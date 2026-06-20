import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { verify } from "@node-rs/argon2"
import { z } from "zod"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(8) })
          .safeParse(credentials)

        if (!parsedCredentials.success) {
          return null
        }

        const { email, password } = parsedCredentials.data

        // 1. Check rate limits (LoginAttempt table)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
        const failedAttempts = await prisma.loginAttempt.count({
          where: {
            email,
            success: false,
            createdAt: { gte: fifteenMinutesAgo },
          },
        })

        if (failedAttempts >= 5) {
          throw new Error("Lockout: Too many failed attempts. Try again in 15 minutes.")
        }

        // 2. Find user
        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.passwordHash) {
          // Record failed attempt
          await prisma.loginAttempt.create({
            data: {
              email,
              ip: "unknown",
              success: false,
            },
          })
          return null
        }

        // 3. Verify password
        const passwordMatch = await verify(user.passwordHash, password)

        if (!passwordMatch) {
          // Record failed attempt
          await prisma.loginAttempt.create({
            data: {
              email,
              ip: "unknown",
              success: false,
            },
          })
          return null
        }

        // Record success attempt
        await prisma.loginAttempt.create({
          data: {
            email,
            ip: "unknown",
            success: true,
          },
        })

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      },
    }),
  ],
})

