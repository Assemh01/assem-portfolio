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
import { AlertTriangle, Gauge, Loader2 } from "lucide-react";

const DEFAULT_COLORS = [
  "#a855f7",
  "#38bdf8",
  "#34d399",
  "#f59e0b",
  "#f472b6",
];

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

function formatDuration(milliseconds) {
  if (
    milliseconds === null ||
    milliseconds === undefined ||
    !Number.isFinite(Number(milliseconds))
  ) {
    return "No data";
  }

  const numericValue = Number(milliseconds);

  if (numericValue < 1000) {
    return `${Math.round(numericValue)} ms`;
  }

  return `${(numericValue / 1000).toFixed(2)} s`;
}

function formatYAxis(milliseconds) {
  const numericValue = Number(milliseconds);

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  if (numericValue >= 1000) {
    return `${(numericValue / 1000).toFixed(
      numericValue >= 10000 ? 0 : 1
    )}s`;
  }

  return `${Math.round(numericValue)}ms`;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const visibleEntries = payload.filter(
    (entry) =>
      entry.value !== null &&
      entry.value !== undefined &&
      Number.isFinite(Number(entry.value))
  );

  if (!visibleEntries.length) {
    return null;
  }

  return (
    <div className="min-w-[210px] rounded-xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
      <p className="text-xs font-medium text-slate-400">
        {formatDate(label)}
      </p>

      <div className="mt-2 space-y-2">
        {visibleEntries.map((entry) => (
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
              {formatDuration(entry.value)}
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
            Loading latency history…
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
            Could not load latency data
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
          <Gauge
            size={26}
            className="mx-auto text-slate-600"
          />

          <p className="mt-3 text-sm font-medium text-slate-300">
            No latency measurements
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-600">
            No timing measurements were recorded during this date range.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default function LatencyChart({
  data = [],
  series = [],
  title = "Latency",
  description = "Average daily latency measurements.",
  isLoading = false,
  error = "",
}) {
  const chartData = useMemo(
    () =>
      data.map((item) => {
        const normalizedItem = {
          ...item,
        };

        series.forEach(({ dataKey }) => {
          const value = item[dataKey];

          normalizedItem[dataKey] =
            value === null ||
            value === undefined ||
            !Number.isFinite(Number(value))
              ? null
              : Number(value);
        });

        return normalizedItem;
      }),
    [data, series]
  );

  const hasMeasurements = chartData.some((item) =>
    series.some(({ dataKey }) => item[dataKey] !== null)
  );

  const state = (
    <ChartState
      isLoading={isLoading}
      error={error}
      isEmpty={!chartData.length || !hasMeasurements}
    />
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/70 shadow-sm">
      <div className="border-b border-white/[0.06] px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">
              {title}
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>

          <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-300">
            <Gauge size={18} />
          </div>
        </div>
      </div>

      {isLoading ||
      error ||
      !chartData.length ||
      !hasMeasurements ? (
        state
      ) : (
        <div className="h-[340px] w-full px-2 pb-4 pt-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 18,
                left: -4,
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
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                tickLine={false}
                axisLine={false}
                minTickGap={28}
              />

              <YAxis
                tickFormatter={formatYAxis}
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                tickLine={false}
                axisLine={false}
                width={56}
                domain={[0, "auto"]}
              />

              <Tooltip
                content={<ChartTooltip />}
                cursor={{
                  stroke: "rgba(56, 189, 248, 0.25)",
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

              {series.map((item, index) => {
                const color =
                    item.color ||
                    DEFAULT_COLORS[index % DEFAULT_COLORS.length];

                const visiblePointCount = chartData.filter(
                    (dataPoint) =>
                    dataPoint[item.dataKey] !== null &&
                    dataPoint[item.dataKey] !== undefined
                ).length;

                return (
                    <Line
                    key={item.dataKey}
                    type="monotone"
                    dataKey={item.dataKey}
                    name={item.name}
                    stroke={color}
                    strokeWidth={2.5}
                    connectNulls={false}
                    dot={
                        visiblePointCount === 1
                        ? {
                            r: 4,
                            fill: color,
                            stroke: "#0f172a",
                            strokeWidth: 2,
                            }
                        : false
                    }
                    activeDot={{
                        r: 5,
                        fill: color,
                        stroke: "#0f172a",
                        strokeWidth: 2,
                    }}
                    />
                );
                })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}