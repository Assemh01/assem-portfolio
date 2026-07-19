import { isAuthenticatedRequest } from "../../../../lib/adminAuth";

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
  const { requestId } = req.query;

  if (!backendUrl || !adminKey) {
    return res.status(500).json({
      detail: "Admin API environment variables are not configured.",
    });
  }

  if (!requestId || Array.isArray(requestId)) {
    return res.status(400).json({
      detail: "A valid request ID is required.",
    });
  }

  try {
    const backendResponse = await fetch(
      `${backendUrl.replace(
        /\/$/,
        ""
      )}/admin/api/conversations/${encodeURIComponent(requestId)}`,
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
        "Conversation detail backend returned non-JSON:",
        responseText
      );

      return res.status(502).json({
        detail: `Backend returned ${backendResponse.status} with an invalid response.`,
      });
    }

    if (backendResponse.status === 401) {
      return res.status(502).json({
        detail: "The backend rejected the configured admin key.",
      });
    }

    if (!backendResponse.ok) {
      return res.status(backendResponse.status).json({
        detail:
          data.detail ||
          data.error ||
          "The analytics backend could not load this conversation.",
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Conversation detail proxy failed:", error);

    return res.status(502).json({
      detail: "Could not connect to the analytics backend.",
    });
  }
}