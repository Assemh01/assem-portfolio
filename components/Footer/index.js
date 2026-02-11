import React from "react";
import Button from "../Button";

const Footer = ({}) => {
  return (
    <>
 {/* Ambient glow (viewport layer) */}
    <div className="pointer-events-none fixed inset-0 z-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            `
            radial-gradient(
              70% 55% at 85% 70%,
              rgba(168,85,247,0.45) 0%,
              rgba(99,102,241,0.28) 32%,
              rgba(0,0,0,0) 65%
            ),
            linear-gradient(
              180deg,
              rgba(168,85,247,0.35) 0%,
              rgba(0,0,0,0) 50%
            )
            `,
          filter: "blur(90px)",
          opacity: 0.85,
        }}
      />
    </div>
      {/* Footer content */}
      <div className="relative z-10 mt-6 laptop:mt-10 p-2 laptop:p-0">
      {/* top divider to separate About -> Contact */}
      <div className="relative -mx-4 laptop:-mx-8 mt-4 mb-6">
        <div className="
          h-px w-full
          bg-gradient-to-r
          from-black/20 via-black/10 to-transparent
          dark:from-white/20 dark:via-white/10
        " />
      </div>
        <div className="mt-4 laptop:mt-6">
          <h2 className="
            text-3xl tablet:text-4xl laptop:text-5xl
            font-semibold leading-tight
          ">
            Let’s work together.
          </h2>
          <Button
            type="primary"
            onClick={() => window.open("https://calendly.com/assem-h2001/30min")}
            classes="
              mt-4 px-5 py-3 rounded-xl
              text-medium font-medium tracking-wide
              bg-black text-white
              dark:bg-white dark:text-black
              hover:bg-black hover:text-white
              dark:hover:bg-white dark:hover:text-black
            "
          >
            Schedule a call
          </Button>
        </div>

        <h1 className="cursor-none text-xs opacity-60 mt-4 laptop:mt-12">
          Portfolio by Assem Alhomsi © {new Date().getFullYear()}
        </h1>
      </div>
    </>
  );
};

export default Footer;
