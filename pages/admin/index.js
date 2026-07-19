import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();

  const [adminKey, setAdminKey] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/admin/session");
        const data = await response.json();

        if (data.authenticated) {
          await router.replace("/admin/analytics");
          return;
        }
      } catch (sessionError) {
        console.error("Admin session check failed:", sessionError);
      }

      setIsChecking(false);
    }

    void checkSession();
  }, [router]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminKey,
        }),
      });

      const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
    const responseText = await response.text();

    console.error("Unexpected login response:", responseText);

    throw new Error(
        `Login API returned ${response.status} instead of JSON. Check the Next.js terminal.`
    );
    }

    const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed.");
      }

      await router.push("/admin/analytics");
    } catch (loginError) {
      setError(loginError.message);
      setIsSubmitting(false);
    }
  }

  if (isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-sm text-slate-400">Checking session…</p>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Login | Portfolio Analytics</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300">
            <LockKeyhole size={24} />
          </div>

          <h1 className="mt-6 text-2xl font-semibold">
            Portfolio Analytics
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Enter your private admin key to access chatbot analytics.
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <label
              htmlFor="admin-key"
              className="text-sm font-medium text-slate-200"
            >
              Admin key
            </label>

            <input
              id="admin-key"
              type="password"
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              autoComplete="current-password"
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-purple-400"
              placeholder="Enter admin key"
            />

            {error && (
              <p className="mt-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-xl bg-purple-500 px-4 py-3 font-medium text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}