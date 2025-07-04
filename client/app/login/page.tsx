"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ImageCarousel from "@/components/ImageCarousel";

const loginImages = ["/login1.jpg", "/login2.jpg", "/login3.jpg"];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth(); // Add this line!

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle special case for unverified accounts
        if (data.needsVerification) {
          setError("Account non verificato. Vuoi completare la verifica?");
          // Could add a link to resend verification here
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-login`, {
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
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/profile`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FDF8F3]">
      {/* Left image carousel */}
      <div className="w-full md:w-1/2 h-64 md:h-auto">
        <ImageCarousel images={loginImages} />
      </div>

      {/* Login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 py-12">
        {step === 1 ? (
          <form
            onSubmit={handleLoginSubmit}
            className="w-full max-w-md bg-white p-10 rounded-xl shadow-xl space-y-6"
          >
            <h2 className="text-3xl font-bold text-center text-brand-coral">
              Accedi al tuo account
            </h2>

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-md text-sm">
                {successMessage}
              </div>
            )}

            <input
              type="text"
              name="emailOrUsername"
              placeholder="Email, telefono o username"
              value={form.emailOrUsername}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-green"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-green"
            />

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6BBF59] text-white py-3 rounded-md font-semibold hover:bg-[#5aad4e] transition disabled:opacity-50"
            >
              {loading ? "Accesso in corso..." : "Continua"}
            </button>

            <p className="text-sm text-center text-gray-500">
              Non hai un account?{" "}
              <a href="/register" className="text-brand-coral hover:underline">
                Registrati
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
                {loginData.verificationType === "email" ? "📧" : "📱"}
              </div>
              <h2 className="text-2xl font-bold text-brand-coral mb-2">
                Inserisci il codice
              </h2>
              <p className="text-gray-600 text-sm">
                Abbiamo inviato un codice di accesso a:<br />
                <strong>{loginData.contactInfo}</strong>
              </p>
            </div>

            <input
              type="text"
              placeholder="Codice a 6 cifre"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-green text-center text-2xl tracking-widest font-mono"
              required
              autoFocus
            />

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full bg-[#6BBF59] text-white py-3 rounded-md font-semibold hover:bg-[#5aad4e] transition disabled:opacity-50"
            >
              {loading ? "Verifica in corso..." : "Accedi"}
            </button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500">Non hai ricevuto il codice?</p>
              <button
                type="button"
                onClick={handleResendLoginCode}
                disabled={loading}
                className="text-brand-coral hover:underline text-sm disabled:opacity-50"
              >
                Invia di nuovo
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setVerificationCode("");
                setError("");
              }}
              className="w-full text-gray-500 py-2 text-sm hover:underline"
            >
              ← Torna al login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}