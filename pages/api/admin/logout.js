import { getAdminCookieName } from "../../../lib/adminAuth";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);

    return res.status(405).json({
      detail: "Method not allowed.",
    });
  }

  const cookieName = getAdminCookieName();

  const cookieParts = [
    `${cookieName}=`,
    "HttpOnly",
    "Path=/",
    "SameSite=Strict",
    "Max-Age=0",
  ];

  if (process.env.NODE_ENV === "production") {
    cookieParts.push("Secure");
  }

  res.setHeader("Set-Cookie", cookieParts.join("; "));

  return res.status(200).json({
    authenticated: false,
  });
}