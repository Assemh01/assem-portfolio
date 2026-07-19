import { isAuthenticatedRequest } from "../../../lib/adminAuth";

const ALLOWED_SORT_FIELDS = new Set([
  "timestamp",
  "visitor_id",
  "conversation_id",
  "question",
  "response_length",
  "status",
  "latency",
]);

const ALLOWED_SORT_DIRECTIONS = new Set(["asc", "desc"]);

function getSingleQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function getPositiveInteger(value, fallback, maximum) {
  const parsedValue = Number.parseInt(getSingleQueryValue(value), 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return Math.min(parsedValue, maximum);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);

    return res.status(405).json({
      detail: "Method not allowed.",
    });
  }

  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({
      detail: "Unauthorized.",
    });
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL;
  const adminKey = process.env.ADMIN_KEY;

  if (!backendUrl || !adminKey) {
    return res.status(500).json({
      detail: "Admin API environment variables are not configured.",
    });
  }

  const page = getPositiveInteger(req.query.page, 1, 100000);
  const pageSize = getPositiveInteger(req.query.page_size, 25, 100);

  const requestedSearch = getSingleQueryValue(req.query.search);
  const search =
    typeof requestedSearch === "string"
      ? requestedSearch.trim().slice(0, 300)
      : "";

  const requestedSortBy = getSingleQueryValue(req.query.sort_by);
  const sortBy = ALLOWED_SORT_FIELDS.has(requestedSortBy)
    ? requestedSortBy
    : "timestamp";

  const requestedSortDirection = getSingleQueryValue(
    req.query.sort_direction
  );

  const sortDirection = ALLOWED_SORT_DIRECTIONS.has(
    requestedSortDirection
  )
    ? requestedSortDirection
    : "desc";

  const queryParameters = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    sort_by: sortBy,
    sort_direction: sortDirection,
  });

  if (search) {
    queryParameters.set("search", search);
  }

  try {
    const backendResponse = await fetch(
      `${backendUrl.replace(
        /\/$/,
        ""
      )}/admin/api/conversations?${queryParameters.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${adminKey}`,
        },
      }
    );

    const responseText = await backendResponse.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(
        "Conversations backend returned non-JSON:",
        responseText
      );

      return res.status(502).json({
        detail: `Backend returned ${backendResponse.status} with an invalid response.`,
      });
    }

    if (backendResponse.status === 401) {
      console.error("Analytics backend rejected the admin key.");

      return res.status(502).json({
        detail: "The backend rejected the configured admin key.",
      });
    }

    if (!backendResponse.ok) {
      return res.status(backendResponse.status).json({
        detail:
          data.detail ||
          data.error ||
          "The analytics backend could not load conversations.",
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Admin conversations proxy failed:", error);

    return res.status(502).json({
      detail: "Could not connect to the analytics backend.",
    });
  }
}