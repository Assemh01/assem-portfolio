import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import ConversationExplorer from "../../components/admin/ConversationExplorer";

export default function ConversationsPage() {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/admin/session", {
          headers: {
            Accept: "application/json",
          },
        });

        const data = await response.json();

        if (!data.authenticated) {
          await router.replace("/admin");
          return;
        }

        if (isMounted) {
          setIsCheckingSession(false);
        }
      } catch (error) {
        console.error("Admin session check failed:", error);
        await router.replace("/admin");
      }
    }

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <RefreshCw
            className="mx-auto animate-spin text-purple-300"
            size={24}
          />

          <p className="mt-4 text-sm text-slate-400">
            Verifying admin session…
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Conversations | Portfolio Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white tablet:px-6 laptop:px-8">
        <div className="mx-auto max-w-screen-2xl">
          <header className="border-b border-white/10 pb-7">
            <div className="flex flex-col gap-5 laptop:flex-row laptop:items-end laptop:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />

                  <p className="text-sm font-medium text-purple-300">
                    Admin dashboard
                  </p>
                </div>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight tablet:text-4xl">
                  Conversations
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Search and inspect chatbot questions, responses, visitors,
                  and request performance.
                </p>
              </div>

              <nav className="flex rounded-xl border border-white/10 bg-slate-900/70 p-1">
                <Link href="/admin/analytics">
                  <a className="rounded-lg px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">
                    Overview
                  </a>
                </Link>

                <Link href="/admin/trends?range=30d">
                  <a className="rounded-lg px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">
                    Trends
                  </a>
                </Link>

                <Link href="/admin/conversations">
                  <a className="rounded-lg bg-purple-500/15 px-4 py-2 text-sm font-medium text-purple-200">
                    Conversations
                  </a>
                </Link>
              </nav>
            </div>
          </header>

          <ConversationExplorer />
        </div>
      </main>
    </>
  );
}