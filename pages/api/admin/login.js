import {
  createAdminSessionToken,
  getAdminCookieName,
  isValidAdminKey,
} from "../../../lib/adminAuth";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);

    return res.status(405).json({
      detail: "Method not allowed.",
    });
  }

  const { adminKey } = req.body || {};

  if (!isValidAdminKey(adminKey)) {
    return res.status(401).json({
      detail: "Invalid admin key.",
    });
  }

  const token = createAdminSessionToken();
  const cookieName = getAdminCookieName();

  const cookieParts = [
    `${cookieName}=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Strict",
    "Max-Age=28800",
  ];

  if (process.env.NODE_ENV === "production") {
    cookieParts.push("Secure");
  }

  res.setHeader("Set-Cookie", cookieParts.join("; "));

  return res.status(200).json({
    authenticated: true,
  });
}