"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Turnstile } from "@marsidev/react-turnstile"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Turnstile fallback siteKey (Cloudflare public testing key that always passes)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email || !password) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    try {
      // In next-auth v5, signIn with credentials will handle redirect or return error depending on config
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        if (res.error.includes("Lockout")) {
          setError(res.error)
        } else {
          setError("Invalid email or password. Please try again.")
        }
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-[#1f1f21]/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 relative shadow-2xl glass-inner-border animate-modal-in">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold italic text-[#e4e2e4] font-[Newsreader] tracking-tight mb-2">
          Flowledger
        </h1>
        <p className="text-xs text-[#909097] font-[Space_Grotesk] uppercase tracking-[0.15em]">
          Sign in to your ledger
        </p>
      </div>

      {/* Errors display */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/30 border border-red-500/20 text-[#ffb4ab] text-xs font-[Manrope] flex items-center gap-3">
          <span className="material-symbols-outlined text-[18px] text-[#ffb4ab]">error</span>
          <span>{error}</span>
        </div>
      )}

      {searchParams.get("registered") === "true" && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-[#4edea3] text-xs font-[Manrope] flex items-center gap-3">
          <span className="material-symbols-outlined text-[18px] text-[#4edea3]">check_circle</span>
          <span>Account created successfully! Please sign in.</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-5">
        {/* Email input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[#909097] font-[Space_Grotesk] uppercase tracking-[0.1em] block">
            Email Address
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#45464d]">
              mail
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#1b1b1d] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#e4e2e4] placeholder-[#45464d] focus:outline-none focus:border-[#4edea3]/30 transition-all font-[Manrope]"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Password input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[#909097] font-[Space_Grotesk] uppercase tracking-[0.1em] block">
            Password
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#45464d]">
              lock
            </span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#1b1b1d] border border-white/5 rounded-lg py-2.5 pl-10 pr-10 text-sm text-[#e4e2e4] placeholder-[#45464d] focus:outline-none focus:border-[#4edea3]/30 transition-all font-[Manrope]"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#45464d] hover:text-[#c6c6cd] transition-colors"
              tabIndex={-1}
            >
              <span className="material-symbols-outlined text-[18px]">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        {/* Turnstile Captcha */}
        <div className="flex justify-center py-2">
          <Turnstile
            siteKey={siteKey}
            onSuccess={(token) => setTurnstileToken(token)}
            onError={() => setError("CAPTCHA verification failed. Please refresh.")}
            onExpire={() => setTurnstileToken("")}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3 bg-[#4edea3]/10 hover:bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30 rounded-lg text-sm font-bold font-[Space_Grotesk] uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(78,222,163,0.1)] active:scale-[0.98]"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-[#4edea3] border-t-transparent rounded-full animate-spin" />
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-white/5 text-center">
        <p className="text-xs text-[#909097] font-[Manrope]">
          Don't have an account?{" "}
          <Link href="/register" className="text-[#4edea3] hover:text-[#6aedb8] transition-colors font-semibold">
            Create an account
          </Link>
        </p>
      </div>

    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#131315] relative overflow-hidden p-4">
      {/* Background Decorative Ambient Blobs */}
      <div className="absolute -left-20 -top-20 w-80 h-80 bg-[#4edea3]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#00a572]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Suspense boundary wrapping the form that uses useSearchParams */}
      <Suspense fallback={
        <div className="w-full max-w-md bg-[#1f1f21]/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 relative shadow-2xl glass-inner-border flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-[#4edea3] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs text-[#909097] font-[Space_Grotesk] uppercase tracking-[0.15em]">Loading flowledger...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
