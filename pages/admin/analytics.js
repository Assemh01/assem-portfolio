import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Gauge,
  MessageSquare,
  RefreshCw,
  Timer,
  TriangleAlert,
  Users,
  XCircle,
  Zap,
} from "lucide-react";

function formatDuration(milliseconds) {
  if (milliseconds === null || milliseconds === undefined) {
    return "—";
  }

  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)} ms`;
  }

  return `${(milliseconds / 1000).toFixed(2)} s`;
}

function formatNumber(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercentage(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${Number(value).toFixed(1)}%`;
}

function formatUpdatedTime(date) {
  if (!date) {
    return "Not updated yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "default",
  compact = false,
}) {
  const toneStyles = {
    default: {
      card: "border-white/10 bg-slate-900/80",
      icon: "bg-white/5 text-slate-300",
      accent: "text-white",
    },
    purple: {
      card: "border-purple-400/25 bg-purple-500/[0.08]",
      icon: "bg-purple-500/15 text-purple-300",
      accent: "text-purple-50",
    },
    blue: {
      card: "border-blue-400/20 bg-blue-500/[0.06]",
      icon: "bg-blue-500/10 text-blue-300",
      accent: "text-blue-50",
    },
    green: {
      card: "border-emerald-400/20 bg-emerald-500/[0.06]",
      icon: "bg-emerald-500/10 text-emerald-300",
      accent: "text-emerald-50",
    },
    red: {
      card: "border-red-400/20 bg-red-500/[0.06]",
      icon: "bg-red-500/10 text-red-300",
      accent: "text-red-50",
    },
  };

  const styles = toneStyles[tone] || toneStyles.default;

  return (
    <article
      className={[
        "group relative h-full overflow-hidden rounded-2xl border",
        "shadow-sm transition duration-200",
        "hover:-translate-y-0.5 hover:border-white/20 hover:shadow-xl",
        compact ? "min-h-[132px] p-5" : "min-h-[158px] p-6",
        styles.card,
      ].join(" ")}
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-medium text-slate-400">{title}</p>

          <div
            className={[
              "flex shrink-0 items-center justify-center rounded-xl",
              compact ? "h-10 w-10" : "h-11 w-11",
              styles.icon,
            ].join(" ")}
          >
            <Icon size={compact ? 19 : 21} />
          </div>
        </div>

        <div className={compact ? "mt-5" : "mt-6"}>
          <p
            className={[
              "font-semibold tracking-tight",
              compact ? "text-2xl" : "text-3xl",
              styles.accent,
            ].join(" ")}
          >
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}

function SectionHeader({
  title,
  description,
  isCollapsible = false,
  isOpen = true,
  onToggle,
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>

        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      {isCollapsible && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-slate-800"
        >
          {isOpen ? "Collapse" : "Expand"}

          <ChevronDown
            size={15}
            className={`transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`overview-${index}`}
            className="h-[158px] animate-pulse rounded-2xl border border-white/10 bg-slate-900"
          />
        ))}
      </section>

      <section className="mt-10">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-900" />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`performance-${index}`}
              className="h-[132px] animate-pulse rounded-2xl border border-white/10 bg-slate-900"
            />
          ))}
        </div>
      </section>
    </>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();

  const [summary, setSummary] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setError("");
    setIsLoadingSummary(true);

    try {
      const response = await fetch("/api/admin/summary", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const responseText = await response.text();

        console.error("Unexpected summary response:", responseText);

        throw new Error(
          `Summary API returned ${response.status} instead of JSON.`
        );
      }

      const data = await response.json();

      if (response.status === 401) {
        await router.replace("/admin");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.detail || data.error || "Unable to load analytics."
        );
      }

      setSummary(data);
      setLastUpdated(new Date());
    } catch (summaryError) {
      console.error("Failed to load analytics summary:", summaryError);

      setError(
        summaryError.message ||
          "Something went wrong while loading analytics."
      );
    } finally {
      setIsLoadingSummary(false);
    }
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    async function initializeDashboard() {
      try {
        const response = await fetch("/api/admin/session", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error("Session endpoint did not return JSON.");
        }

        const data = await response.json();

        if (!data.authenticated) {
          await router.replace("/admin");
          return;
        }

        if (isMounted) {
          setIsCheckingSession(false);
        }

        await loadSummary();
      } catch (sessionError) {
        console.error("Admin session check failed:", sessionError);
        await router.replace("/admin");
      }
    }

    void initializeDashboard();

    return () => {
      isMounted = false;
    };
  }, [loadSummary, router]);

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
        <title>Analytics | Portfolio Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                <p className="text-sm font-medium text-purple-300">
                  Admin dashboard
                </p>
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Portfolio Analytics
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Monitor chatbot usage, response performance, and system
                reliability.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="text-left sm:text-right">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
                  Last updated
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {formatUpdatedTime(lastUpdated)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadSummary()}
                disabled={isLoadingSummary}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-purple-400/40 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={isLoadingSummary ? "animate-spin" : ""}
                />

                {isLoadingSummary ? "Refreshing…" : "Refresh data"}
              </button>
            </div>
          </header>

          {error && (
            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-5">
              <TriangleAlert
                size={20}
                className="mt-0.5 shrink-0 text-red-300"
              />

              <div>
                <p className="font-medium text-red-200">
                  Could not load analytics
                </p>

                <p className="mt-1 text-sm text-red-300/80">{error}</p>
              </div>
            </div>
          )}

          {isLoadingSummary && !summary ? (
            <DashboardSkeleton />
          ) : (
            summary && (
              <>
                <section className="mt-8">
                  <SectionHeader
                    title="Overview"
                    description="High-level chatbot activity and completion metrics."
                  />

                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                      title="Total conversations"
                      value={formatNumber(summary.total_conversations)}
                      description="Distinct visitor conversation sessions."
                      icon={Users}
                      tone="purple"
                    />

                    <MetricCard
                      title="Total chats"
                      value={formatNumber(summary.total_chats)}
                      description="All chatbot requests recorded."
                      icon={MessageSquare}
                      tone="purple"
                    />

                    <MetricCard
                      title="Chats today"
                      value={formatNumber(summary.chats_today)}
                      description="Requests received since the start of today."
                      icon={Bot}
                      tone="blue"
                    />

                    <MetricCard
                      title="Success rate"
                      value={formatPercentage(summary.success_rate)}
                      description="Requests that completed successfully."
                      icon={CheckCircle2}
                      tone="green"
                    />
                  </div>
                </section>

                <section className="mt-10">
                  <SectionHeader
                    title="Performance"
                    description="Average timing across recorded chatbot requests."
                    isCollapsible
                    isOpen={isPerformanceOpen}
                    onToggle={() =>
                      setIsPerformanceOpen((currentValue) => !currentValue)
                    }
                  />

                  {isPerformanceOpen && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <MetricCard
                        title="Response latency"
                        value={formatDuration(
                          summary.average_response_latency_ms
                        )}
                        description="Total backend request duration."
                        icon={Clock}
                        compact
                      />

                      <MetricCard
                        title="Retrieval latency"
                        value={formatDuration(
                          summary.average_retrieval_latency_ms
                        )}
                        description="Time spent retrieving knowledge."
                        icon={Database}
                        compact
                      />

                      <MetricCard
                        title="Rerank latency"
                        value={formatDuration(
                          summary.average_rerank_latency_ms
                        )}
                        description="Time spent reranking retrieved chunks."
                        icon={Gauge}
                        compact
                      />

                      <MetricCard
                        title="Generation latency"
                        value={formatDuration(
                          summary.average_generation_latency_ms
                        )}
                        description="Time spent generating assistant responses."
                        icon={Zap}
                        compact
                      />

                      <MetricCard
                        title="Backend TTFT"
                        value={formatDuration(
                          summary.average_backend_ttft_ms
                        )}
                        description="Backend time to first generated token."
                        icon={Timer}
                        compact
                      />

                      <MetricCard
                        title="Frontend TTFT"
                        value={formatDuration(
                          summary.average_frontend_ttft_ms
                        )}
                        description="User-perceived time to first token."
                        icon={Activity}
                        compact
                      />
                    </div>
                  )}
                </section>

                <section className="mt-10">
                  <SectionHeader
                    title="Reliability"
                    description="Failures and interrupted streaming requests."
                  />

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <MetricCard
                      title="Recorded errors"
                      value={formatNumber(summary.error_count)}
                      description="Backend errors captured in the analytics database."
                      icon={TriangleAlert}
                      tone={
                        Number(summary.error_count) > 0 ? "red" : "default"
                      }
                      compact
                    />

                    <MetricCard
                      title="Cancelled streams"
                      value={formatNumber(summary.cancelled_streams)}
                      description="Streaming responses interrupted before completion."
                      icon={XCircle}
                      tone={
                        Number(summary.cancelled_streams) > 0
                          ? "red"
                          : "default"
                      }
                      compact
                    />
                  </div>
                </section>

                <footer className="mt-12 border-t border-white/10 py-6">
                  <p className="text-xs text-slate-600">
                    Aggregate analytics across all recorded chatbot traffic.
                  </p>
                </footer>
              </>
            )
          )}
        </div>
      </main>
    </>
  );
}