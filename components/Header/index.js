import { Popover } from "@headlessui/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Button from "../Button";
// Local Data
import data from "../../data/portfolio.json";

const Header = ({ handleWorkScroll, handleSkillsScroll, handleAboutScroll }) => {
  const router = useRouter();
  const onHome = router.pathname === "/";
  const goToHomeSection = (id, localScrollFn) => {
  if (router.pathname === "/") {
    localScrollFn?.();
  } else {
    router.push(`/#${id}`);
  }
};
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { showResume } = data;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Mobile Header */}
      <Popover className="block tablet:hidden mt-5">
        {({ open }) => (
          <>
            <div className="flex items-center justify-between px-4 py-2">
              <div className="w-8" />

              <div className="flex items-center">
                {data.darkMode && (
                  <Button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  >
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
                  <Button
                    onClick={() => router.push("/resume")}
                    classes="first:ml-1"
                  >
                    Resume
                  </Button>
                )}

                <Button
                  onClick={() => window.open("mailto:assem.h2001@gmail.com")}
                >
                  Contact
                </Button>
              </div>
            </Popover.Panel>
          </>
        )}
      </Popover>

      {/* Desktop Header */}
      <div className="hidden tablet:flex items-center justify-end sticky top-0 z-10 px-6 h-12">
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
            <Button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
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