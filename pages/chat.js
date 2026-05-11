import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Header from "../components/Header";
import Cursor from "../components/Cursor";
import data from "../data/portfolio.json";
import Image from "next/image";
import { ArrowUp, PanelLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const hasStartedChat = messages.length > 0;
  const messagesEndRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const resetChat = () => {
    setMessages([]);
    setMessage("");
    setLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    const nearBottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 180;

    if (nearBottom) {
      scrollToBottom();
    }
  }, [messages]);
  const sendMessage = async (prefill = null) => {
    const content = (prefill ?? message).trim();

    if (!content || loading) return;

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

      const res = await fetch("http://localhost:8000/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          history: messages,
        }),
      });

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={`relative min-h-screen ${data.showCursor ? "cursor-none" : ""}`}>
      <Head>
        <title>Chat with Assem</title>
      </Head>

      {data.showCursor && <Cursor />}

      <div className="relative min-h-screen overflow-hidden bg-white text-black dark:bg-black dark:text-white">
        <div className="gradient-circle" />
        <div className="pointer-events-none absolute top-24 right-0 h-[520px] w-[720px] rounded-full bg-purple-500/20 blur-[150px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-[520px] w-[720px] rounded-full bg-indigo-500/10 blur-[150px]" />

        <div className="h-32 tablet:h-40" />

        <div className="mx-auto max-w-screen-2xl px-4 laptop:px-8 -mt-28 tablet:-mt-36">
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

          <div className="relative flex min-h-[calc(100vh-120px)] flex-col">
            <div
              className={`flex-1 flex flex-col items-center px-4 pb-32 ${
                hasStartedChat
                  ? "justify-start pt-10"
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
                <div className="w-full max-w-4xl mx-auto mt-2 space-y-3 pb-28">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        msg.role === "user"
                          ? "justify-end pr-8"
                          : "justify-start pl-8"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="flex items-end gap-3 max-w-[68%]">
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
                                rounded-2xl px-5 py-3 text-sm tablet:text-base leading-relaxed
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
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className="
                            max-w-[70%] rounded-2xl px-5 py-3
                            text-sm tablet:text-base
                            bg-purple-600 text-white
                          "
                        >
                          {msg.content}
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
                z-20 w-full max-w-4xl px-4
                pb-6 pt-10
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
                    px-6 py-4
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
                  onClick={() => sendMessage()}
                  disabled={loading}
                  className={`
                    h-[56px] w-[56px]
                    shrink-0 rounded-full
                    flex items-center justify-center
                    text-gray-900 dark:text-black
                    border border-gray-300 dark:border-white/70
                    transition-all duration-300
                    ${
                      loading
                        ? "bg-white/50 dark:bg-white/50 opacity-50 cursor-not-allowed"
                        : "bg-white dark:bg-white hover:shadow-[0_0_24px_rgba(168,85,247,0.22)] hover:scale-105"
                    }
                  `}
                >
                  <ArrowUp size={21} strokeWidth={2.4} />
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
          h-screen w-[360px]

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