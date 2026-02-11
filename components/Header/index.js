import { Popover } from "@headlessui/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Button from "../Button";
import data from "../../data/portfolio.json";

const Header = ({ handleWorkScroll, handleSkillsScroll, handleAboutScroll }) => {
  const router = useRouter();
  const onHome = router.pathname === "/";

  const goTop = () => {
    if (onHome) window.scrollTo({ top: 0, behavior: "smooth" });
    else router.push("/");
  };

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { showResume } = data;

  useEffect(() => setMounted(true), []);

  return (
    <>
      {/* Mobile Header */}
      <Popover className="block tablet:hidden mt-5">
        {({ open }) => (
          <>
            {/* IMPORTANT: no px-* here so it aligns with the H1 in the parent container */}
            <div className="flex items-center justify-between py-2">
              {/* Logo (left) */}
              <button
                type="button"
                onClick={goTop}
                aria-label="Go to top"
                className="
                  group
                  h-9 w-9
                  rounded-full
                  flex items-center justify-center
                  backdrop-blur-md
                  bg-white/10 dark:bg-white/5
                  ring-1 ring-white/20
                  transition
                "
              >
                <img
                  src="/assemlogo-v2.png"
                  alt="Assem logo"
                  className="h-7 w-7"
                />
              </button>


              <div className="flex items-center">
                {data.darkMode && (
                  <Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                    <img
                      className="h-6"
                      src={`/images/${theme === "dark" ? "moon.svg" : "sun.svg"}`}
                      alt="Toggle theme"
                    />
                  </Button>
                )}

                <Popover.Button>
                  <img
                    className="h-5"
                    src={`/images/${
                      !open
                        ? theme === "dark"
                          ? "menu-white.svg"
                          : "menu.svg"
                        : theme === "light"
                        ? "cancel.svg"
                        : "cancel-white.svg"
                    }`}
                    alt="Menu"
                  />
                </Popover.Button>
              </div>
            </div>

            <Popover.Panel
              className={`absolute right-0 z-10 w-11/12 p-4 ${
                theme === "dark" ? "bg-slate-800" : "bg-white"
              } shadow-md rounded-md`}
            >
              <div className="grid grid-cols-1">
                {onHome ? (
                  <>
                    <Button onClick={handleWorkScroll}>Work</Button>
                    <Button onClick={handleSkillsScroll}>Skills</Button>
                    <Button onClick={handleAboutScroll}>About</Button>
                  </>
                ) : (
                  <Button onClick={() => router.push("/")}>Home</Button>
                )}

                {showResume && (
                  <Button onClick={() => router.push("/resume")} classes="first:ml-1">
                    Resume
                  </Button>
                )}

                <Button onClick={() => window.open("mailto:assem.h2001@gmail.com")}>
                  Contact
                </Button>
              </div>
            </Popover.Panel>
          </>
        )}
      </Popover>

      {/* Desktop Header */}
      {/* IMPORTANT: remove px-* so left edge matches the hero content (your parent wrapper already has px-4 / laptop:px-8) */}
      <div className="hidden tablet:flex items-center justify-between sticky top-0 z-10 h-12">
        {/* Logo (left) */}
        <button
          type="button"
          onClick={goTop}
          aria-label="Go to top"
          className="
            h-10 w-10
            rounded-full
            flex items-center justify-center
            bg-black/5 hover:bg-black/8
            ring-1 ring-black/10
            shadow-[0_10px_30px_rgba(0,0,0,0.22)]
            backdrop-blur-md
            transition
            dark:bg-white/10 dark:hover:bg-white/15
            dark:ring-white/20
          "
        >
          <img
            src="/assemlogo-v2.png"
            alt="Assem logo"
            className="h-8 w-8 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]"
          />
        </button>


        {/* Nav (right) */}
        <div className="flex">
          {onHome ? (
            <>
              <Button onClick={handleWorkScroll}>Work</Button>
              <Button onClick={handleSkillsScroll}>Skills</Button>
              <Button onClick={handleAboutScroll}>About</Button>
            </>
          ) : (
            <Button onClick={() => router.push("/")}>Home</Button>
          )}

          {showResume && router.pathname !== "/resume" && (
            <Button onClick={() => router.push("/resume")} classes="first:ml-1">
              Resume
            </Button>
          )}

          <Button onClick={() => window.open("mailto:assem.h2001@gmail.com")}>
            Contact
          </Button>

          {mounted && theme && data.darkMode && (
            <Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <img
                className="h-6"
                src={`/images/${theme === "dark" ? "moon.svg" : "sun.svg"}`}
                alt="Toggle theme"
              />
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;
