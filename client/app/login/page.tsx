"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    emailOrUsername: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        const msg = data.errors?.[0]?.msg || data.error || "Errore di login";
        throw new Error(msg);
      }

      // Optionally: save token locally
      localStorage.setItem("token", data.token);

      router.push("/dashboard"); // or wherever user goes after login
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF8F3] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-10 rounded-xl shadow-xl space-y-6"
      >
        <h2 className="text-3xl font-bold text-center text-brand-coral">Accedi al tuo account</h2>

        <input
          type="text"
          name="emailOrUsername"
          placeholder="Email o Username"
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

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#6BBF59] text-white py-3 rounded-md font-semibold hover:bg-[#5aad4e] transition"
        >
          {loading ? "Accesso in corso..." : "Accedi"}
        </button>

        <p className="text-sm text-center text-gray-500">
          Non hai un account?{" "}
          <a href="/register" className="text-brand-coral hover:underline">
            Registrati
          </a>
        </p>
      </form>
    </div>
  );
}
