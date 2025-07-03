"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    if (form.password !== form.confirmPassword) {
      setErrors({ confirmPassword: "Le password non corrispondono." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          const fieldErrors: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            fieldErrors[err.param] = err.msg;
          });
          setErrors(fieldErrors);
        } else if (data.error) {
          setGeneralError(data.error);
        } else {
          setGeneralError("Errore di registrazione.");
        }
        return;
      }

      router.push("/login");
    } catch (err: any) {
      setGeneralError("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF8F3] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white p-10 rounded-xl shadow-xl space-y-6"
      >
        <h2 className="text-3xl font-bold text-center text-brand-coral">Crea il tuo account</h2>

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

        <div>
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
        </div>

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

        <div>
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
        </div>

        <div>
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
        </div>

        {generalError && <p className="text-red-500 text-sm text-center">{generalError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#6BBF59] text-white py-3 rounded-md font-semibold hover:bg-[#5aad4e] transition"
        >
          {loading ? "Registrazione in corso..." : "Registrati"}
        </button>

        <p className="text-sm text-center text-gray-500">
          Hai già un account?{" "}
          <a href="/login" className="text-brand-coral hover:underline">
            Accedi
          </a>
        </p>
      </form>
    </div>
  );
}
