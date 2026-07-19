import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, BarChart3, Loader2 } from "lucide-react";

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="min-w-[170px] rounded-xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
      <p className="text-xs font-medium text-slate-400">
        {formatDate(label)}
      </p>

      <div className="mt-2 space-y-2">
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-6"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />

              <span className="text-xs text-slate-400">
                {entry.name}
              </span>
            </div>

            <span className="text-sm font-semibold text-white">
              {new Intl.NumberFormat("en-US").format(
                Number(entry.value || 0)
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartState({ isLoading, error, isEmpty }) {
  if (isLoading) {
    return (
      <div className="flex h-[320px] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={24}
            className="mx-auto animate-spin text-purple-300"
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading chat activity…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[320px] items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <AlertTriangle
            size={25}
            className="mx-auto text-red-300"
          />

          <p className="mt-3 text-sm font-medium text-red-200">
            Could not load chat activity
          </p>

          <p className="mt-2 text-xs leading-5 text-red-300/70">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex h-[320px] items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <BarChart3
            size={26}
            className="mx-auto text-slate-600"
          />

          <p className="mt-3 text-sm font-medium text-slate-300">
            No chat activity
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-600">
            No chatbot requests were recorded during this date range.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default function ChatVolumeChart({
  data = [],
  isLoading = false,
  error = "",
}) {
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        chats: Number(item.chats || 0),
        conversations: Number(item.conversations || 0),
      })),
    [data]
  );

  const hasActivity = chartData.some(
    (item) => item.chats > 0 || item.conversations > 0
  );

  const state = (
    <ChartState
      isLoading={isLoading}
      error={error}
      isEmpty={!chartData.length || !hasActivity}
    />
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/70 shadow-sm">
      <div className="border-b border-white/[0.06] px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">
              Chat volume
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Daily chatbot requests and distinct conversation sessions.
            </p>
          </div>

          <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-300">
            <BarChart3 size={18} />
          </div>
        </div>
      </div>

      {isLoading || error || !chartData.length || !hasActivity ? (
        state
      ) : (
        <div className="h-[340px] w-full px-2 pb-4 pt-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 18,
                left: -12,
                bottom: 5,
              }}
            >
              <CartesianGrid
                stroke="rgba(148, 163, 184, 0.08)"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="rgba(148, 163, 184, 0.25)"
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                tickLine={false}
                axisLine={false}
                minTickGap={28}
              />

              <YAxis
                allowDecimals={false}
                domain={[0, "auto"]}
                stroke="rgba(148, 163, 184, 0.25)"
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                tickLine={false}
                axisLine={false}
                width={42}
              />

              <Tooltip
                content={<ChartTooltip />}
                cursor={{
                  stroke: "rgba(168, 85, 247, 0.3)",
                  strokeWidth: 1,
                }}
              />

              <Legend
                verticalAlign="top"
                align="right"
                height={36}
                iconType="circle"
                wrapperStyle={{
                  color: "#94a3b8",
                  fontSize: "12px",
                }}
              />

              <Line
                type="monotone"
                dataKey="chats"
                name="Chats"
                stroke="#a855f7"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "#a855f7",
                  stroke: "#0f172a",
                  strokeWidth: 2,
                }}
              />

              <Line
                type="monotone"
                dataKey="conversations"
                name="Conversations"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "#38bdf8",
                  stroke: "#0f172a",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}