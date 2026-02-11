import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const ServiceCard = ({ name, description, hoverText }) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className="
        group w-full rounded-2xl p-6 laptop:p-7
        transition-all ease-out duration-300
        bg-white/90 border border-purple-200
        hover:border-purple-300
        shadow-[0_12px_40px_rgba(0,0,0,0.08)]
        hover:-translate-y-1
        dark:bg-white/[0.04] 
        dark:border-white/10 dark:hover:border-purple-300/40
        dark:shadow-none 
        dark:backdrop-blur
      "
    >
      <h1 className="text-2xl font-semibold tracking-tight">
        {name}
      </h1>

      <p className="mt-2 text-base text-gray-600 dark:text-gray-300 leading-relaxed">
        {description}
      </p>
      
      {hoverText && (
        <p className="mt-4 text-xs uppercase tracking-[0.22em] text-gray-600/80 dark:text-purple-200/70">
          {hoverText}
        </p>
      )}
    </div>
  );
};

export default ServiceCard;
