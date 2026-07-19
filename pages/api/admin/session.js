import { isAuthenticatedRequest } from "../../../lib/adminAuth";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);

    return res.status(405).json({
      detail: "Method not allowed.",
    });
  }

  return res.status(200).json({
    authenticated: isAuthenticatedRequest(req),
  });
}