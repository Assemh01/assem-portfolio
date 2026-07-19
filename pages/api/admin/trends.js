import { isAuthenticatedRequest } from "../../../lib/adminAuth";

const ALLOWED_RANGES = new Set(["7d", "30d", "90d", "all"]);

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

  const requestedRange = Array.isArray(req.query.range)
    ? req.query.range[0]
    : req.query.range || "30d";

  if (!ALLOWED_RANGES.has(requestedRange)) {
    return res.status(400).json({
      detail: "Range must be one of: 7d, 30d, 90d, all.",
    });
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL;
  const adminKey = process.env.ADMIN_KEY;

  if (!backendUrl || !adminKey) {
    return res.status(500).json({
      detail: "Admin API environment variables are not configured.",
    });
  }

  try {
    const endpoint = new URL(
      `${backendUrl.replace(/\/$/, "")}/admin/api/trends`
    );

    endpoint.searchParams.set("range", requestedRange);

    const backendResponse = await fetch(endpoint.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${adminKey}`,
      },
    });

    const responseText = await backendResponse.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("Backend returned non-JSON:", responseText);

      return res.status(502).json({
        detail: `Backend returned ${backendResponse.status} with an invalid response.`,
      });
    }

    if (!backendResponse.ok) {
      console.error(
        `Analytics trends backend returned ${backendResponse.status}:`,
        data
      );

      return res.status(
        backendResponse.status === 400 ? 400 : 502
      ).json({
        detail:
          backendResponse.status === 401
            ? "The backend rejected the configured admin key."
            : data.detail ||
              data.error ||
              "The analytics backend returned an error.",
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Admin trends proxy failed:", error);

    return res.status(502).json({
      detail: "Could not connect to the analytics backend.",
    });
  }
}