"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Turnstile } from "@marsidev/react-turnstile"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  const [turnstileToken, setTurnstileToken] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Password strength checks
  const [strengthScore, setStrengthScore] = useState(0)
  const [hasMinLength, setHasMinLength] = useState(false)
  const [hasNumber, setHasNumber] = useState(false)
  const [hasSpecial, setHasSpecial] = useState(false)

  useEffect(() => {
    const minLength = password.length >= 8
    const num = /\d/.test(password)
    const spec = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    setHasMinLength(minLength)
    setHasNumber(num)
    setHasSpecial(spec)

    let score = 0
    if (password.length > 0) score += 1
    if (minLength) score += 1
    if (num) score += 1
    if (spec) score += 1
    if (password.length >= 12) score += 1 // Bonus for extra security

    setStrengthScore(score)
  }, [password])

  // Turnstile fallback siteKey
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!hasMinLength) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    if (!turnstileToken) {
      setError("Please complete the CAPTCHA verification")
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          turnstileToken,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      router.push("/login?registered=true")
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Password strength meter color/label
  const getStrengthMeta = () => {
    switch (strengthScore) {
      case 0:
        return { width: "0%", color: "bg-red-500", label: "None" }
      case 1:
        return { width: "20%", color: "bg-red-500", label: "Very Weak" }
      case 2:
        return { width: "40%", color: "bg-orange-500", label: "Weak" }
      case 3:
        return { width: "60%", color: "bg-yellow-500", label: "Medium" }
      case 4:
        return { width: "80%", color: "bg-emerald-500", label: "Strong" }
      case 5:
        return { width: "100%", color: "bg-[#4edea3]", label: "Excellent" }
      default:
        return { width: "0%", color: "bg-red-500", label: "None" }
    }
  }

  const strengthMeta = getStrengthMeta()

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#131315] relative overflow-hidden p-4">
      {/* Background Decorative Ambient Blobs */}
      <div className="absolute -left-20 -top-20 w-80 h-80 bg-[#4edea3]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#00a572]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glassmorphic Container */}
      <div className="w-full max-w-md bg-[#1f1f21]/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 relative shadow-2xl glass-inner-border animate-modal-in">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold italic text-[#e4e2e4] font-[Newsreader] tracking-tight mb-2">
            Flowledger
          </h1>
          <p className="text-xs text-[#909097] font-[Space_Grotesk] uppercase tracking-[0.15em]">
            Create a secure account
          </p>
        </div>

        {/* Errors display */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/30 border border-red-500/20 text-[#ffb4ab] text-xs font-[Manrope] flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px] text-[#ffb4ab]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#909097] font-[Space_Grotesk] uppercase tracking-[0.1em] block">
              Full Name
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#45464d]">
                person
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-[#1b1b1d] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#e4e2e4] placeholder-[#45464d] focus:outline-none focus:border-[#4edea3]/30 transition-all font-[Manrope]"
                required
                disabled={isLoading}
              />
            </div>
          </div>

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
            
            {/* Password Strength Widget */}
            {password.length > 0 && (
              <div className="space-y-2 pt-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#909097]">Password Strength:</span>
                  <span className="font-semibold text-[#e4e2e4]">{strengthMeta.label}</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strengthMeta.color}`}
                    style={{ width: strengthMeta.width }}
                  />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
                  <span className={`flex items-center gap-1 ${hasMinLength ? "text-[#4edea3]" : "text-[#45464d]"}`}>
                    <span className="material-symbols-outlined text-[12px]">
                      {hasMinLength ? "check_circle" : "cancel"}
                    </span>
                    Min 8 chars
                  </span>
                  <span className={`flex items-center gap-1 ${hasNumber ? "text-[#4edea3]" : "text-[#45464d]"}`}>
                    <span className="material-symbols-outlined text-[12px]">
                      {hasNumber ? "check_circle" : "cancel"}
                    </span>
                    1 number
                  </span>
                  <span className={`flex items-center gap-1 ${hasSpecial ? "text-[#4edea3]" : "text-[#45464d]"}`}>
                    <span className="material-symbols-outlined text-[12px]">
                      {hasSpecial ? "check_circle" : "cancel"}
                    </span>
                    1 special char
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#909097] font-[Space_Grotesk] uppercase tracking-[0.1em] block">
              Confirm Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#45464d]">
                lock
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1b1b1d] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#e4e2e4] placeholder-[#45464d] focus:outline-none focus:border-[#4edea3]/30 transition-all font-[Manrope]"
                required
                disabled={isLoading}
              />
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
              "Sign Up"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-[#909097] font-[Manrope]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#4edea3] hover:text-[#6aedb8] transition-colors font-semibold">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
