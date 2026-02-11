import React, { useEffect, useState } from "react";
import CustomCursor from "custom-cursor-react";
import "custom-cursor-react/dist/index.css";
import { useTheme } from "next-themes";

const Cursor = () => {
  const { resolvedTheme } = useTheme();
  const [mount, setMount] = useState(false);
  const [idle, setIdle] = useState(false);

  const getCusomColor = () => {
    if (resolvedTheme === "dark") {
      return "rgba(255, 255, 255, 0.85)";
    }
    return "rgba(15, 15, 15, 0.85)";
  };

  useEffect(() => {
    setMount(true);
  }, []);

  // idle detection: after 800ms of no mouse movement -> dim cursor
  useEffect(() => {
    if (!mount) return;

    let t;

    const onMove = () => {
      setIdle(false);
      clearTimeout(t);
      t = setTimeout(() => setIdle(true), 800);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    // start timer right away so it can dim if user doesn't move
    t = setTimeout(() => setIdle(true), 800);

    return () => {
      window.removeEventListener("mousemove", onMove);
      clearTimeout(t);
    };
  }, [mount]);

  return (
    <>
      {mount && (
        <CustomCursor
          targets={[".link"]}
          customClass={`custom-cursor ${idle ? "cursor-idle" : "cursor-active"}`}
          dimensions={28}
          fill={getCusomColor()}
          smoothness={{
            movement: 0.2,
            scale: 0.1,
            opacity: 0.2,
          }}
          targetOpacity={0.5}
          targetScale={2}
        />
      )}
    </>
  );
};

export default Cursor;