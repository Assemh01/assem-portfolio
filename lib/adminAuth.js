import crypto from "crypto";

const COOKIE_NAME = "admin_session";

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function createAdminSessionToken() {
  const adminKey = getRequiredEnv("ADMIN_KEY");
  const sessionSecret = getRequiredEnv("ADMIN_SESSION_SECRET");

  return crypto
    .createHmac("sha256", sessionSecret)
    .update(adminKey)
    .digest("hex");
}

export function isValidAdminKey(candidateKey) {
  if (!candidateKey || typeof candidateKey !== "string") {
    return false;
  }

  const configuredKey = getRequiredEnv("ADMIN_KEY");

  const candidateBuffer = Buffer.from(candidateKey);
  const configuredBuffer = Buffer.from(configuredKey);

  if (candidateBuffer.length !== configuredBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(candidateBuffer, configuredBuffer);
}

export function isAuthenticatedRequest(req) {
  const receivedToken = req.cookies?.[COOKIE_NAME];

  if (!receivedToken) {
    return false;
  }

  const expectedToken = createAdminSessionToken();

  const receivedBuffer = Buffer.from(receivedToken);
  const expectedBuffer = Buffer.from(expectedToken);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function getAdminCookieName() {
  return COOKIE_NAME;
}