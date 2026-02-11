import "../styles/globals.css";
import { ThemeProvider } from "next-themes";
import data from "../data/portfolio.json";
import { useEffect } from "react";

const App = ({ Component, pageProps }) => {
  useEffect(() => {
    if (!data.showCursor) return;

    // hide the native cursor everywhere (even below footer / outside root div)
    document.documentElement.classList.add("cursor-none");

    return () => {
      document.documentElement.classList.remove("cursor-none");
    };
  }, []);

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
