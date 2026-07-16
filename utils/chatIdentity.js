import { v4 as uuidv4 } from "uuid";

const VISITOR_ID_KEY = "portfolio_visitor_id";
const CONVERSATION_ID_KEY = "portfolio_conversation_id";

export function getVisitorId() {
  if (typeof window === "undefined") {
    return null;
  }

  let visitorId = window.localStorage.getItem(
    VISITOR_ID_KEY
  );

  if (!visitorId) {
    visitorId = uuidv4();

    window.localStorage.setItem(
      VISITOR_ID_KEY,
      visitorId
    );
  }

  return visitorId;
}

export function getConversationId() {
  if (typeof window === "undefined") {
    return null;
  }

  let conversationId = window.sessionStorage.getItem(
    CONVERSATION_ID_KEY
  );

  if (!conversationId) {
    conversationId = uuidv4();

    window.sessionStorage.setItem(
      CONVERSATION_ID_KEY,
      conversationId
    );
  }

  return conversationId;
}

export function createMessageId() {
  return uuidv4();
}

export function startNewConversation() {
  if (typeof window === "undefined") {
    return null;
  }

  const conversationId = uuidv4();

  window.sessionStorage.setItem(
    CONVERSATION_ID_KEY,
    conversationId
  );

  return conversationId;
}

export function getClientMetadata() {
  if (typeof window === "undefined") {
    return {
      device_type: null,
      browser: null,
      screen_width: null,
      screen_height: null,
    };
  }

  return {
    device_type: getDeviceType(),
    browser: getBrowserName(),
    screen_width: window.screen.width,
    screen_height: window.screen.height,
  };
}

function getDeviceType() {
  const width = window.innerWidth;

  if (width < 768) {
    return "mobile";
  }

  if (width < 1024) {
    return "tablet";
  }

  return "desktop";
}

function getBrowserName() {
  const userAgent = window.navigator.userAgent;

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