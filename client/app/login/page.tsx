"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, Eye, EyeOff, User, Lock, ArrowRight, Shield, LogIn, RefreshCw } from "lucide-react";

// Your existing login component - EXACTLY as it is
function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  // Form state
  const [step, setStep] = useState(1); // 1 = login form, 2 = verification
  const [form, setForm] = useState({
    emailOrUsername: "",
    password: "",
  });

  // Verification state
  const [loginData, setLoginData] = useState({
    userId: "",
    verificationType: "",
    contactInfo: "",
  });
  const [verificationCode, setVerificationCode] = useState("");

  // UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Check for verification success message
  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setSuccessMessage("✅ Account verificato con successo! Ora puoi accedere.");
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Step 1: Submit login credentials
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle special case for unverified accounts
        if (data.needsVerification) {
          setError("Account non verificato. Vuoi completare la verifica?");
          return;
        }
        
        const msg = data.errors?.[0]?.msg || data.error || "Errore di login";
        throw new Error(msg);
      }

      // Success - move to verification step
      setLoginData({
        userId: data.userId,
        verificationType: data.verificationType,
        contactInfo: data.contactInfo,
      });
      setStep(2);
      setSuccessMessage(""); // Clear any previous messages

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit verification code
  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (verificationCode.length !== 6) {
      setError("Il codice deve essere di 6 cifre");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: loginData.userId,
          code: verificationCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Errore nella verifica");
        return;
      }

      // Success - login with the token
      await login(data.token);

      // Check user's onboarding status to redirect properly
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${data.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        
        // Redirect based on onboarding completion
        if (userData.user && userData.user.onboardingCompleted) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      } else {
        // Fallback: if we can't check onboarding status, go to dashboard
        router.push("/dashboard");
      }

    } catch (error) {
      console.error('Login verification error:', error);
      setError("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  // Resend login verification code
  const handleResendLoginCode = async () => {
    setLoading(true);
    setError("");

    try {
      // Re-request login code by calling login again
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setError("");
        // Could show a success message here
      } else {
        setError(data.error || "Errore nell'invio del codice");
      }
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-apple-mesh">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-blue-400/10 to-purple-400/10 backdrop-blur-sm"
            style={{
              width: `${60 + i * 20}px`,
              height: `${60 + i * 20}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full max-w-md"
            >
              <div className="card-apple p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center"
                  >
                    <LogIn className="w-8 h-8 text-white" />
                  </motion.div>
                  <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                    Bentornato
                  </h1>
                  <p className="text-gray-600">
                    Accedi al tuo account Caffis
                  </p>
                </div>

                {/* Success Message */}
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50/80 backdrop-blur-md border border-green-200/50 text-green-700 px-4 py-3 rounded-xl text-sm mb-6"
                  >
                    {successMessage}
                  </motion.div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-6">
                  {/* Email/Username Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative"
                  >
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                    <input
                      type="text"
                      name="emailOrUsername"
                      placeholder="Email, telefono o username"
                      value={form.emailOrUsername}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-md border border-blue-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 focus:bg-white/70"
                    />
                    {/* Gradient Border Animation */}
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 -z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </motion.div>

                  {/* Password Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="relative"
                  >
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-12 py-3 bg-white/50 backdrop-blur-md border border-purple-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 focus:bg-white/70"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    {/* Gradient Border Animation */}
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 -z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                    />
                  </motion.div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50/80 backdrop-blur-md border border-red-200/50 text-red-600 px-4 py-3 rounded-xl text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Submit Button - Liquid Glass */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 px-8 py-4 text-lg rounded-3xl shadow-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                    style={{
                      background: loading 
                        ? "rgba(255, 255, 255, 0.1)" 
                        : "linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(139, 92, 246, 0.8) 50%, rgba(168, 85, 247, 0.8) 100%)"
                    }}
                    whileHover={{ scale: loading ? 1 : 1.02, y: -2 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {/* Liquid Glass Effect Layer */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 opacity-0 group-hover:opacity-100"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    />
                    
                    {/* Shimmer Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ width: "50%" }}
                    />
                    
                    {/* Button Content */}
                    <div className="relative z-10 flex items-center justify-center gap-3">
                      {loading ? (
                        <>
                          <motion.div
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <span className="font-semibold">Accesso in corso...</span>
                        </>
                      ) : (
                        <>
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.6 }}
                          >
                            <LogIn className="w-6 h-6" />
                          </motion.div>
                          <span className="font-semibold">Continua</span>
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <ArrowRight className="w-5 h-5" />
                          </motion.div>
                        </>
                      )}
                    </div>
                    
                    {/* Glass Border Effect */}
                    <div className="absolute inset-0 rounded-3xl border border-white/20 group-hover:border-white/40 transition-all duration-300" />
                  </motion.button>

                  {/* Register Link */}
                  <div className="text-center">
                    <p className="text-gray-600 text-sm">
                      Non hai un account?{" "}
                      <a href="/register" className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-semibold hover:underline">
                        Registrati
                      </a>
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            /* Verification Form */
            <motion.div
              key="verification-form"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full max-w-md"
            >
              <div className="card-apple p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center"
                  >
                    <div className="text-4xl">
                      {loginData.verificationType === "email" ? "📧" : "📱"}
                    </div>
                  </motion.div>
                  <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 mb-2">
                    Codice di Accesso
                  </h1>
                  <p className="text-gray-600 mb-2">
                    Codice inviato a:
                  </p>
                  <p className="font-semibold text-gray-800">
                    {loginData.contactInfo}
                  </p>
                </div>

                <form onSubmit={handleVerificationSubmit} className="space-y-6">
                  {/* Verification Code Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      className="w-full px-4 py-4 bg-white/50 backdrop-blur-md border border-green-200/50 rounded-xl text-center text-3xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all focus:bg-white/70"
                      required
                      autoFocus
                    />
                    <div className="text-center mt-2">
                      <span className="text-xs text-gray-500">
                        Inserisci il codice a 6 cifre
                      </span>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50/80 backdrop-blur-md border border-red-200/50 text-red-600 px-4 py-3 rounded-xl text-sm text-center"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Submit Button - Liquid Glass */}
                  <motion.button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 px-8 py-4 text-lg rounded-3xl shadow-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                    style={{
                      background: loading 
                        ? "rgba(255, 255, 255, 0.1)" 
                        : "linear-gradient(135deg, rgba(34, 197, 94, 0.8) 0%, rgba(59, 130, 246, 0.8) 50%, rgba(99, 102, 241, 0.8) 100%)"
                    }}
                    whileHover={{ scale: (loading || verificationCode.length !== 6) ? 1 : 1.02, y: -2 }}
                    whileTap={{ scale: (loading || verificationCode.length !== 6) ? 1 : 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {/* Liquid Glass Effect Layer */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 opacity-0 group-hover:opacity-100"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    />
                    
                    {/* Shimmer Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ width: "50%" }}
                    />
                    
                    {/* Button Content */}
                    <div className="relative z-10 flex items-center justify-center gap-3">
                      {loading ? (
                        <>
                          <motion.div
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <span className="font-semibold">Verifica in corso...</span>
                        </>
                      ) : (
                        <>
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.6 }}
                          >
                            <Shield className="w-6 h-6" />
                          </motion.div>
                          <span className="font-semibold">Accedi</span>
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <ArrowRight className="w-5 h-5" />
                          </motion.div>
                        </>
                      )}
                    </div>
                    
                    {/* Glass Border Effect */}
                    <div className="absolute inset-0 rounded-3xl border border-white/20 group-hover:border-white/40 transition-all duration-300" />
                  </motion.button>

                  {/* Resend Code - Liquid Glass Style */}
                  <div className="text-center space-y-3">
                    <p className="text-sm text-gray-500">Non hai ricevuto il codice?</p>
                    <motion.button
                      type="button"
                      onClick={handleResendLoginCode}
                      disabled={loading}
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 px-6 py-3 rounded-2xl shadow-lg transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                      style={{
                        background: loading
                          ? "rgba(255, 255, 255, 0.1)" 
                          : "linear-gradient(135deg, rgba(251, 146, 60, 0.6) 0%, rgba(249, 115, 22, 0.6) 50%, rgba(239, 68, 68, 0.6) 100%)"
                      }}
                      whileHover={{ scale: loading ? 1 : 1.05 }}
                      whileTap={{ scale: loading ? 1 : 0.95 }}
                    >
                      {/* Liquid Glass Effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 opacity-0 group-hover:opacity-100"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                      />
                      
                      <span className="relative z-10 font-medium text-sm flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Invia di nuovo
                      </span>
                      
                      <div className="absolute inset-0 rounded-2xl border border-white/20 group-hover:border-white/40 transition-all duration-300" />
                    </motion.button>
                  </div>

                  {/* Back Button - Liquid Glass Style */}
                  <motion.button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setVerificationCode("");
                      setError("");
                    }}
                    className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-gray-400 hover:text-white hover:bg-white/20 py-3 rounded-2xl shadow-lg transition-all duration-500 relative overflow-hidden group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Liquid Glass Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 opacity-0 group-hover:opacity-100"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                    />
                    
                    <span className="relative z-10 font-medium text-sm flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ x: [-2, 2, -2] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        ←
                      </motion.span>
                      Torna al login
                    </span>
                    
                    <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-white/30 transition-all duration-300" />
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Simple loading fallback that matches your design
function LoginPageFallback() {
  return (
    <div className="min-h-screen bg-apple-mesh">
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8">
        <div className="card-apple p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <motion.div
              className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    </div>
  );
}

// Main component - ONLY CHANGE: Added Suspense wrapper
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}