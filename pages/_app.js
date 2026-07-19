import "../styles/globals.css";
import { ThemeProvider } from "next-themes";
import data from "../data/portfolio.json";
import { useEffect } from "react";
import { useRouter } from "next/router";

const App = ({ Component, pageProps }) => {
  const router = useRouter();
  const isAdminPage = router.pathname.startsWith("/admin");

  useEffect(() => {
    if (!data.showCursor) return;

    if (isAdminPage) {
      document.documentElement.classList.remove("cursor-none");
      return;
    }

    document.documentElement.classList.add("cursor-none");

    return () => {
      document.documentElement.classList.remove("cursor-none");
    };
  }, [isAdminPage]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={data.darkMode ? "dark" : "light"}
      enableSystem={false}
    >
      <Component {...pageProps} />
    </ThemeProvider>
  );
};

export default App;