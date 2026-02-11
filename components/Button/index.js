import React from "react";
import { useTheme } from "next-themes";
import data from "../../data/portfolio.json";

const Button = ({ children, type, variant, onClick, classes }) => {
  const { theme } = useTheme();

  // Primary stays the same (your schedule a call)
  if (type === "primary") {
    return (
      <button
        onClick={onClick}
        type="button"
        className={`text-sm tablet:text-base p-1 laptop:p-2 rounded-lg ${
          theme === "dark"
            ? "bg-white text-black hover:bg-white/90 hover:text-black"
            : "bg-black text-white hover:bg-black/90 hover:text-white"
        } transition-all duration-300 ease-out first:ml-0 hover:scale-105 active:scale-100 link ${
          data.showCursor && "cursor-none"
        } ${classes}`}
      >
        {children}
      </button>
    );
  }

  // ✅ New: pill style ONLY when variant="pill"
    if (variant === "pill") {
    return (
      <button
        onClick={onClick}
        type="button"
        className={`
          h-10 px-4 pt-[1px]
          inline-flex items-center justify-center
          text-[16px] leading-none
          rounded-full
          backdrop-blur
          transition-all duration-300 ease-out
          active:scale-[0.97]
          link

          border border-gray-900/30
          bg-black/[0.06]
          text-gray-900
          hover:border-gray-900/60
          hover:text-gray-900
          hover:bg-black/[0.01]
          hover:shadow-[0_0_0_1px_rgba(0,0,0,0.12)]

          dark:border-white/20
          dark:bg-white/[0.04]
          dark:text-white/70
          dark:hover:border-white/60
          dark:hover:text-white
          dark:hover:bg-white/[0.08]
          dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.25)]

          ${data.showCursor && "cursor-none"}
          ${classes}
        `}
      >
        {children}
      </button>
    );
  }

  // Default button style (keep your old one so navbar stays normal)
  return (
    <button
      onClick={onClick}
      type="button"
      className={`text-sm tablet:text-base p-1 laptop:p-2 rounded-lg flex items-center justify-center transition-all ease-out duration-300
        text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10
        hover:scale-105 active:scale-100 tablet:first:ml-0
        ${data.showCursor && "cursor-none"} ${classes} link`}
    >
      {children}
    </button>
  );
};

export default Button;
