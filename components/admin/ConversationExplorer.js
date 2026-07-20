import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";
import ConversationDetailsDrawer from "./ConversationDetailsDrawer";

const SORT_OPTIONS = [
  {
    value: "timestamp",
    label: "Timestamp",
  },
  {
    value: "latency",
    label: "Latency",
  },
  {
    value: "status",
    label: "Status",
  },
  {
    value: "visitor_id",
    label: "Visitor",
  },
  {
    value: "conversation_id",
    label: "Conversation",
  },
  {
    value: "question",
    label: "Question",
  },
  {
    value: "response_length",
    label: "Response length",
  },
];

const EMPTY_FILTERS = {
  status: "",
  date_from: "",
  date_to: "",
  visitor_id: "",
  conversation_id: "",
  device: "",
  browser: "",
  streaming: "",
};

const FILTER_LABELS = {
  status: "Status",
  date_from: "From",
  date_to: "To",
  visitor_id: "Visitor",
  conversation_id: "Conversation",
  device: "Device",
  browser: "Browser",
  streaming: "Request type",
};

const FILTER_VALUE_LABELS = {
  success: "Success",
  failed: "Failed",
  cancelled: "Cancelled",
  streaming: "Streaming",
  non_streaming: "Non-streaming",
};

const VALID_SORT_FIELDS = new Set(
  SORT_OPTIONS.map((option) => option.value)
);

const VALID_SORT_DIRECTIONS = new Set([
  "asc",
  "desc",
]);

const VALID_STATUSES = new Set([
  "success",
  "failed",
  "cancelled",
]);

const VALID_STREAMING_FILTERS = new Set([
  "streaming",
  "non_streaming",
]);

const ALLOWED_PAGE_SIZES = new Set([
  10,
  25,
  50,
  100,
]);

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function getSingleQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function getCleanQueryString(value, maximumLength = 300) {
  const queryValue = getSingleQueryValue(value);

  if (typeof queryValue !== "string") {
    return "";
  }

  return queryValue.trim().slice(0, maximumLength);
}

function getPositiveQueryInteger(value, fallback) {
  const parsedValue = Number.parseInt(
    getSingleQueryValue(value),
    10
  );

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
}

function readExplorerUrlState(query) {
  const requestedPageSize = getPositiveQueryInteger(
    query.page_size,
    25
  );

  const requestedSortBy = getCleanQueryString(
    query.sort_by,
    50
  );

  const requestedSortDirection = getCleanQueryString(
    query.sort_direction,
    10
  );

  const requestedStatus = getCleanQueryString(
    query.status,
    20
  );

  const requestedStreaming = getCleanQueryString(
    query.streaming,
    30
  );

  const requestedDateFrom = getCleanQueryString(
    query.date_from,
    10
  );

  const requestedDateTo = getCleanQueryString(
    query.date_to,
    10
  );

  return {
    page: getPositiveQueryInteger(query.page, 1),

    pageSize: ALLOWED_PAGE_SIZES.has(requestedPageSize)
      ? requestedPageSize
      : 25,

    search: getCleanQueryString(query.search, 300),

    sortBy: VALID_SORT_FIELDS.has(requestedSortBy)
      ? requestedSortBy
      : "timestamp",

    sortDirection: VALID_SORT_DIRECTIONS.has(
      requestedSortDirection
    )
      ? requestedSortDirection
      : "desc",

    filters: {
      status: VALID_STATUSES.has(requestedStatus)
        ? requestedStatus
        : "",

      date_from: DATE_PATTERN.test(requestedDateFrom)
        ? requestedDateFrom
        : "",

      date_to: DATE_PATTERN.test(requestedDateTo)
        ? requestedDateTo
        : "",

      visitor_id: getCleanQueryString(
        query.visitor_id,
        100
      ),

      conversation_id: getCleanQueryString(
        query.conversation_id,
        100
      ),

      device: getCleanQueryString(query.device, 100),
      browser: getCleanQueryString(query.browser, 100),

      streaming: VALID_STREAMING_FILTERS.has(
        requestedStreaming
      )
        ? requestedStreaming
        : "",
    },
  };
}

function buildExplorerPath(pathname, explorerState) {
  const queryParameters = new URLSearchParams();

  if (explorerState.page > 1) {
    queryParameters.set(
      "page",
      String(explorerState.page)
    );
  }

  if (explorerState.pageSize !== 25) {
    queryParameters.set(
      "page_size",
      String(explorerState.pageSize)
    );
  }

  if (explorerState.search) {
    queryParameters.set(
      "search",
      explorerState.search
    );
  }

  if (explorerState.sortBy !== "timestamp") {
    queryParameters.set(
      "sort_by",
      explorerState.sortBy
    );
  }

  if (explorerState.sortDirection !== "desc") {
    queryParameters.set(
      "sort_direction",
      explorerState.sortDirection
    );
  }

  Object.entries(explorerState.filters).forEach(
    ([key, value]) => {
      if (value) {
        queryParameters.set(key, value);
      }
    }
  );

  const queryString = queryParameters.toString();

  return queryString
    ? `${pathname}?${queryString}`
    : pathname;
}

function areFiltersEqual(firstFilters, secondFilters) {
  return Object.keys(EMPTY_FILTERS).every(
    (key) => firstFilters[key] === secondFilters[key]
  );
}

function formatTimestamp(value) {
  if (!value) {
    return {
      date: "—",
      time: "",
    };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      date: "—",
      time: "",
    };
  }

  return {
    date: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() === new Date().getFullYear()
          ? undefined
          : "numeric",
    }).format(date),

    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(date),
  };
}

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

function shortenId(value) {
  if (!value) {
    return "—";
  }

  if (value.length <= 16) {
    return value;
  }

  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function getStatusMetadata(item) {
  if (item.stream_cancelled) {
    return {
      label: "Cancelled",
      className:
        "border-amber-400/20 bg-amber-500/10 text-amber-300",
    };
  }

  const normalizedStatus = String(item.status || "").toLowerCase();

  if (
    normalizedStatus === "success" ||
    normalizedStatus === "completed"
  ) {
    return {
      label: "Success",
      className:
        "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
    };
  }

  if (
    normalizedStatus === "error" ||
    normalizedStatus === "failed" ||
    normalizedStatus === "failure"
  ) {
    return {
      label: normalizedStatus === "failed" ? "Failed" : "Error",
      className: "border-red-400/20 bg-red-500/10 text-red-300",
    };
  }

  return {
    label: item.status || "Unknown",
    className: "border-white/10 bg-white/5 text-slate-300",
  };
}

function StatusBadge({ item }) {
  const status = getStatusMetadata(item);

  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1",
        "text-xs font-medium",
        status.className,
      ].join(" ")}
    >
      {status.label}
    </span>
  );
}

function ConversationSkeleton() {
  return (
    <div className="divide-y divide-white/5">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="grid animate-pulse gap-4 px-5 py-5 laptop:grid-cols-[130px_180px_minmax(320px,1fr)_110px_100px_150px]"
        >
          <div className="h-4 rounded bg-white/5" />
          <div className="h-4 rounded bg-white/5" />
          <div className="h-4 rounded bg-white/5" />
          <div className="h-4 rounded bg-white/5" />
          <div className="h-4 rounded bg-white/5" />
          <div className="h-4 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

function DesktopTable({ conversations, onSelect }) {
    return (
    <div className="hidden overflow-x-auto laptop:block">
      <table className="min-w-full table-fixed">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02]">
            <th className="w-[130px] px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Time
            </th>

            <th className="w-[180px] px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              User
            </th>

            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Question and response
            </th>

            <th className="w-[110px] px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Status
            </th>

            <th className="w-[100px] px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Latency
            </th>

            <th className="w-[150px] px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Client
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-white/5">
          {conversations.map((conversation) => {
            const timestamp = formatTimestamp(conversation.timestamp);

            return (
              <tr
                key={conversation.request_id}
                tabIndex={0}
                onClick={() => onSelect(conversation.request_id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(conversation.request_id);
                  }
                }}
                className="cursor-pointer transition hover:bg-white/[0.035] focus:bg-white/[0.035] focus:outline-none"
              >
                <td className="px-5 py-4 align-top">
                  <p className="text-sm font-medium text-slate-300">
                    {timestamp.date}
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    {timestamp.time}
                  </p>
                </td>

                <td className="px-5 py-4 align-top">
                  <div title={conversation.visitor_id || ""}>
                    <p className="font-mono text-xs text-purple-300">
                      {shortenId(conversation.visitor_id)}
                    </p>
                  </div>

                  <div
                    className="mt-1"
                    title={conversation.conversation_id || ""}
                  >
                    <p className="font-mono text-xs text-slate-600">
                      {shortenId(conversation.conversation_id)}
                    </p>
                  </div>
                </td>

                <td className="px-5 py-4 align-top">
                  <p
                    className="truncate text-sm font-medium text-slate-200"
                    title={conversation.question || ""}
                  >
                    {conversation.question || "No question recorded"}
                  </p>

                  <p
                    className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500"
                    title={conversation.response_preview || ""}
                  >
                    {conversation.response_preview ||
                      "No assistant response stored."}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-600">
                    <span>
                      {formatNumber(conversation.response_length)} chars
                    </span>

                    <span>
                      {conversation.streaming_enabled
                        ? "Streaming"
                        : "Non-streaming"}
                    </span>

                    <span
                      className="font-mono"
                      title={conversation.request_id || ""}
                    >
                      {shortenId(conversation.request_id)}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-4 align-top">
                  <StatusBadge item={conversation} />
                </td>

                <td className="px-5 py-4 align-top">
                  <p className="text-sm font-medium text-slate-300">
                    {formatDuration(conversation.total_latency_ms)}
                  </p>
                </td>

                <td className="px-5 py-4 align-top">
                  <p className="text-sm text-slate-300">
                    {conversation.device || "Unknown"}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-600">
                    {conversation.browser || "Unknown browser"}
                  </p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MobileConversationList({ conversations, onSelect }) {
  return (
    <div className="divide-y divide-white/5 laptop:hidden">
      {conversations.map((conversation) => {
        const timestamp = formatTimestamp(conversation.timestamp);

        return (
          <article
            key={conversation.request_id}
            tabIndex={0}
            onClick={() => onSelect(conversation.request_id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(conversation.request_id);
              }
            }}
            className="cursor-pointer space-y-4 p-5 transition hover:bg-white/[0.025] focus:bg-white/[0.025] focus:outline-none"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-300">
                  {timestamp.date}
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  {timestamp.time}
                </p>
              </div>

              <StatusBadge item={conversation} />
            </div>

            <div>
              <p className="text-sm font-medium leading-6 text-slate-200">
                {conversation.question || "No question recorded"}
              </p>

              <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">
                {conversation.response_preview ||
                  "No assistant response stored."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl bg-white/[0.025] p-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                  Visitor
                </p>

                <p
                  className="mt-1 font-mono text-xs text-purple-300"
                  title={conversation.visitor_id || ""}
                >
                  {shortenId(conversation.visitor_id)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                  Latency
                </p>

                <p className="mt-1 text-xs text-slate-300">
                  {formatDuration(conversation.total_latency_ms)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                  Device
                </p>

                <p className="mt-1 text-xs text-slate-300">
                  {conversation.device || "Unknown"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                  Browser
                </p>

                <p className="mt-1 truncate text-xs text-slate-300">
                  {conversation.browser || "Unknown"}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default function ConversationExplorer() {
  const router = useRouter();

  const [conversations, setConversations] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 25,
    total_items: 0,
    total_pages: 0,
    has_previous: false,
    has_next: false,
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] = useState("timestamp");
  const [sortDirection, setSortDirection] = useState("desc");

  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
  });
  const [filterDraft, setFilterDraft] = useState({
    ...EMPTY_FILTERS,
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [refreshVersion, setRefreshVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const [isUrlStateReady, setIsUrlStateReady] =
    useState(false);

  const isApplyingUrlStateRef = useRef(false);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const urlState = readExplorerUrlState(
      router.query
    );

    isApplyingUrlStateRef.current = true;

    setPage(urlState.page);
    setPageSize(urlState.pageSize);

    setSearchInput(urlState.search);
    setSearch(urlState.search);

    setSortBy(urlState.sortBy);
    setSortDirection(urlState.sortDirection);

    setFilters((currentFilters) =>
      areFiltersEqual(currentFilters, urlState.filters)
        ? currentFilters
        : {
            ...urlState.filters,
          }
    );

    setFilterDraft((currentFilters) =>
      areFiltersEqual(currentFilters, urlState.filters)
        ? currentFilters
        : {
            ...urlState.filters,
          }
    );

    setIsFiltersOpen(
      Object.values(urlState.filters).some(Boolean)
    );

    setIsUrlStateReady(true);

    const canonicalPath = buildExplorerPath(
      router.pathname,
      urlState
    );

    if (router.asPath !== canonicalPath) {
      void router.replace(
        canonicalPath,
        undefined,
        {
          shallow: true,
          scroll: false,
        }
      );
    }
  }, [router]);

  useEffect(() => {
    if (!isUrlStateReady) {
      return;
    }

    const normalizedSearch = searchInput.trim();

    if (normalizedSearch === search) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setSearch(normalizedSearch);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    isUrlStateReady,
    search,
    searchInput,
  ]);

  const loadConversations = useCallback(
    async (signal) => {
      setError("");
      setIsLoading(true);

      const queryParameters = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        sort_by: sortBy,
        sort_direction: sortDirection,
      });

      if (search) {
        queryParameters.set("search", search);
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParameters.set(key, value);
        }
      });

      try {
        const response = await fetch(
          `/api/admin/conversations?${queryParameters.toString()}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal,
          }
        );

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error(
            `Conversation API returned ${response.status} instead of JSON.`
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
              "Unable to load conversations."
          );
        }

        setConversations(data.items || []);
        setPagination(data.pagination);

        if (
          data.pagination.total_pages > 0 &&
          page > data.pagination.total_pages
        ) {
          setPage(data.pagination.total_pages);
        }
      } catch (requestError) {
        if (requestError.name === "AbortError") {
          return;
        }

        console.error(
          "Failed to load conversation explorer:",
          requestError
        );

        setError(
          requestError.message ||
            "Something went wrong while loading conversations."
        );
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [
      filters,
      page,
      pageSize,
      router,
      search,
      sortBy,
      sortDirection,
    ]
  );

  useEffect(() => {
    if (!isUrlStateReady) {
      return;
    }

    const controller = new AbortController();

    void loadConversations(controller.signal);

    return () => {
      controller.abort();
    };
  }, [
    isUrlStateReady,
    loadConversations,
    refreshVersion,
  ]);

  useEffect(() => {
    if (!router.isReady || !isUrlStateReady) {
      return;
    }

    if (isApplyingUrlStateRef.current) {
      isApplyingUrlStateRef.current = false;
      return;
    }

    const nextPath = buildExplorerPath(
      router.pathname,
      {
        page,
        pageSize,
        search,
        sortBy,
        sortDirection,
        filters,
      }
    );

    if (nextPath === router.asPath) {
      return;
    }

    void router.replace(
      nextPath,
      undefined,
      {
        shallow: true,
        scroll: false,
      }
    );
  }, [
    filters,
    isUrlStateReady,
    page,
    pageSize,
    router,
    search,
    sortBy,
    sortDirection,
  ]);

  const visibleRange = useMemo(() => {
    if (!pagination.total_items) {
      return {
        start: 0,
        end: 0,
      };
    }

    return {
      start:
        (pagination.page - 1) * pagination.page_size + 1,

      end: Math.min(
        pagination.page * pagination.page_size,
        pagination.total_items
      ),
    };
  }, [pagination]);

  function handleSortChange(event) {
    setSortBy(event.target.value);
    setPage(1);
  }

  function toggleSortDirection() {
    setSortDirection((currentDirection) =>
      currentDirection === "desc" ? "asc" : "desc"
    );

    setPage(1);
  }

  function handlePageSizeChange(event) {
    setPageSize(Number(event.target.value));
    setPage(1);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }
  const activeFilters = useMemo(
  () =>
    Object.entries(filters)
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => ({
        key,
        label: FILTER_LABELS[key] || key,
        value: FILTER_VALUE_LABELS[value] || value,
      })),
  [filters]
);

const hasActiveFilters = activeFilters.length > 0;

function updateFilterDraft(key, value) {
  setFilterDraft((currentFilters) => ({
    ...currentFilters,
    [key]: value,
  }));
}

function applyFilters(event) {
  event.preventDefault();

  const normalizedFilters = Object.fromEntries(
    Object.entries(filterDraft).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ])
  );

  if (
    normalizedFilters.date_from &&
    normalizedFilters.date_to &&
    normalizedFilters.date_from > normalizedFilters.date_to
  ) {
    setError("The start date cannot be later than the end date.");
    return;
  }

  setError("");
  setFilters(normalizedFilters);
  setPage(1);
}

function removeFilter(filterKey) {
  setFilters((currentFilters) => ({
    ...currentFilters,
    [filterKey]: "",
  }));

  setFilterDraft((currentFilters) => ({
    ...currentFilters,
    [filterKey]: "",
  }));

  setPage(1);
}

function clearFilters() {
  setFilters({
    ...EMPTY_FILTERS,
  });

  setFilterDraft({
    ...EMPTY_FILTERS,
  });

  setPage(1);
}
  const hasSearchOrFilters =
    Boolean(search) || hasActiveFilters;

  return (
  <>
    <section className="mt-8">
      <div className="flex flex-col gap-4 tablet:flex-row tablet:items-end tablet:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Conversation Explorer
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Review questions, responses, visitors, and request
            performance.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          {formatNumber(pagination.total_items)} recorded requests
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50">
        <div className="grid gap-3 border-b border-white/10 p-4 laptop:grid-cols-[minmax(260px,1fr)_190px_auto_auto_auto]">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search questions, responses, visitors, IDs…"
              className="h-11 w-full appearance-none rounded-xl border border-white/10 !bg-[#0b1220] py-2 pl-10 pr-10 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/50 focus:ring-2 focus:ring-purple-500/10"
            />

            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={handleSortChange}
            aria-label="Sort conversations by"
            className="h-11 rounded-xl border border-white/10 !bg-[#0b1220] px-3 text-sm text-slate-300 outline-none transition focus:border-purple-400/50 focus:ring-2 focus:ring-purple-500/10"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                Sort: {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={toggleSortDirection}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-slate-300 transition hover:border-purple-400/40 hover:text-white"
          >
            {sortDirection === "desc" ? (
              <ArrowDown size={16} />
            ) : (
              <ArrowUp size={16} />
            )}

            {sortDirection === "desc" ? "Descending" : "Ascending"}
          </button>

          <button
            type="button"
            onClick={() =>
              setIsFiltersOpen((currentValue) => !currentValue)
            }
            aria-expanded={isFiltersOpen}
            className={[
              "inline-flex h-11 items-center justify-center rounded-xl border px-4",
              "text-sm font-medium transition",
              hasActiveFilters
                ? "border-purple-400/30 bg-purple-500/10 text-purple-200"
                : "border-white/10 bg-slate-950 text-slate-300 hover:border-purple-400/40 hover:text-white",
            ].join(" ")}
          >
            Filters
            {hasActiveFilters
              ? ` (${activeFilters.length})`
              : ""}
          </button>

          <button
            type="button"
            onClick={() =>
              setRefreshVersion((currentValue) => currentValue + 1)
            }
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 text-sm font-medium text-slate-300 transition hover:border-purple-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={isLoading ? "animate-spin" : ""}
            />

            Refresh
          </button>
        </div>
        {isFiltersOpen && (
  <form
    onSubmit={applyFilters}
    className="border-b border-white/10 bg-slate-950/35 p-4"
  >
    <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-4">
      <label className="block">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Status
        </span>

        <select
          value={filterDraft.status}
          onChange={(event) =>
            updateFilterDraft("status", event.target.value)
          }
          className="h-11 w-full rounded-xl border border-white/[0.12] !bg-[#0b1220] px-3 text-sm text-slate-200 outline-none focus:border-purple-400/50"
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Request type
        </span>

        <select
          value={filterDraft.streaming}
          onChange={(event) =>
            updateFilterDraft(
              "streaming",
              event.target.value
            )
          }
          className="h-11 w-full rounded-xl border border-white/10 !bg-[#0b1220] px-3 text-sm text-slate-300 outline-none focus:border-purple-400/50"
        >
          <option value="">All request types</option>
          <option value="streaming">Streaming</option>
          <option value="non_streaming">
            Non-streaming
          </option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Date from
        </span>

        <input
          type="date"
          value={filterDraft.date_from}
          onChange={(event) =>
            updateFilterDraft(
              "date_from",
              event.target.value
            )
          }
          className="h-11 w-full rounded-xl border border-white/10 !bg-[#0b1220] px-3 text-sm text-slate-300 outline-none focus:border-purple-400/50"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Date to
        </span>

        <input
          type="date"
          value={filterDraft.date_to}
          onChange={(event) =>
            updateFilterDraft(
              "date_to",
              event.target.value
            )
          }
          className="h-11 w-full rounded-xl border border-white/10 !bg-[#0b1220] px-3 text-sm text-slate-300 outline-none focus:border-purple-400/50"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Device
        </span>

        <input
          type="text"
          value={filterDraft.device}
          onChange={(event) =>
            updateFilterDraft("device", event.target.value)
          }
          placeholder="Desktop, Mobile…"
          className="h-11 w-full rounded-xl border border-white/[0.12] !bg-[#0b1220] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-400/50"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Browser
        </span>

        <input
          type="text"
          value={filterDraft.browser}
          onChange={(event) =>
            updateFilterDraft(
              "browser",
              event.target.value
            )
          }
          placeholder="Chrome, Safari…"
          className="h-11 w-full rounded-xl border border-white/10 !bg-[#0b1220] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-400/50"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Visitor ID
        </span>

        <input
          type="text"
          value={filterDraft.visitor_id}
          onChange={(event) =>
            updateFilterDraft(
              "visitor_id",
              event.target.value
            )
          }
          placeholder="Exact visitor ID"
          className="h-11 w-full rounded-xl border border-white/[0.12] !bg-[#0b1220] px-3 font-mono text-sm text-white outline-none placeholder:font-sans placeholder:text-slate-500 focus:border-purple-400/50"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Conversation ID
        </span>

        <input
          type="text"
          value={filterDraft.conversation_id}
          onChange={(event) =>
            updateFilterDraft(
              "conversation_id",
              event.target.value
            )
          }
          placeholder="Exact conversation ID"
          className="h-11 w-full rounded-xl border border-white/[0.12] !bg-[#0b1220] px-3 font-mono text-sm text-white outline-none placeholder:font-sans placeholder:text-slate-500 focus:border-purple-400/50"
        />
      </label>
    </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={clearFilters}
                disabled={
                  !hasActiveFilters &&
                  !Object.values(filterDraft).some(Boolean)
                }
                className="h-10 rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear filters
              </button>

              <button
                type="submit"
                className="h-10 rounded-xl bg-purple-500 px-5 text-sm font-medium text-white transition hover:bg-purple-400"
              >
                Apply filters
              </button>
            </div>
          </form>
        )}
        {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 border-b border-white/10 px-4 py-3">
          {activeFilters.map((activeFilter) => (
            <button
              key={activeFilter.key}
              type="button"
              onClick={() =>
                removeFilter(activeFilter.key)
              }
              className="inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1.5 text-xs text-purple-200 transition hover:border-purple-400/40 hover:bg-purple-500/15"
            >
              <span className="text-purple-300/70">
                {activeFilter.label}:
              </span>

              <span>{activeFilter.value}</span>

              <X size={13} />
            </button>
          ))}

          <button
            type="button"
            onClick={clearFilters}
            className="px-2 text-xs text-slate-500 transition hover:text-white"
          >
            Clear all
          </button>
        </div>
)}
        {error && (
          <div className="flex items-start gap-3 border-b border-red-400/20 bg-red-500/10 p-4">
            <TriangleAlert
              size={18}
              className="mt-0.5 shrink-0 text-red-300"
            />

            <div>
              <p className="text-sm font-medium text-red-200">
                Could not load conversations
              </p>

              <p className="mt-1 text-xs text-red-300/80">
                {error}
              </p>
            </div>
          </div>
        )}

        {isLoading && conversations.length === 0 ? (
          <ConversationSkeleton />
        ) : error ? null : conversations.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-300">
              {hasSearchOrFilters
                ? "No conversations match the active search or filters."
                : "No conversations have been recorded yet."}
            </p>

            <p className="mt-2 text-xs text-slate-600">
              {hasSearchOrFilters
                ? "Remove a filter or broaden your search."
                : "New chatbot requests will appear here."}
            </p>
          </div>
        ) : (
          <>
            <DesktopTable
              conversations={conversations}
              onSelect={setSelectedRequestId}
            />

            <MobileConversationList
              conversations={conversations}
              onSelect={setSelectedRequestId}
            />
          </>
        )}

        <div className="flex flex-col gap-4 border-t border-white/10 px-4 py-4 tablet:flex-row tablet:items-center tablet:justify-between">
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-500">
              Showing {visibleRange.start}–{visibleRange.end} of{" "}
              {formatNumber(pagination.total_items)}
            </p>

            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              aria-label="Rows per page"
              className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-xs text-slate-400 outline-none"
            >
              <option value={10}>10 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-3 tablet:justify-end">
            <button
              type="button"
              onClick={() =>
                setPage((currentPage) =>
                  Math.max(1, currentPage - 1)
                )
              }
              disabled={!pagination.has_previous || isLoading}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-slate-950 px-3 text-xs text-slate-300 transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
              Previous
            </button>

            <p className="min-w-[90px] text-center text-xs text-slate-500">
              Page {pagination.page || 1} of{" "}
              {Math.max(pagination.total_pages || 0, 1)}
            </p>

            <button
              type="button"
              onClick={() =>
                setPage((currentPage) => currentPage + 1)
              }
              disabled={!pagination.has_next || isLoading}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-slate-950 px-3 text-xs text-slate-300 transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>

    <ConversationDetailsDrawer
      requestId={selectedRequestId}
      onClose={() => setSelectedRequestId(null)}
    />
  </>
  );
}