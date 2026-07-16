import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Header from "../components/Header";
import Cursor from "../components/Cursor";
import data from "../data/portfolio.json";
import Image from "next/image";
import { ArrowUp, PanelLeft, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  buildBrowserMetadata,
  getDeviceType,
  trackAnalyticsEvent,
} from "../utils/analytics";
import {
  createMessageId,
  getConversationId,
  getVisitorId,
  startNewConversation,
} from "../utils/chatIdentity";

const CodeBlock = {
  code({ inline, children, ...props }) {
    return inline ? (
      <code
        className="
          rounded-md bg-black/10 dark:bg-white/10
          px-1.5 py-0.5
          font-mono text-[0.95em]
        "
        {...props}
      >
        {children}
      </code>
    ) : (
      <pre
        className="
          my-3 overflow-x-auto rounded-xl
          bg-black/10 dark:bg-white/10
          p-4 font-mono text-sm
        "
      >
        <code {...props}>{String(children).replace(/\n$/, "")}</code>
      </pre>
    );
  },
};

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const hasStartedChat = messages.length > 0;
  const messagesEndRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const requestStartedAtRef = useRef(null);
  const activeRequestIdRef = useRef(null);
  const firstTokenReceivedRef = useRef(false);
  const cancellationTrackedRef = useRef(false);
  const controllerRef = useRef(null);
  const getChatClientMetadata = () => {
  const browserMetadata = buildBrowserMetadata();
    return {
      device_type: getDeviceType(),
      browser:
        browserMetadata.browser ||
        browserMetadata.browser_name ||
        null,
      screen_width:
        typeof window !== "undefined"
          ? window.screen.width
          : null,
      screen_height:
        typeof window !== "undefined"
          ? window.screen.height
          : null,
    };
  };
  const resetChat = () => {
    if (controllerRef.current) {
      stopGeneration();
    }

    startNewConversation();

    setMessages([]);
    setMessage("");
    setLoading(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const [exploreOpen, setExploreOpen] = useState(false);
  const [openTopic, setOpenTopic] = useState("Projects");

  const exploreSections = [
    {
      title: "Projects",
      questions: [
        "What projects has Assem worked on?",
        "Tell me about Assem’s RAG experience.",
        "What was the financial intelligence POC?"
      ],
    },
    {
      title: "Skills",
      questions: [
        "What AI tools and frameworks does he use?",
        "What backend technologies does Assem know?",
        "What is Assem strongest at?"
      ],
    },
    {
      title: "Career",
      questions: [
        "Summarize Assem’s background.",
        "What roles is Assem a good fit for?",
        "What is Assem’s current work authorization?"
      ],
    },
    {
      title: "Personal",
      questions: [
        "Where is Assem based?",
        "How can I contact Assem?",
        "What makes Assem different as an AI engineer?"
      ],
    },
  ];
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;

      setShowScrollButton(!nearBottom && messages.length > 0);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [messages]);

  useEffect(() => {
    void trackAnalyticsEvent({
      event_name: "chat_initialized",
      device_type: getDeviceType(),
      metadata: buildBrowserMetadata({
        page: "chat",
      }),
    });
  }, []);

  useEffect(() => {
    const nearBottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 180;

    if (nearBottom) {
      scrollToBottom();
    }
  }, [messages]);
    const sendMessage = async (prefill = null) => {
    const content = (prefill ?? message).trim();

    if (!content || loading) return;

    const visitorId = getVisitorId();
    const conversationId = getConversationId();
    const messageId = createMessageId();
    const clientMetadata = getChatClientMetadata();

    requestStartedAtRef.current = performance.now();
    activeRequestIdRef.current = null;
    firstTokenReceivedRef.current = false;
    cancellationTrackedRef.current = false;

    void trackAnalyticsEvent({
      event_name: "message_sent",
      device_type: getDeviceType(),
      metadata: buildBrowserMetadata({
        message_id: messageId,
        conversation_id: conversationId,
        visitor_id: visitorId,
        message_length: content.length,
        message_source: prefill
          ? "suggested_question"
          : "typed_message",
        history_length: messages.length,
      }),
    });

    const userMessage = {
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const assistantMessage = {
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, assistantMessage]);
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const controller = new AbortController();
      controllerRef.current = controller;

      const res = await fetch(`${API_URL}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          history: messages,

          visitor_id: visitorId,
          conversation_id: conversationId,
          message_id: messageId,

          device_type: clientMetadata.device_type,
          browser: clientMetadata.browser,
          screen_width: clientMetadata.screen_width,
          screen_height: clientMetadata.screen_height,
        }),
        signal: controller.signal,
      });

      const backendRequestId =
        res.headers.get("X-Request-ID");

      activeRequestIdRef.current = backendRequestId;
      if (!res.ok) {
        throw new Error(
          `Chat request failed with status ${res.status}`
        );
      }

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        if (
          !firstTokenReceivedRef.current &&
          chunk.length > 0
        ) {
          firstTokenReceivedRef.current = true;

          const firstTokenMs =
            requestStartedAtRef.current !== null
              ? performance.now() -
                requestStartedAtRef.current
              : null;

          void trackAnalyticsEvent({
            event_name: "first_token_received",
            request_id: activeRequestIdRef.current,
            time_to_first_token_ms: firstTokenMs,
            time_to_first_response_ms: firstTokenMs,
            device_type: getDeviceType(),
            metadata: buildBrowserMetadata(),
          });
        }

        setMessages((prev) => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          if (!lastMessage) return prev;

          updated[updated.length - 1] = {
            ...lastMessage,
            content: (lastMessage.content || "") + chunk,
          };
          return updated;
        });
      }
      const completionMs =
        requestStartedAtRef.current !== null
          ? performance.now() -
            requestStartedAtRef.current
          : null;

      void trackAnalyticsEvent({
        event_name: "stream_completed",
        request_id: activeRequestIdRef.current,
        stream_completion_ms: completionMs,
        device_type: getDeviceType(),
        metadata: buildBrowserMetadata({
          received_first_token:
            firstTokenReceivedRef.current,
        }),
      });
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Generation stopped");

        if (!cancellationTrackedRef.current) {
          cancellationTrackedRef.current = true;

          const cancellationMs =
            requestStartedAtRef.current !== null
              ? performance.now() -
                requestStartedAtRef.current
              : null;

          void trackAnalyticsEvent({
            event_name: "stream_cancelled",
            request_id: activeRequestIdRef.current,
            stream_completion_ms: cancellationMs,
            device_type: getDeviceType(),
            metadata: buildBrowserMetadata({
              source: "abort_controller",
              received_first_token:
                firstTokenReceivedRef.current,
            }),
          });
        }

        return;
      }

      const failureMs =
        requestStartedAtRef.current !== null
          ? performance.now() -
            requestStartedAtRef.current
          : null;

      void trackAnalyticsEvent({
        event_name: "stream_failed",
        request_id: activeRequestIdRef.current,
        stream_completion_ms: failureMs,
        device_type: getDeviceType(),
        metadata: buildBrowserMetadata({
          error_type:
            error instanceof Error
              ? error.name
              : "UnknownError",
          error_message:
            error instanceof Error
              ? error.message.slice(0, 300)
              : "Unknown frontend error",
        }),
      });

      setMessages((prev) => {
        const updated = [...prev];

        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: "Something went wrong.",
        };

        return updated;
      });
    } finally {
        controllerRef.current = null;
        activeRequestIdRef.current = null;
        requestStartedAtRef.current = null;
        firstTokenReceivedRef.current = false;
        setLoading(false);
      }
      };
    const stopGeneration = () => {
      if (!controllerRef.current) {
        return;
      }

      const cancellationMs =
        requestStartedAtRef.current !== null
          ? performance.now() -
            requestStartedAtRef.current
          : null;

      if (!cancellationTrackedRef.current) {
        cancellationTrackedRef.current = true;

        void trackAnalyticsEvent({
          event_name: "stream_cancelled",
          request_id: activeRequestIdRef.current,
          stream_completion_ms: cancellationMs,
          device_type: getDeviceType(),
          metadata: buildBrowserMetadata({
            source: "stop_button",
            received_first_token:
              firstTokenReceivedRef.current,
          }),
        });
      }

      controllerRef.current.abort();
      setLoading(false);
    };
  return (
    <div className={`relative min-h-[100dvh] touch-manipulation ${data.showCursor ? "cursor-none" : ""}`}>
      <Head>
        <title>Chat with Assem</title>
      </Head>

      {data.showCursor && typeof window !== "undefined" && window.innerWidth >= 1024 && <Cursor />}

      <div className="relative min-h-[100dvh] overflow-hidden bg-white text-black dark:bg-black dark:text-white">
        <div className="gradient-circle" />
        <div className="pointer-events-none absolute top-24 right-0 h-[520px] w-[720px] rounded-full bg-purple-500/20 blur-[150px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-[520px] w-[720px] rounded-full bg-indigo-500/10 blur-[150px]" />

        <div className="h-20 sm:h-32 tablet:h-40" />

        <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-4 laptop:px-8 -mt-20 sm:-mt-28 tablet:-mt-36">
        <div className="relative flex items-center justify-between">
          <Header />
        </div>

        {hasStartedChat && (
          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setExploreOpen(true)}
              aria-label="Open suggestions"
              className="
                h-10 w-10 rounded-xl
                inline-flex items-center justify-center

                bg-purple-100/80
                hover:bg-purple-200/90
                border border-purple-300/50
                hover:border-purple-400/70
                text-purple-800
                shadow-[0_8px_24px_rgba(88,28,135,0.16)]

                dark:bg-white/[0.06]
                dark:hover:bg-white/[0.10]
                dark:border-white/10
                dark:hover:border-purple-300/25
                dark:text-white
                dark:shadow-[0_0_18px_rgba(168,85,247,0.12)]
                dark:hover:shadow-[0_0_26px_rgba(168,85,247,0.20)]

                backdrop-blur-xl
                transition-all duration-300
                hover:scale-[1.03]
              "
            >
              <PanelLeft size={19} strokeWidth={2.2} />
            </button>

            <button
              onClick={resetChat}
              className="
                h-10 px-4 rounded-xl
                inline-flex items-center justify-center gap-2

                bg-gradient-to-b from-purple-500 to-purple-700
                text-white
                border border-purple-500/40
                shadow-[0_10px_28px_rgba(126,34,206,0.26)]

                hover:from-purple-400
                hover:to-purple-600
                hover:shadow-[0_12px_34px_rgba(126,34,206,0.34)]

                dark:from-[#5B3586]
                dark:to-[#3A2058]
                dark:border-purple-300/14

                backdrop-blur-xl
                transition-all duration-300
                hover:scale-[1.015]
              "
            >
              <span className="text-[17px] leading-none">+</span>
              <span className="text-[15px] font-semibold leading-none">
                New Chat
              </span>
            </button>
          </div>
        )}

          <div className="relative flex min-h-[calc(100dvh-96px)] sm:min-h-[calc(100dvh-120px)] flex-col">
            <div
              className={`flex-1 flex flex-col items-center px-2 sm:px-4 ${
                hasStartedChat
                  ? "justify-start pt-6 sm:pt-10"
                  : "justify-center text-center"
              }`}
            >
              {!hasStartedChat && (
                <>
              <div className="h-14 w-14 rounded-full flex items-center justify-center bg-white/10 ring-1 ring-white/20 shadow-[0_0_30px_rgba(168,85,247,0.45)]">
                <Image
                  src="/assemlogo-v2.png"
                  alt="Assem logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>

              <h1 className="mt-5 text-2xl tablet:text-3xl font-semibold text-gray-900 dark:text-white">
                Hi, I&apos;m Assem&apos;s AI Assistant.
              </h1>

              <p className="mt-2 text-base tablet:text-lg text-gray-700 dark:text-white/75 max-w-xl">
                Ask me about his projects, skills, background, or AI engineering experience.
              </p>

              <div className="mt-10 grid grid-cols-1 tablet:grid-cols-2 gap-6 w-full max-w-3xl">
                {[
                  "What projects has Assem worked on?",
                  "What AI tools and frameworks does he use?",
                  "Summarize Assem’s background.",
                  "What is Assem’s current work authorization?"
                ].map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => sendMessage(question)}
                    className="
                      text-left rounded-2xl
                      border border-gray-300
                      bg-white/95
                      hover:bg-white
                      px-5 py-4
                      text-sm tablet:text-base
                      text-gray-800 hover:text-gray-950
                      shadow-[0_6px_20px_rgba(0,0,0,0.06)]
                      hover:shadow-[0_8px_22px_rgba(168,85,247,0.10)]
                      hover:border-purple-300/60
                      hover:-translate-y-1
                      transition-all duration-300
                      min-h-[88px]

                      dark:border-white/10
                      dark:bg-white/[0.04]
                      dark:hover:bg-white/[0.08]
                      dark:text-white/80
                      dark:hover:text-white
                      dark:shadow-none
                    "
                  >
                    {question}
                  </button>
                ))}
              </div>
              </>
              )}
              {messages.length > 0 && (
                <div className="w-full max-w-4xl mx-auto mt-2 space-y-3 pb-28 sm:pb-28">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        msg.role === "user"
                          ? "justify-end sm:pr-8"
                          : "justify-start sm:pl-8"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="flex items-end gap-3 max-w-[88%] sm:max-w-[68%]">
                          <div
                            className={`shrink-0 mt-1 ${
                              loading && index === messages.length - 1
                                ? "assistant-thinking"
                                : ""
                            }`}
                          >
                            <Image
                              src="/assemlogo-v2.png"
                              alt="Assem logo"
                              width={34}
                              height={34}
                              className="object-contain"
                            />
                          </div>

                          {msg.content && (
                            <div
                              className="
                                rounded-2xl px-4 sm:px-5 py-3 text-sm tablet:text-base leading-relaxed
                                bg-white/95 text-gray-900
                                border-2 border-purple-200/80
                                shadow-[0_12px_34px_rgba(88,28,135,0.10)]
                                dark:bg-white/[0.08]
                                dark:text-white
                                dark:border dark:border-white/10
                                dark:shadow-none
                              "
                            >
                              <div
                                className="
                                  prose prose-sm tablet:prose-base
                                  max-w-none
                                  prose-p:my-2
                                  prose-ul:my-2
                                  prose-ol:my-2
                                  prose-li:my-1
                                  prose-strong:text-inherit
                                  prose-headings:text-inherit
                                  prose-code:text-inherit
                                  dark:prose-invert
                                "
                              >
                                <ReactMarkdown
                                  components={{
                                    ...CodeBlock,
                                    a: ({ node, ...props }) => (
                                      <a
                                        {...props}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="
                                          text-purple-600 hover:text-purple-700 hover:underline
                                          dark:text-purple-400 dark:hover:text-purple-300
                                          transition-colors
                                        "
                                      />
                                    ),
                                  }}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-end gap-2 max-w-[82%] sm:max-w-[72%] flex-row-reverse">
                          <div
                            className="
                              h-[38px] w-[38px]
                              shrink-0 rounded-full

                              flex items-center justify-center

                              bg-white/[0.05]
                              dark:bg-white/[0.04]

                              backdrop-blur-md

                              ring-1 ring-white/10

                              shadow-[0_0_12px_rgba(255,255,255,0.03)]
                            "
                          >
                            <User
                              size={17}
                              strokeWidth={2}
                              className="
                                text-white/65
                              "
                            />
                          </div>
                          <div
                            className="
                              rounded-2xl px-5 py-3
                              text-sm tablet:text-base

                              bg-purple-600 text-white

                              shadow-[0_10px_28px_rgba(126,34,206,0.22)]

                              dark:bg-gradient-to-b
                              dark:from-purple-500
                              dark:to-purple-700
                            "
                          >
                            {msg.content}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            {showScrollButton && (
              <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30">
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="
                    h-10 px-4 rounded-full
                    flex items-center justify-center gap-2
                    bg-white/95 dark:bg-white/[0.12]
                    backdrop-blur-md
                    border border-gray-300 dark:border-white/10
                    text-gray-900 dark:text-white
                    shadow-[0_0_18px_rgba(168,85,247,0.14)]
                    hover:scale-105
                    hover:shadow-[0_0_28px_rgba(168,85,247,0.22)]
                    transition-all duration-300
                  "
                >
                  ↓
                </button>
              </div>
            )}
            <div
              className="
                fixed bottom-0 left-1/2 -translate-x-1/2
                z-20 w-full max-w-4xl px-3 sm:px-4
                pb-4 sm:pb-6 pt-8 sm:pt-10
              "
            >
              <div
                className="
                  absolute inset-0 -z-10
                  bg-gradient-to-t
                  from-white via-white/92 to-transparent
                  dark:from-black dark:via-black/88 dark:to-transparent
                "
              />

              <div className="flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything about Assem..."
                  className="
                    flex-1 rounded-2xl
                    text-[16px]
                    px-4 sm:px-6 py-3 sm:py-4
                    backdrop-blur-md
                    outline-none
                    transition-all duration-300

                    bg-[#F8F6FC]
                    border border-purple-200
                    text-gray-900
                    placeholder:text-gray-500
                    shadow-[0_8px_28px_rgba(0,0,0,0.06)]

                    dark:bg-[#0E0916]
                    dark:border-white/10
                    dark:text-white
                    dark:placeholder:text-white/45
                    dark:shadow-[0_10px_32px_rgba(0,0,0,0.35)]

                    focus:border-purple-400/60
                    focus:shadow-[0_0_26px_rgba(168,85,247,0.20)]
                  "
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                />

                <button
  type="button"
  onClick={loading ? stopGeneration : () => sendMessage()}
  className={`
    h-[50px] w-[50px] sm:h-[56px] sm:w-[56px]
    shrink-0 rounded-full
    flex items-center justify-center
    transition-all duration-300
    border

    ${
      loading
        ? `
          bg-white dark:bg-white
          border-white/80 dark:border-white/80
          hover:scale-105
          hover:shadow-[0_0_24px_rgba(168,85,247,0.22)]
        `
        : `
          bg-white dark:bg-white
          border-gray-300 dark:border-white/70
          hover:scale-105
          hover:shadow-[0_0_24px_rgba(168,85,247,0.22)]
        `
    }
  `}
>
  {loading ? (
    <div
      className="
        h-[14px] w-[14px]
        rounded-[4px]
        bg-black
      "
    />
  ) : (
    <ArrowUp
      size={21}
      strokeWidth={2.4}
      className="text-gray-900 dark:text-black"
    />
  )}
</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        onClick={() => setExploreOpen(false)}
        className={`
          fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]
          transition-opacity duration-300
          ${exploreOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      <aside
        className={`
          fixed left-0 top-0 z-50
          h-screen w-[85vw] max-w-[360px]

          bg-gradient-to-b
          from-white
          via-purple-50/95
          to-white

          dark:from-[#13091F]
          dark:via-[#09050E]
          dark:to-[#050309]

          border-r border-purple-200/70
          dark:border-white/10

          backdrop-blur-xl
          p-5

          shadow-[18px_0_55px_rgba(88,28,135,0.14)]
          dark:shadow-[12px_0_40px_rgba(0,0,0,0.35),0_0_30px_rgba(168,85,247,0.10)]

          transform transition-transform duration-300 ease-out
          ${exploreOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full bg-purple-400/12 dark:bg-purple-500/18 blur-[90px]" />
        <div className="pointer-events-none absolute top-40 -right-24 h-72 w-72 rounded-full bg-indigo-300/8 dark:bg-indigo-500/10 blur-[100px]" />
        <div className="relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Suggestions</h2>

          <button
            onClick={() => setExploreOpen(false)}
            className="
              h-9 w-9 rounded-lg
              bg-purple-100 text-purple-900 hover:bg-purple-200
              dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]
              transition
            "
          >
            ×
          </button>
        </div>

        <p className="mt-2 text-sm text-gray-500 dark:text-white/50">Browse questions by topic.</p>

        <div className="mt-6 space-y-3">
          {exploreSections.map((section) => {
            const isOpen = openTopic === section.title;

            return (
              <div
                key={section.title}
                className="
                  rounded-xl
                  border border-purple-200/80
                  bg-white/80

                  dark:border-white/10
                  dark:bg-[#15101C]

                  overflow-hidden
                "
              >
                <button
                  type="button"
                  onClick={() => setOpenTopic(isOpen ? "" : section.title)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left text-gray-900 dark:text-white font-medium hover:bg-purple-50 dark:hover:bg-white/[0.04] transition"
                >
                  <span>{section.title}</span>
                  <span className={`text-gray-500 dark:text-white/50 transition-transform duration-300 ${isOpen ? "rotate-45" : "rotate-0"}`}>
                    +
                  </span>
                </button>

                <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <div className="px-3 pt-2 pb-3 space-y-2">
                      {section.questions.map((question) => (
                        <button
                          key={question}
                          onClick={() => {
                            setExploreOpen(false);
                            sendMessage(question);
                          }}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 bg-white/70 border border-purple-200/60 hover:bg-purple-50 hover:border-purple-300/70 hover:text-gray-950 dark:text-white/75 dark:bg-white/[0.04] dark:border-transparent dark:hover:bg-purple-500/15 dark:hover:text-white transition-all duration-200"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </aside>
    </div>
  );
}