import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  FileText,
  Gauge,
  Loader2,
  MessageSquare,
  Monitor,
  RefreshCw,
  Timer,
  X,
  Zap,
} from "lucide-react";

function formatDuration(milliseconds) {
  if (milliseconds === null || milliseconds === undefined) {
    return "—";
  }

  const numericValue = Number(milliseconds);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  if (numericValue < 1000) {
    return `${Math.round(numericValue)} ms`;
  }

  return `${(numericValue / 1000).toFixed(2)} s`;
}

function formatNumber(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

function formatTimestamp(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatScore(value, digits = 4) {
  if (value === null || value === undefined) {
    return "—";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  return numericValue.toFixed(digits);
}

function CopyButton({ value, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Could not copy value:", error);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!value}
      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-xs text-slate-400 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied" : label}
    </button>
  );
}

function StatusBadge({ status, cancelled }) {
  if (cancelled) {
    return (
      <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
        Cancelled
      </span>
    );
  }

  if (String(status).toLowerCase() === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
        <CheckCircle2 size={13} />
        Success
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-red-400/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300">
      {status || "Unknown"}
    </span>
  );
}

function BooleanBadge({ value, trueLabel = "Yes", falseLabel = "No" }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
        value
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
          : "border-white/10 bg-white/[0.03] text-slate-400",
      ].join(" ")}
    >
      {value ? trueLabel : falseLabel}
    </span>
  );
}

function InfoField({ label, value, copyable = false, mono = false }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <div className="mt-2 flex min-w-0 items-center justify-between gap-3">
        <p
          title={value ? String(value) : ""}
          className={[
            "min-w-0 break-all text-sm text-slate-300",
            mono ? "font-mono text-xs" : "",
          ].join(" ")}
        >
          {value ?? "—"}
        </p>

        {copyable && value && <CopyButton value={value} label="" />}
      </div>
    </div>
  );
}

function PerformanceMetric({
  title,
  value,
  icon: Icon,
  description,
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-xl font-semibold text-white">
            {formatDuration(value)}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-slate-400">
          <Icon size={17} />
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-5 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function ChunkCard({ chunk, index, type }) {
  const displayRank =
    type === "reranked"
      ? chunk.final_rank ?? index + 1
      : chunk.original_rank ?? index + 1;

  return (
    <details className="group rounded-xl border border-white/[0.07] bg-white/[0.02]">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md bg-purple-500/10 px-1.5 text-xs font-medium text-purple-300">
              #{displayRank}
            </span>

            <p className="truncate text-sm font-medium text-slate-200">
              {chunk.section_title || "Untitled chunk"}
            </p>
          </div>

          <p className="mt-2 text-xs text-slate-600">
            {chunk.source_file || "Unknown source"}
            {chunk.category ? ` · ${chunk.category}` : ""}
          </p>
        </div>

        <div className="shrink-0 text-right">
          {type === "reranked" && (
            <p className="text-xs text-slate-500">
              Score: {formatScore(chunk.rerank_score, 6)}
            </p>
          )}

          <p className="mt-1 text-xs text-slate-600">
            Distance: {formatScore(chunk.distance)}
          </p>
        </div>
      </summary>

      <div className="border-t border-white/[0.06] px-4 py-4">
        <div className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-400">
          {chunk.text_preview || "No chunk text stored."}
        </div>

        {chunk.metadata &&
          Object.keys(chunk.metadata).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(chunk.metadata).map(([key, value]) => (
                <span
                  key={key}
                  className="rounded-lg border border-white/[0.06] bg-slate-950 px-2 py-1 text-[10px] text-slate-500"
                >
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          )}
      </div>
    </details>
  );
}

function OverviewTab({ details }) {
  const request = details.request || {};
  const prompt = details.prompt || {};
  const assistant = details.assistant || {};
  const backend = details.performance?.backend || {};
  const frontend = details.performance?.frontend || {};
  const client = details.client || {};

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              User question
            </h3>

            <p className="mt-1 text-xs text-slate-600">
              The prompt received by the chatbot.
            </p>
          </div>

          <CopyButton value={prompt.user_question} />
        </div>

        <div className="mt-3 rounded-xl border border-white/[0.06] bg-[#0d1422] p-4">
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
            {prompt.user_question || "No question stored."}
          </p>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Assistant response
            </h3>

            <p className="mt-1 text-xs text-slate-600">
              {formatNumber(assistant.response_length)} characters ·{" "}
              {assistant.model_used || "Unknown model"}
            </p>
          </div>

          <CopyButton value={assistant.full_response} />
        </div>

        <div className="mt-3 max-h-[480px] overflow-y-auto rounded-xl border border-white/[0.045] bg-[#0b111d] p-4">
          <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
            {assistant.full_response || "No response stored."}
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-white">
          Request identity
        </h3>

        <div className="mt-3 grid gap-3 tablet:grid-cols-2">
          <InfoField
            label="Request ID"
            value={request.request_id}
            copyable
            mono
          />

          <InfoField
            label="Conversation ID"
            value={request.conversation_id}
            copyable
            mono
          />

          <InfoField
            label="Visitor ID"
            value={request.visitor_id}
            copyable
            mono
          />

          <InfoField
            label="Message ID"
            value={request.message_id}
            copyable
            mono
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-white">
          Backend performance
        </h3>

        <div className="mt-3 grid gap-3 tablet:grid-cols-2 desktop:grid-cols-3">
          <PerformanceMetric
            title="Total latency"
            value={backend.total_latency_ms}
            icon={Clock}
            description="Full backend request duration."
          />

          <PerformanceMetric
            title="Retrieval total"
            value={backend.retrieval_total_ms}
            icon={Database}
            description="Combined retrieval and reranking work."
          />

          <PerformanceMetric
            title="Vector retrieval"
            value={backend.vector_retrieval_ms}
            icon={Database}
            description="Primary semantic vector retrieval."
          />

          <PerformanceMetric
            title="Fallback retrieval"
            value={backend.fallback_retrieval_ms}
            icon={RefreshCw}
            description="Additional fallback retrieval duration."
          />

          <PerformanceMetric
            title="Reranking"
            value={backend.reranking_ms}
            icon={Gauge}
            description="Cross-encoder reranking duration."
          />

          <PerformanceMetric
            title="Generation"
            value={backend.generation_ms}
            icon={Zap}
            description="Assistant response generation time."
          />

          <PerformanceMetric
            title="Backend TTFT"
            value={backend.ttft_ms}
            icon={Timer}
            description="Backend time to first generated token."
          />

          <PerformanceMetric
            title="Frontend TTFT"
            value={frontend.frontend_ttft_ms}
            icon={Activity}
            description="User-perceived time to first token."
          />

          <PerformanceMetric
            title="Stream completion"
            value={frontend.stream_completion_ms}
            icon={Activity}
            description="Total user-perceived stream duration."
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-white">
          Client and request settings
        </h3>

        <div className="mt-3 grid gap-3 tablet:grid-cols-2 desktop:grid-cols-3">
          <InfoField label="Browser" value={client.browser} />

          <InfoField label="Device" value={client.device} />

          <InfoField
            label="Screen"
            value={
              client.screen_width && client.screen_height
                ? `${client.screen_width} × ${client.screen_height}`
                : "—"
            }
          />

          <InfoField
            label="Timestamp"
            value={formatTimestamp(request.timestamp)}
          />

          <InfoField
            label="Streaming"
            value={request.streaming_enabled ? "Enabled" : "Disabled"}
          />

          <InfoField
            label="Stream cancelled"
            value={request.stream_cancelled ? "Yes" : "No"}
          />
        </div>
      </section>
    </div>
  );
}

function RetrievalTab({ details }) {
  const retrieval = details.retrieval || {};
  const retrievedChunks = retrieval.retrieved_chunks || [];
  const rerankedChunks = retrieval.reranked_chunks || [];

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-white">
          Retrieval configuration
        </h3>

        <div className="mt-3 flex flex-wrap gap-3">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              Forced context
            </p>

            <div className="mt-2">
              <BooleanBadge value={retrieval.used_forced_context} />
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              Project query
            </p>

            <div className="mt-2">
              <BooleanBadge value={retrieval.project_query} />
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              Fallback retrieval
            </p>

            <div className="mt-2">
              <BooleanBadge value={retrieval.fallback_retrieval_used} />
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              Reranking
            </p>

            <div className="mt-2">
              <BooleanBadge value={retrieval.reranking_enabled} />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-2 tablet:flex-row tablet:items-end tablet:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Reranked chunks
            </h3>

            <p className="mt-1 text-xs text-slate-600">
              Final chunk order passed toward generation.
            </p>
          </div>

          <p className="text-xs text-slate-500">
            {formatNumber(
              retrieval.reranked_chunk_count ?? rerankedChunks.length
            )}{" "}
            chunks
          </p>
        </div>

        <div className="mt-3 space-y-3">
          {rerankedChunks.length > 0 ? (
            rerankedChunks.map((chunk, index) => (
              <ChunkCard
                key={`reranked-${index}`}
                chunk={chunk}
                index={index}
                type="reranked"
              />
            ))
          ) : (
            <p className="rounded-xl border border-white/[0.07] p-4 text-sm text-slate-500">
              No reranked chunk data was recorded.
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-2 tablet:flex-row tablet:items-end tablet:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Initially retrieved chunks
            </h3>

            <p className="mt-1 text-xs text-slate-600">
              Original vector-search order before reranking.
            </p>
          </div>

          <p className="text-xs text-slate-500">
            {formatNumber(
              retrieval.retrieved_chunk_count ?? retrievedChunks.length
            )}{" "}
            chunks
          </p>
        </div>

        <div className="mt-3 space-y-3">
          {retrievedChunks.length > 0 ? (
            retrievedChunks.map((chunk, index) => (
              <ChunkCard
                key={`retrieved-${index}`}
                chunk={chunk}
                index={index}
                type="retrieved"
              />
            ))
          ) : (
            <p className="rounded-xl border border-white/[0.07] p-4 text-sm text-slate-500">
              No retrieved chunk data was recorded.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function EventsTab({ details }) {
  const events = details.performance?.frontend?.events || [];
  const errors = details.errors || [];

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Frontend events
            </h3>

            <p className="mt-1 text-xs text-slate-600">
              Timeline recorded during response streaming.
            </p>
          </div>

          <p className="text-xs text-slate-500">
            {formatNumber(events.length)} events
          </p>
        </div>

        <div className="mt-3 space-y-3">
          {events.length > 0 ? (
            events.map((event, index) => (
              <div
                key={`${event.event_name}-${index}`}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
              >
                <div className="flex flex-col gap-2 tablet:flex-row tablet:items-start tablet:justify-between">
                  <div>
                    <p className="font-mono text-xs font-medium text-purple-300">
                      {event.event_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      {formatTimestamp(event.timestamp)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs tablet:grid-cols-3">
                    <div>
                      <p className="text-slate-600">TTFT</p>
                      <p className="mt-1 text-slate-300">
                        {formatDuration(event.time_to_first_token_ms)}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-600">First response</p>
                      <p className="mt-1 text-slate-300">
                        {formatDuration(event.time_to_first_response_ms)}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-600">Completion</p>
                      <p className="mt-1 text-slate-300">
                        {formatDuration(event.stream_completion_ms)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-white/[0.07] p-4 text-sm text-slate-500">
              No frontend events were recorded.
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Recorded errors
            </h3>

            <p className="mt-1 text-xs text-slate-600">
              Errors associated with this request.
            </p>
          </div>

          <p className="text-xs text-slate-500">
            {formatNumber(errors.length)} errors
          </p>
        </div>

        <div className="mt-3 space-y-3">
          {errors.length > 0 ? (
            errors.map((error, index) => (
              <div
                key={`${error.type}-${index}`}
                className="rounded-xl border border-red-400/20 bg-red-500/[0.06] p-4"
              >
                <div className="flex gap-3">
                  <AlertTriangle
                    size={17}
                    className="mt-0.5 shrink-0 text-red-300"
                  />

                  <div>
                    <p className="text-sm font-medium text-red-200">
                      {error.type || "Unknown error"}
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-red-300/80">
                      {error.message || "No error message recorded."}
                    </p>

                    <p className="mt-3 text-[11px] text-red-300/50">
                      {error.endpoint || "Unknown endpoint"} ·{" "}
                      {formatTimestamp(error.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.04] p-4">
              <CheckCircle2
                size={17}
                className="shrink-0 text-emerald-300"
              />

              <p className="text-sm text-emerald-200">
                No errors were recorded for this request.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function ConversationDetailsDrawer({
  requestId,
  onClose,
}) {
  const router = useRouter();

  const [details, setDetails] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isOpen = Boolean(requestId);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!requestId) {
      setDetails(null);
      setError("");
      return undefined;
    }

    const controller = new AbortController();

    async function loadDetails() {
      setIsLoading(true);
      setError("");
      setDetails(null);
      setActiveTab("overview");

      try {
        const response = await fetch(
          `/api/admin/conversations/${encodeURIComponent(requestId)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          }
        );

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error(
            `Conversation details returned ${response.status} instead of JSON.`
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
              "Unable to load conversation details."
          );
        }

        setDetails(data);
      } catch (requestError) {
        if (requestError.name === "AbortError") {
          return;
        }

        console.error(
          "Failed to load conversation details:",
          requestError
        );

        setError(
          requestError.message ||
            "Something went wrong while loading this request."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadDetails();

    return () => {
      controller.abort();
    };
  }, [requestId, router]);

  const title = useMemo(() => {
    const question = details?.prompt?.user_question;

    if (!question) {
      return "Conversation details";
    }

    return question.length > 70
      ? `${question.slice(0, 70)}…`
      : question;
  }, [details]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Conversation details"
        className="absolute inset-y-0 right-0 flex w-full flex-col border-l border-white/[0.06] bg-[#080d18] shadow-2xl tablet:max-w-[820px] desktop:max-w-[920px]"
      >
        <header className="shrink-0 border-b border-white/[0.06] bg-[#080d18]/95 px-5 py-5 tablet:px-7">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-purple-300">
                Request inspection
              </p>

              <h2 className="mt-2 truncate text-xl font-semibold text-white">
                {title}
              </h2>

              {details?.request && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <StatusBadge
                    status={details.request.status}
                    cancelled={details.request.stream_cancelled}
                  />

                  <p className="text-xs text-slate-500">
                    {formatTimestamp(details.request.timestamp)}
                  </p>

                  <p
                    className="font-mono text-xs text-slate-600"
                    title={details.request.request_id}
                  >
                    {details.request.request_id}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close conversation details"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:border-white/20 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {details && (
            <nav className="mt-5 flex gap-1 overflow-x-auto rounded-xl border border-white/[0.045] bg-black/15 p-1">
              {[
                {
                  value: "overview",
                  label: "Overview",
                  icon: MessageSquare,
                },
                {
                  value: "retrieval",
                  label: "Retrieval",
                  icon: Database,
                },
                {
                  value: "events",
                  label: "Events & errors",
                  icon: Activity,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;

                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    className={[
                      "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium transition",
                      isActive
                        ? "bg-purple-500/15 text-purple-200"
                        : "text-slate-500 hover:bg-white/5 hover:text-slate-200",
                    ].join(" ")}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 tablet:px-7">
          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <Loader2
                  size={25}
                  className="mx-auto animate-spin text-purple-300"
                />

                <p className="mt-4 text-sm text-slate-500">
                  Loading request details…
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-400/20 bg-red-500/[0.06] p-5">
              <div className="flex gap-3">
                <AlertTriangle
                  size={19}
                  className="mt-0.5 shrink-0 text-red-300"
                />

                <div>
                  <p className="text-sm font-medium text-red-200">
                    Could not load request details
                  </p>

                  <p className="mt-2 text-xs leading-5 text-red-300/80">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          ) : details ? (
            <>
              {activeTab === "overview" && (
                <OverviewTab details={details} />
              )}

              {activeTab === "retrieval" && (
                <RetrievalTab details={details} />
              )}

              {activeTab === "events" && (
                <EventsTab details={details} />
              )}
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}