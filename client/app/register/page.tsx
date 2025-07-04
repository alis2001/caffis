"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useGuestOnly } from "@/contexts/AuthContext";
import ImageCarousel from "@/components/ImageCarousel";

const registerImages = ["/register1.jpg", "/register2.jpg", "/register3.jpg"];

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

  // Redirect if already authenticated
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/dashboard');
    }
  }, [shouldRedirect, router]);

  // Show loading if checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF8F3]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6BBF59] mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
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
      const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-registration`, {
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

      // Success! Now we need to generate a login token
      // We'll modify the backend to return a token on successful verification
      if (verifyData.token) {
        // Auto-login with the returned token
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`, {
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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FDF8F3]">
      {/* Left image carousel */}
      <div className="w-full md:w-1/2 h-64 md:h-auto">
        <ImageCarousel images={registerImages} />
      </div>

      {/* Registration form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 py-12">
        {step === 1 ? (
          <form
            onSubmit={handleRegistrationSubmit}
            className="w-full max-w-lg bg-white p-10 rounded-xl shadow-xl space-y-6"
          >
            <h2 className="text-3xl font-bold text-center text-brand-coral">
              Crea il tuo account
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Nome"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  className="px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-green w-full"
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Cognome"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  className="px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-green w-full"
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-green"
            />
            {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}

            {/* Contact method selection */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700">Come vuoi essere contattato?</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="contactMethod"
                    value="email"
                    checked={contactMethod === "email"}
                    onChange={() => handleContactMethodChange("email")}
                    className="mr-2"
                  />
                  📧 Email
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="contactMethod"
                    value="phone"
                    checked={contactMethod === "phone"}
                    onChange={() => handleContactMethodChange("phone")}
                    className="mr-2"
                  />
                  📱 Telefono
                </label>
              </div>

              {contactMethod === "email" ? (
                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-green"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              ) : (
                <div>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="Numero di telefono (es. +393XXXXXXXXX)"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-green"
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    Includi il prefisso internazionale (es. +39 per l'Italia)
                  </p>
                </div>
              )}
            </div>

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-green"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}

            <input
              type="password"
              name="confirmPassword"
              placeholder="Conferma Password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-green"
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}

            {generalError && <p className="text-red-500 text-sm text-center">{generalError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6BBF59] text-white py-3 rounded-md font-semibold hover:bg-[#5aad4e] transition disabled:opacity-50"
            >
              {loading ? "Registrazione in corso..." : "Crea Account"}
            </button>

            <p className="text-sm text-center text-gray-500">
              Hai già un account?{" "}
              <a href="/login" className="text-brand-coral hover:underline">
                Accedi
              </a>
            </p>
          </form>
        ) : (
          // Step 2: Verification form
          <form
            onSubmit={handleVerificationSubmit}
            className="w-full max-w-md bg-white p-10 rounded-xl shadow-xl space-y-6"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">
                {registrationData.verificationType === "email" ? "📧" : "📱"}
              </div>
              <h2 className="text-2xl font-bold text-brand-coral mb-2">
                Verifica il tuo account
              </h2>
              <p className="text-gray-600 text-sm">
                Abbiamo inviato un codice di 6 cifre a:<br />
                <strong>{registrationData.contactInfo}</strong>
              </p>
              <p className="text-xs text-green-600 mt-2">
                ✨ Sarai automaticamente connesso dopo la verifica!
              </p>
            </div>

            <input
              type="text"
              placeholder="Inserisci il codice a 6 cifre"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-green text-center text-2xl tracking-widest font-mono"
              required
            />

            {generalError && <p className="text-red-500 text-sm text-center">{generalError}</p>}

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full bg-[#6BBF59] text-white py-3 rounded-md font-semibold hover:bg-[#5aad4e] transition disabled:opacity-50"
            >
              {loading ? "Verifica e accesso..." : "Verifica e Accedi"}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Non hai ricevuto il codice?</p>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || loading}
                className="text-brand-coral hover:underline text-sm disabled:opacity-50"
              >
                {resendCooldown > 0 
                  ? `Riprova tra ${resendCooldown}s` 
                  : "Invia di nuovo"
                }
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-gray-500 py-2 text-sm hover:underline"
            >
              ← Torna alla registrazione
            </button>
          </form>
        )}
      </div>
    </div>
  );
}