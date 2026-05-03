import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Header from "../components/Header";
import Cursor from "../components/Cursor";
import data from "../data/portfolio.json";
import Image from "next/image";
import { ArrowUp } from "lucide-react";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const hasStartedChat = messages.length > 0;
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
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
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          history: messages,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
        },
      ]);
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
          <Header />

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
                        msg.role === "user" ? "justify-end pr-8" : "justify-start pl-8"
                      }`}
                    >
                      <div
                        className={`
                          max-w-[70%] rounded-2xl px-5 py-3 text-sm tablet:text-base
                          ${
                            msg.role === "user"
                              ? "bg-purple-600 text-white"
                              : "bg-white/90 text-gray-900 dark:bg-white/[0.08] dark:text-white"
                          }
                        `}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            {hasStartedChat && (
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
            <div className="fixed bottom-6 left-1/2 z-20 w-full max-w-[90rem] -translate-x-1/2 px-4 laptop:px-0">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything about Assem..."
                  className="
                    flex-1 rounded-2xl
                    border border-gray-300 dark:border-white/10
                    bg-white/90 dark:bg-[#0B0714]/80
                    backdrop-blur-md
                    px-6 py-4
                    text-gray-900 dark:text-white
                    placeholder:text-gray-500 dark:placeholder:text-white/45
                    outline-none
                    transition-all duration-300
                    shadow-[0_0_12px_rgba(168,85,247,0.06)]
                    focus:border-purple-400/60
                    focus:shadow-[0_0_22px_rgba(168,85,247,0.18)]
                  "
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                />

                <button
                  type="button"
                  onClick={() => sendMessage()}
                  className="
                    h-[56px] w-[56px]
                    shrink-0 rounded-2xl
                    flex items-center justify-center
                    bg-white dark:bg-white
                    text-gray-900 dark:text-black
                    border border-gray-300 dark:border-white/70
                    shadow-[0_0_14px_rgba(168,85,247,0.12)]
                    hover:shadow-[0_0_24px_rgba(168,85,247,0.22)]
                    hover:scale-105
                    transition-all duration-300
                    rounded-full
                    bg-white/8
                    backdrop-blur-xl
                    border border-white/10
                  "
                >
                  <ArrowUp size={21} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}