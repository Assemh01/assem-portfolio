import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isDark = theme === "dark";

  return (
    <button
      onClick={() =>
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
      className={`
        fixed bottom-6 right-6 z-50
        h-12 w-12 rounded-full
        backdrop-blur
        flex items-center justify-center
        transition-all duration-300 ease-out
        hover:scale-105 active:scale-95
        cursor-none
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}
        ${
            isDark
            ? "bg-white/20 text-white hover:bg-white/30"
            : "bg-black/20 text-black hover:bg-black/30"
        }
        `}

      aria-label="Back to top"
    >
      <span className="text-xl font-semibold leading-none">↑</span>
    </button>
  );
}
