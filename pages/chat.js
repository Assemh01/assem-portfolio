import React from "react";
import Head from "next/head";
import Header from "../components/Header";
import Cursor from "../components/Cursor";
import BackToTop from "../components/BackToTop";
import data from "../data/portfolio.json";

export default function ChatPage() {
  return (
    <div className={`relative min-h-screen ${data.showCursor ? "cursor-none" : ""}`}>
      <Head>
        <title>Chat with Assem</title>
      </Head>

      {data.showCursor && <Cursor />}
      <BackToTop />

      <div className="relative min-h-screen overflow-hidden bg-white text-black dark:bg-black dark:text-white">
        <div className="gradient-circle" />
        <div className="pointer-events-none absolute top-24 right-0 h-[520px] w-[720px] rounded-full bg-purple-500/20 blur-[150px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-[520px] w-[720px] rounded-full bg-indigo-500/10 blur-[150px]" />

        <div className="h-32 tablet:h-40" />

        <div className="mx-auto max-w-screen-2xl px-4 laptop:px-8 -mt-28 tablet:-mt-36">
          <Header />

          <div className="mt-12 laptop:mt-16 max-w-[72rem] mx-auto">
            <div
              className="
                rounded-3xl
                border border-black/10 dark:border-white/10
                bg-white/70 dark:bg-white/[0.04]
                backdrop-blur-xl
                shadow-[0_20px_70px_rgba(0,0,0,0.08)]
                p-5 laptop:p-6
                min-h-[460px] desktop:min-h-[500px]
              "
            >
              <div className="flex flex-col h-[460px] desktop:h-[500px]">
                <div className="flex-1 space-y-4 overflow-y-auto pr-2 pb-2">
                  <div className="max-w-[92%] tablet:max-w-[78%] laptop:max-w-[68%] rounded-2xl rounded-tl-sm bg-black/5 dark:bg-white/10 px-4 py-3">
                    <p className="text-sm tablet:text-base text-gray-800 dark:text-gray-200">
                      Hey! I’m Assem’s AI assistant. Ask me about his projects, skills, or experience.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <input
                    type="text"
                    placeholder="Ask about Assem..."
                    className="
                      flex-1 rounded-2xl border border-black/10 dark:border-white/6
                      bg-white/80 dark:bg-black/40
                      px-4 py-3
                      text-gray-900 dark:text-white
                      placeholder:text-gray-400
                      outline-none
                      focus:border-purple-500/60
                    "
                  />

                  <button
                    type="button"
                    className="
                      rounded-2xl px-5 py-3 font-medium
                      bg-black text-white hover:bg-black/90
                      dark:bg-white dark:text-black dark:hover:bg-white/90
                      transition
                    "
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}