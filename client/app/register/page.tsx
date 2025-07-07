"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useGuestOnly } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, Eye, EyeOff, User, Lock, ArrowRight, Sparkles, Shield } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { shouldRedirect, isLoading: authLoading } = useGuestOnly();

  // Form state
  const [step, setStep] = useState(1); // 1 = registration form, 2 = verification
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  // Verification state
  const [registrationData, setRegistrationData] = useState({
    userId: "",
    verificationType: "",
    contactInfo: "",
  });
  const [verificationCode, setVerificationCode] = useState("");

  // UI state
  const [contactMethod, setContactMethod] = useState("email"); // "email" or "phone"
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/dashboard');
    }
  }, [shouldRedirect, router]);

  // Show loading if checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-apple-mesh flex items-center justify-center">
        <div className="card-apple text-center py-12 px-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleContactMethodChange = (method: "email" | "phone") => {
    setContactMethod(method);
    // Clear the other field
    if (method === "email") {
      setForm({ ...form, phoneNumber: "" });
    } else {
      setForm({ ...form, email: "" });
    }
    setErrors({});
  };

  // Step 1: Submit registration form
  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    // Validation
    if (form.password !== form.confirmPassword) {
      setErrors({ confirmPassword: "Le password non corrispondono." });
      return;
    }

    if (contactMethod === "phone" && !form.phoneNumber.startsWith("+")) {
      setErrors({ phoneNumber: "Il numero deve iniziare con il prefisso (es. +39)" });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        password: form.password,
        ...(contactMethod === "email" ? { email: form.email } : { phoneNumber: form.phoneNumber }),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          const fieldErrors: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            fieldErrors[err.path || err.param || "general"] = err.msg;
          });
          setErrors(fieldErrors);
        } else if (data.error) {
          setGeneralError(data.error);
        } else {
          setGeneralError("Errore di registrazione.");
        }
        return;
      }

      // Success - move to verification step
      setRegistrationData({
        userId: data.userId,
        verificationType: data.verificationType,
        contactInfo: data.contactInfo,
      });
      setStep(2);

    } catch {
      setGeneralError("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit verification code and auto-login
  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (verificationCode.length !== 6) {
      setGeneralError("Il codice deve essere di 6 cifre");
      return;
    }

    setLoading(true);

    try {
      // First verify the registration code
      const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: registrationData.userId,
          code: verificationCode,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setGeneralError(verifyData.error || "Errore nella verifica");
        return;
      }

      // Success! Auto-login with the returned token
      if (verifyData.token) {
        await login(verifyData.token);
        router.push("/onboarding");
      } else {
        // Fallback: redirect to login with success message
        router.push("/login?verified=true&message=Registrazione completata! Ora accedi.");
      }

    } catch {
      setGeneralError("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: registrationData.userId }),
      });

      const data = await res.json();

      if (res.ok) {
        // Start cooldown
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setGeneralError(data.error || "Errore nell'invio del codice");
      }
    } catch {
      setGeneralError("Errore di rete. Riprova.");
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
            className="absolute rounded-full bg-gradient-to-r from-purple-400/10 to-pink-400/10 backdrop-blur-sm"
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

      <div className="page-content-spacing relative z-10 flex items-center justify-center min-h-screen px-4 py-8">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="registration-form"
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
                    className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
                  >
                    <Sparkles className="w-8 h-8 text-white" />
                  </motion.div>
                  <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                    Unisciti a Caffis
                  </h1>
                  <p className="text-gray-600">
                    Crea il tuo account e inizia a connettere
                  </p>
                </div>

                <form onSubmit={handleRegistrationSubmit} className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="firstName"
                        placeholder="Nome"
                        value={form.firstName}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-md border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                      {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                    </div>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Cognome"
                        value={form.lastName}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-md border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                      {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                    </div>
                  </div>

                  {/* Username */}
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="username"
                      placeholder="Username"
                      value={form.username}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-md border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                  </div>

                  {/* Contact Method Selection */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">Come vuoi essere contattato?</label>
                    <div className="relative flex bg-white/20 backdrop-blur-md rounded-2xl p-2 border border-white/30">
                      {/* Animated Background Slider */}
                      <motion.div
                        className="absolute top-2 bottom-2 w-1/2 rounded-xl shadow-lg"
                        style={{
                          background: contactMethod === "email" 
                            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                            : "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                        }}
                        animate={{
                          x: contactMethod === "email" ? 0 : "100%",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                          duration: 0.6
                        }}
                      />
                      
                      {/* Email Button */}
                      <motion.button
                        type="button"
                        onClick={() => handleContactMethodChange("email")}
                        className="relative z-10 flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          animate={{
                            scale: contactMethod === "email" ? 1.1 : 1,
                            rotate: contactMethod === "email" ? 360 : 0
                          }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                          <Mail className={`w-5 h-5 transition-colors duration-300 ${
                            contactMethod === "email" ? 'text-white' : 'text-gray-600'
                          }`} />
                        </motion.div>
                        <span className={`font-semibold transition-colors duration-300 ${
                          contactMethod === "email" ? 'text-white' : 'text-gray-600'
                        }`}>
                          Email
                        </span>
                        
                        {/* Water Fill Effect */}
                        {contactMethod === "email" && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ 
                              duration: 0.8, 
                              ease: "easeOut",
                              type: "spring",
                              stiffness: 100
                            }}
                          />
                        )}
                      </motion.button>
                      
                      {/* Phone Button */}
                      <motion.button
                        type="button"
                        onClick={() => handleContactMethodChange("phone")}
                        className="relative z-10 flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          animate={{
                            scale: contactMethod === "phone" ? 1.1 : 1,
                            rotate: contactMethod === "phone" ? 360 : 0
                          }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                          <Phone className={`w-5 h-5 transition-colors duration-300 ${
                            contactMethod === "phone" ? 'text-white' : 'text-gray-600'
                          }`} />
                        </motion.div>
                        <span className={`font-semibold transition-colors duration-300 ${
                          contactMethod === "phone" ? 'text-white' : 'text-gray-600'
                        }`}>
                          Telefono
                        </span>
                        
                        {/* Water Fill Effect */}
                        {contactMethod === "phone" && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-xl"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ 
                              duration: 0.8, 
                              ease: "easeOut",
                              type: "spring",
                              stiffness: 100
                            }}
                          />
                        )}
                      </motion.button>
                    </div>

                    {/* Contact Input with Animation */}
                    <AnimatePresence mode="wait">
                      {contactMethod === "email" ? (
                        <motion.div
                          key="email-input"
                          initial={{ opacity: 0, x: -20, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 20, scale: 0.9 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className="relative"
                        >
                          <motion.div
                            className="absolute left-3 top-1/2 transform -translate-y-1/2"
                            animate={{ 
                              scale: [1, 1.2, 1],
                              color: ["#9CA3AF", "#667eea", "#9CA3AF"]
                            }}
                            transition={{ duration: 0.6 }}
                          >
                            <Mail className="w-5 h-5 text-purple-500" />
                          </motion.div>
                          <input
                            type="email"
                            name="email"
                            placeholder="La tua email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-md border border-purple-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 focus:bg-white/70"
                          />
                          {/* Gradient Border Animation */}
                          <motion.div
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 -z-10"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                          {errors.email && (
                            <motion.p
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-500 text-xs mt-1"
                            >
                              {errors.email}
                            </motion.p>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="phone-input"
                          initial={{ opacity: 0, x: 20, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -20, scale: 0.9 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className="relative"
                        >
                          <motion.div
                            className="absolute left-3 top-1/2 transform -translate-y-1/2"
                            animate={{ 
                              scale: [1, 1.2, 1],
                              color: ["#9CA3AF", "#4facfe", "#9CA3AF"]
                            }}
                            transition={{ duration: 0.6 }}
                          >
                            <Phone className="w-5 h-5 text-cyan-500" />
                          </motion.div>
                          <input
                            type="tel"
                            name="phoneNumber"
                            placeholder="+39 3XX XXX XXXX"
                            value={form.phoneNumber}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-md border border-cyan-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 focus:bg-white/70"
                          />
                          {/* Gradient Border Animation */}
                          <motion.div
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 -z-10"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                          {errors.phoneNumber && (
                            <motion.p
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-500 text-xs mt-1"
                            >
                              {errors.phoneNumber}
                            </motion.p>
                          )}
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-xs text-gray-500 mt-1"
                          >
                            Includi il prefisso internazionale
                          </motion.p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Password Fields */}
                  <div className="space-y-4">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-12 py-3 bg-white/50 backdrop-blur-md border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Conferma Password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-12 py-3 bg-white/50 backdrop-blur-md border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                    </div>
                  </div>

                  {/* Error Message */}
                  {generalError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm"
                    >
                      {generalError}
                    </motion.div>
                  )}

                  {/* Submit Button - Liquid Glass Apple Style */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 px-8 py-4 text-lg rounded-3xl shadow-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                    style={{
                      background: loading 
                        ? "rgba(255, 255, 255, 0.1)" 
                        : "linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 50%, rgba(240, 147, 251, 0.8) 100%)"
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
                          <span className="font-semibold">Creazione account...</span>
                        </>
                      ) : (
                        <>
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.6 }}
                          >
                            <Sparkles className="w-6 h-6" />
                          </motion.div>
                          <span className="font-semibold">Crea Account</span>
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

                  {/* Login Link */}
                  <div className="text-center">
                    <p className="text-gray-600 text-sm">
                      Hai già un account?{" "}
                      <a href="/login" className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-semibold hover:underline">
                        Accedi
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
                    className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center"
                  >
                    <div className="text-4xl">
                      {registrationData.verificationType === "email" ? "📧" : "📱"}
                    </div>
                  </motion.div>
                  <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                    Verifica Account
                  </h1>
                  <p className="text-gray-600 mb-2">
                    Codice di verifica inviato a:
                  </p>
                  <p className="font-semibold text-gray-800">
                    {registrationData.contactInfo}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    <Shield className="w-4 h-4" />
                    Accesso automatico dopo la verifica
                  </div>
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
                      className="w-full px-4 py-4 bg-white/50 backdrop-blur-md border border-white/20 rounded-xl text-center text-3xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  {generalError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center"
                    >
                      {generalError}
                    </motion.div>
                  )}

                  {/* Submit Button - Verification Step */}
                  <motion.button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 px-8 py-4 text-lg rounded-3xl shadow-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                    style={{
                      background: loading 
                        ? "rgba(255, 255, 255, 0.1)" 
                        : "linear-gradient(135deg, rgba(75, 172, 254, 0.8) 0%, rgba(0, 242, 254, 0.8) 50%, rgba(67, 233, 123, 0.8) 100%)"
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
                          <span className="font-semibold">Verifica e accesso...</span>
                        </>
                      ) : (
                        <>
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.6 }}
                          >
                            <Shield className="w-6 h-6" />
                          </motion.div>
                          <span className="font-semibold">Verifica e Accedi</span>
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
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0 || loading}
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 px-6 py-3 rounded-2xl shadow-lg transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                      style={{
                        background: (resendCooldown > 0 || loading)
                          ? "rgba(255, 255, 255, 0.1)" 
                          : "linear-gradient(135deg, rgba(240, 147, 251, 0.6) 0%, rgba(245, 87, 108, 0.6) 50%, rgba(255, 154, 158, 0.6) 100%)"
                      }}
                      whileHover={{ scale: (resendCooldown > 0 || loading) ? 1 : 1.05 }}
                      whileTap={{ scale: (resendCooldown > 0 || loading) ? 1 : 0.95 }}
                    >
                      {/* Liquid Glass Effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 opacity-0 group-hover:opacity-100"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                      />
                      
                      <span className="relative z-10 font-medium text-sm">
                        {resendCooldown > 0 
                          ? `Riprova tra ${resendCooldown}s` 
                          : "Invia di nuovo"
                        }
                      </span>
                      
                      <div className="absolute inset-0 rounded-2xl border border-white/20 group-hover:border-white/40 transition-all duration-300" />
                    </motion.button>
                  </div>

                  {/* Back Button - Liquid Glass Style */}
                  <motion.button
                    type="button"
                    onClick={() => setStep(1)}
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
                      Torna alla registrazione
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