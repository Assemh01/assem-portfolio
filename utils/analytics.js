const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getDeviceType() {
  if (typeof window === "undefined") {
    return null;
  }

  const width = window.innerWidth;

  if (width < 768) {
    return "mobile";
  }

  if (width < 1024) {
    return "tablet";
  }

  return "desktop";
}

export function getBrowserName() {
  if (typeof navigator === "undefined") {
    return null;
  }

  const userAgent = navigator.userAgent;

  if (userAgent.includes("Edg/")) {
    return "Edge";
  }

  if (
    userAgent.includes("Chrome/") &&
    !userAgent.includes("Edg/")
  ) {
    return "Chrome";
  }

  if (userAgent.includes("Firefox/")) {
    return "Firefox";
  }

  if (
    userAgent.includes("Safari/") &&
    !userAgent.includes("Chrome/")
  ) {
    return "Safari";
  }

  return "Other";
}

export async function trackAnalyticsEvent(payload) {
  try {
    const response = await fetch(
      `${API_URL}/analytics/event`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }
    );

    if (!response.ok) {
      console.warn(
        "Analytics event failed:",
        payload.event_name,
        response.status
      );
    }
  } catch (error) {
    // Analytics must never break the portfolio experience.
    console.warn(
      "Analytics request failed:",
      payload.event_name
    );
  }
}

export function buildBrowserMetadata(
  additionalMetadata = {}
) {
  if (typeof window === "undefined") {
    return additionalMetadata;
  }

  return {
    browser: getBrowserName(),
    screen_width: window.innerWidth,
    screen_height: window.innerHeight,
    user_agent: navigator.userAgent,
    ...additionalMetadata,
  };
}