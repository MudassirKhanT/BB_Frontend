import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, Lock, ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type Step = "email" | "token" | "done";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [enteredToken, setEnteredToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedToken, setGeneratedToken] = useState(""); // displayed token from API

  // ── Step 1: Request OTP ───────────────────────────────────────────────
  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address"); return; }

    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send token");

      // Show the token if API returned it (dev mode)
      if (data.resetToken) {
        setGeneratedToken(data.resetToken);
      }
      setStep("token");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Verify token & set new password ───────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredToken.trim()) { setError("Enter the 6-digit reset code"); return; }
    if (!newPassword) { setError("Enter your new password"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }

    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          resetToken: enteredToken.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reset failed");

      // Auto-login after reset
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify({
          id: data.user.id,
          name: data.user.username,
          email: data.user.email,
          role: data.user.role,
        }));
      }
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Invalid code or it has expired. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="w-full flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">

          {/* Logo */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-black text-lg">B</span>
            </div>
            <span className="text-slate-900 font-bold text-xl">Beyond Basic</span>
          </div>

          {/* ── STEP: DONE ── */}
          {step === "done" && (
            <Card className="border-border/50 shadow-lg">
              <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Password Reset!</h2>
                  <p className="text-slate-500 font-medium text-sm">
                    Your password has been updated successfully. You're now logged in.
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/courses")}
                  className="w-full h-11 font-bold text-white mt-2"
                >
                  Go to Courses
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── STEP: EMAIL ── */}
          {step === "email" && (
            <>
              <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Forgot password?</h2>
                <p className="text-slate-500 font-medium">
                  Enter your email and we'll send you a reset code.
                </p>
              </div>

              <Card className="border-border/50 shadow-lg">
                <CardContent className="pt-6">
                  <form onSubmit={handleRequestToken} className="space-y-5">
                    {error && (
                      <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Email Address</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Mail size={18} />
                        </div>
                        <Input
                          type="email"
                          placeholder="student@beyondbasic.in"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setError(""); }}
                          className="h-11 pl-10 ring-0 focus-visible:ring-0"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 font-bold text-white shadow-lg shadow-primary/30"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending code...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Send reset code
                          <ArrowRight size={16} />
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="text-center">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary transition-colors">
                  <ArrowLeft size={14} />
                  Back to login
                </Link>
              </div>
            </>
          )}

          {/* ── STEP: TOKEN + NEW PASSWORD ── */}
          {step === "token" && (
            <>
              <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Enter reset code</h2>
                <p className="text-slate-500 font-medium text-sm">
                  A 6-digit code was generated for <span className="font-bold text-slate-700">{email}</span>
                </p>
              </div>

              {/* Show the token (since we have no email service) */}
              {generatedToken && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Your Reset Code</p>
                  <p className="text-2xl sm:text-4xl font-black text-blue-700 tracking-[0.15em] sm:tracking-[0.3em] py-1 break-all">{generatedToken}</p>
                  <p className="text-xs text-blue-400 font-medium mt-1">Expires in 15 minutes</p>
                </div>
              )}

              <Card className="border-border/50 shadow-lg">
                <CardContent className="pt-6">
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    {error && (
                      <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                      </div>
                    )}

                    {/* Reset Code */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">6-Digit Reset Code</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <KeyRound size={18} />
                        </div>
                        <Input
                          type="text"
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          value={enteredToken}
                          onChange={(e) => { setEnteredToken(e.target.value.replace(/\D/g, "")); setError(""); }}
                          className="h-11 pl-10 ring-0 focus-visible:ring-0 text-center text-lg font-bold tracking-widest"
                        />
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">New Password</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock size={18} />
                        </div>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimum 6 characters"
                          value={newPassword}
                          onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                          className="h-11 pl-10 pr-10 ring-0 focus-visible:ring-0"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock size={18} />
                        </div>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                          className={`h-11 pl-10 ring-0 focus-visible:ring-0 ${
                            confirmPassword && confirmPassword !== newPassword ? "border-red-400" :
                            confirmPassword && confirmPassword === newPassword ? "border-green-400" : ""
                          }`}
                        />
                        {confirmPassword && confirmPassword === newPassword && (
                          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 font-bold text-white shadow-lg shadow-primary/30"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Resetting password...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Reset Password
                          <ArrowRight size={16} />
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="text-center flex items-center justify-center gap-4">
                <button
                  onClick={() => { setStep("email"); setError(""); setGeneratedToken(""); }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary transition-colors"
                >
                  <ArrowLeft size={14} />
                  Change email
                </button>
                <span className="text-slate-300">|</span>
                <Link to="/login" className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors">
                  Back to login
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
