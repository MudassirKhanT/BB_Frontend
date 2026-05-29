import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function SignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<"student" | "alumni">("student");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Alumni-only fields
    currentRole: "",
    currentCompany: "",
    batch: "",
    branch: "",
    domain: "",
    bio: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.name.replace(/\s+/g, "_").toLowerCase(),
          email: formData.email,
          password: formData.password,
          role,
          ...(role === "alumni" ? {
            currentRole: formData.currentRole,
            currentCompany: formData.currentCompany,
            batch: formData.batch,
            branch: formData.branch,
            domain: formData.domain,
            bio: formData.bio,
          } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.user.id,
          name: data.user.username,
          email: data.user.email,
          role: data.user.role,
        }),
      );
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setErrors({ general: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = passwordStrength(formData.password);
  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Excellent"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-emerald-500"];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-blue-700">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-16">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-black text-xl">B</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">BeyondBasic</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl font-black text-white leading-tight">
              Start Your Journey
              <br />
              <span className="text-blue-200">To Success</span>
            </h1>
            <p className="text-lg text-blue-100 font-medium max-w-md">Join thousands of students who have already transformed their careers with our AI-powered learning platform.</p>

            {/* Feature list */}
            <div className="space-y-4 pt-4">
              {["AI-powered personalized learning paths", "Real-time code execution environment", "Mock interviews with instant feedback", "Progress tracking & skill analytics"].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-blue-50">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                  <span className="font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center gap-6">
            <div className="flex -space-x-3">
              {["bg-violet-400", "bg-blue-400", "bg-emerald-400", "bg-amber-400"].map((color, i) => (
                <div key={i} className={`w-10 h-10 ${color} rounded-full border-2 border-white/30 flex items-center justify-center text-white text-xs font-black shadow-lg`}>
                  {["RK", "AS", "PM", "SK"][i]}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white font-bold text-lg">2,900+ Students</p>
              <p className="text-blue-200 text-sm font-medium">Already enrolled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-black text-lg">B</span>
            </div>
            <span className="text-slate-900 font-bold text-xl">Beyond Basic</span>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left p-4 my-1">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Create your account</h2>
            <p className="text-slate-500 font-medium">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Form */}
          <Card className="border-border/50 shadow-lg shadow-slate-200/50 ring-0">
            <CardContent className="pt-2">
              <form onSubmit={handleSubmit} className="space-y-5">
                {errors.general && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">{errors.general}</div>}

                {/* Role selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">I am a</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["student", "alumni"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all capitalize ${
                          role === r
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {r === "student" ? "🎓 Student" : "👔 Alumni"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name field */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-slate-700">
                    Full Name
                  </label>
                  <Input id="name" type="text" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`mt-2 h-11 text-base ring-0 focus-visible:ring-0 ${errors.name ? "border-red-500" : ""}`} />
                  {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
                </div>

                {/* Email field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                    Email Address
                  </label>
                  <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`mt-2 h-11 text-base ring-0 focus-visible:ring-0 ${errors.email ? "border-red-500" : ""}`} />
                  {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email}</p>}
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={`mt-2 h-11 text-base pr-10 ring-0 focus-visible:ring-0 ${errors.password ? "border-red-500" : ""}`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div key={level} className={`h-1.5 flex-1 rounded-full transition-all ${level <= strength ? strengthColors[strength - 1] : "bg-slate-200"}`} />
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        Strength: <span className={strength >= 3 ? "text-emerald-600" : "text-slate-600"}>{strengthLabels[strength - 1] || "Weak"}</span>
                      </p>
                    </div>
                  )}
                  {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password}</p>}
                </div>

                {/* Confirm Password field */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className={`mt-2 h-11 text-base pr-10 ring-0 focus-visible:ring-0 ${errors.confirmPassword ? "border-red-500" : ""}`} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 font-medium">{errors.confirmPassword}</p>}
                </div>

                {/* Alumni-only fields */}
                {role === "alumni" && (
                  <div className="space-y-4 pt-1 pb-1 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">Alumni Profile Info</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">Current Role</label>
                        <Input placeholder="e.g. SDE at Amazon" value={formData.currentRole} onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })} className="h-10 text-sm ring-0 focus-visible:ring-0" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">Company</label>
                        <Input placeholder="e.g. Amazon" value={formData.currentCompany} onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })} className="h-10 text-sm ring-0 focus-visible:ring-0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">Batch Year</label>
                        <Input placeholder="e.g. 2022" value={formData.batch} onChange={(e) => setFormData({ ...formData, batch: e.target.value })} className="h-10 text-sm ring-0 focus-visible:ring-0" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">Branch</label>
                        <Input placeholder="e.g. CSE" value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })} className="h-10 text-sm ring-0 focus-visible:ring-0" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">Domain</label>
                      <select value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-input text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-slate-700 font-medium">
                        <option value="">Select your domain</option>
                        {["Software Engineering","Data Science","Frontend Development","Backend Development","DevOps & Cloud","Product Management","Machine Learning","Full Stack Development"].map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">Bio <span className="text-slate-400 font-normal">(optional)</span></label>
                      <textarea placeholder="A short intro about your journey…" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                    </div>
                  </div>
                )}

                {/* Terms checkbox */}
                <div className="flex items-start gap-3 pt-2">
                  <input type="checkbox" id="terms" className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/50 focus:ring-offset-0 cursor-pointer" />
                  <label htmlFor="terms" className="text-sm text-slate-500 font-medium leading-relaxed">
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary font-semibold hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary font-semibold hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-11 text-base font-bold text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all disabled:opacity-70">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight size={18} className="ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
