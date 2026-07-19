import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";

import ChatVolumeChart from "../../components/admin/charts/ChatVolumeChart";
import LatencyChart from "../../components/admin/charts/LatencyChart";
import ReliabilityChart from "../../components/admin/charts/ReliabilityChart";

const ANALYTICS_RANGES = [
  {
    value: "7d",
    label: "7 days",
  },
  {
    value: "30d",
    label: "30 days",
  },
  {
    value: "90d",
    label: "90 days",
  },
  {
    value: "all",
    label: "All time",
  },
];

const DEFAULT_ANALYTICS_RANGE = "30d";

function isValidAnalyticsRange(value) {
  return ANALYTICS_RANGES.some(
    (rangeOption) => rangeOption.value === value
  );
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

export default function TrendsPage() {
  const router = useRouter();

  const [trends, setTrends] = useState(null);
  const [selectedRange, setSelectedRange] = useState(
    DEFAULT_ANALYTICS_RANGE
  );

  const [isCheckingSession, setIsCheckingSession] =
    useState(true);
  const [isLoadingTrends, setIsLoadingTrends] =
    useState(true);

  const [trendsError, setTrendsError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadTrends = useCallback(
    async (requestedRange = DEFAULT_ANALYTICS_RANGE) => {
      const safeRange = isValidAnalyticsRange(requestedRange)
        ? requestedRange
        : DEFAULT_ANALYTICS_RANGE;

      setTrendsError("");
      setIsLoadingTrends(true);

      try {
        const response = await fetch(
          `/api/admin/trends?range=${encodeURIComponent(
            safeRange
          )}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const contentType =
          response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          const responseText = await response.text();

          console.error(
            "Unexpected trends response:",
            responseText
          );

          throw new Error(
            `Trends API returned ${response.status} instead of JSON.`
          );
        }

        const data = await response.json();

        if (response.status === 401) {
          await router.replace("/admin");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.detail ||
              data.error ||
              "Unable to load analytics trends."
          );
        }

        setTrends(data);
        setLastUpdated(new Date());
      } catch (requestError) {
        console.error(
          "Failed to load analytics trends:",
          requestError
        );

        setTrendsError(
          requestError.message ||
            "Something went wrong while loading trend data."
        );
      } finally {
        setIsLoadingTrends(false);
      }
    },
    [router]
  );

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/admin/session", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        const contentType =
          response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error(
            "Session endpoint did not return JSON."
          );
        }

        const data = await response.json();

        if (!data.authenticated) {
          await router.replace("/admin");
          return;
        }

        if (isMounted) {
          setIsCheckingSession(false);
        }
      } catch (sessionError) {
        console.error(
          "Admin session check failed:",
          sessionError
        );

        await router.replace("/admin");
      }
    }

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (isCheckingSession || !router.isReady) {
      return;
    }

    const queryRange =
      typeof router.query.range === "string"
        ? router.query.range
        : DEFAULT_ANALYTICS_RANGE;

    const safeRange = isValidAnalyticsRange(queryRange)
      ? queryRange
      : DEFAULT_ANALYTICS_RANGE;

    setSelectedRange(safeRange);

    if (queryRange !== safeRange) {
      void router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            range: safeRange,
          },
        },
        undefined,
        {
          shallow: true,
          scroll: false,
        }
      );

      return;
    }

    void loadTrends(safeRange);
  }, [
    isCheckingSession,
    loadTrends,
    router.isReady,
    router.pathname,
    router.query.range,
  ]);

  async function handleRangeChange(nextRange) {
    if (
      !isValidAnalyticsRange(nextRange) ||
      nextRange === selectedRange
    ) {
      return;
    }

    setSelectedRange(nextRange);

    await router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          range: nextRange,
        },
      },
      undefined,
      {
        shallow: true,
        scroll: false,
      }
    );
  }

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

  const chartData = trends?.items || [];

  return (
    <>
      <Head>
        <title>Trends | Portfolio Admin</title>
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
                  Analytics Trends
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                  Explore chatbot traffic, latency, time to first
                  token, and reliability over time.
                </p>
              </div>

              <nav className="flex rounded-xl border border-white/10 bg-slate-900/70 p-1">
                <Link href="/admin/analytics">
                  <a className="rounded-lg px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">
                    Overview
                  </a>
                </Link>

                <Link href="/admin/trends?range=30d">
                  <a className="rounded-lg bg-purple-500/15 px-4 py-2 text-sm font-medium text-purple-200">
                    Trends
                  </a>
                </Link>

                <Link href="/admin/conversations">
                  <a className="rounded-lg px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">
                    Conversations
                  </a>
                </Link>
              </nav>
            </div>
          </header>

          <section className="mt-8">
            <div className="flex flex-col gap-4 laptop:flex-row laptop:items-end laptop:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Daily performance
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select the period used across every chart.
                </p>
              </div>

              <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center">
                <div className="text-left tablet:text-right">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
                    Last updated
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {formatUpdatedTime(lastUpdated)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadTrends(selectedRange)
                  }
                  disabled={isLoadingTrends}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-purple-400/40 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={
                      isLoadingTrends ? "animate-spin" : ""
                    }
                  />

                  {isLoadingTrends
                    ? "Refreshing…"
                    : "Refresh data"}
                </button>
              </div>
            </div>

            <div className="mt-5 inline-flex w-full overflow-x-auto rounded-xl border border-white/10 bg-slate-900/80 p-1 tablet:w-fit">
              {ANALYTICS_RANGES.map((rangeOption) => {
                const isSelected =
                  selectedRange === rangeOption.value;

                return (
                  <button
                    key={rangeOption.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() =>
                      void handleRangeChange(
                        rangeOption.value
                      )
                    }
                    className={[
                      "shrink-0 rounded-lg px-4 py-2 text-xs font-medium transition",
                      isSelected
                        ? "bg-purple-500 text-white shadow-sm"
                        : "text-slate-400 hover:bg-white/5 hover:text-white",
                    ].join(" ")}
                  >
                    {rangeOption.label}
                  </button>
                );
              })}
            </div>
          </section>

          {trendsError && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-5">
              <TriangleAlert
                size={20}
                className="mt-0.5 shrink-0 text-red-300"
              />

              <div>
                <p className="font-medium text-red-200">
                  Could not load trends
                </p>

                <p className="mt-1 text-sm text-red-300/80">
                  {trendsError}
                </p>
              </div>
            </div>
          )}

          <section className="mt-6 space-y-4">
            <ChatVolumeChart
              data={chartData}
              isLoading={isLoadingTrends}
              error=""
            />

            <div className="grid gap-4 desktop:grid-cols-2">
              <LatencyChart
                title="Total response latency"
                description="Average full backend request duration by day."
                data={chartData}
                isLoading={isLoadingTrends}
                error=""
                series={[
                  {
                    dataKey: "average_total_latency_ms",
                    name: "Total latency",
                    color: "#a855f7",
                  },
                ]}
              />

              <LatencyChart
                title="Time to first token"
                description="Backend processing time compared with user-perceived frontend TTFT."
                data={chartData}
                isLoading={isLoadingTrends}
                error=""
                series={[
                  {
                    dataKey: "average_backend_ttft_ms",
                    name: "Backend TTFT",
                    color: "#38bdf8",
                  },
                  {
                    dataKey: "average_frontend_ttft_ms",
                    name: "Frontend TTFT",
                    color: "#f472b6",
                  },
                ]}
              />
            </div>

            <div className="grid gap-4 desktop:grid-cols-2">
              <LatencyChart
                title="Retrieval and generation"
                description="Average retrieval, reranking, and response-generation duration."
                data={chartData}
                isLoading={isLoadingTrends}
                error=""
                series={[
                  {
                    dataKey:
                      "average_retrieval_latency_ms",
                    name: "Retrieval",
                    color: "#38bdf8",
                  },
                  {
                    dataKey: "average_rerank_latency_ms",
                    name: "Reranking",
                    color: "#f59e0b",
                  },
                  {
                    dataKey:
                      "average_generation_latency_ms",
                    name: "Generation",
                    color: "#34d399",
                  },
                ]}
              />

              <ReliabilityChart
                data={chartData}
                isLoading={isLoadingTrends}
                error=""
              />
            </div>
          </section>

          <footer className="mt-12 border-t border-white/10 py-6">
            <p className="text-xs text-slate-600">
              Daily analytics use America/Detroit date
              boundaries.
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}