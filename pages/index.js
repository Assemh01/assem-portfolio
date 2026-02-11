import { useRef } from "react";
import Header from "../components/Header";
import ServiceCard from "../components/ServiceCard";
import Socials from "../components/Socials";
import { useIsomorphicLayoutEffect } from "../utils";
import { stagger } from "../animations";
import Footer from "../components/Footer";
import Head from "next/head";
import Cursor from "../components/Cursor";
import BackToTop from "../components/BackToTop";
import ProjectItem from "../components/ProjectItem";

// Local Data
import data from "../data/portfolio.json";

export default function Home() {
  // ===== Refs (used for scroll + hero animation) =====
  const workRef = useRef();
  const aboutRef = useRef();
  const textOne = useRef();
  const textTwo = useRef();
  const textThree = useRef();
  const textFour = useRef();
  const skillsRef = useRef();

  // ===== Scroll handlers (Header nav -> scroll to sections) =====
  const handleWorkScroll = () => {
    window.scrollTo({
      top: workRef.current.offsetTop,
      left: 0,
      behavior: "smooth",
    });
  };

  const handleAboutScroll = () => {
    window.scrollTo({
      top: aboutRef.current.offsetTop,
      left: 0,
      behavior: "smooth",
    });
  };

  const handleSkillsScroll = () => {
    window.scrollTo({
      top: skillsRef.current.offsetTop,
      left: 0,
      behavior: "smooth",
    });
  };

  // ===== Hero animation (currently expects up to 4 refs) =====
  useIsomorphicLayoutEffect(() => {
    stagger(
      [textOne.current, textTwo.current, textThree.current, textFour.current],
      { y: 40, x: -10, transform: "scale(0.95) skew(10deg)" },
      { y: 0, x: 0, transform: "scale(1)" }
    );
  }, []);

  return (
    // ===== Page Root =====
    <div
      className={`relative min-h-screen ${data.showCursor ? "cursor-none" : ""}`}
    >
      <Head>
        <title>Assem Alhomsi | AI Engineer</title>

        <meta
          name="description"
          content="Assem Alhomsi is an AI Engineer specializing in production-ready GenAI systems, RAG pipelines, LLM deployment, and scalable backend services."
        />

        <meta name="keywords" content="Assem Alhomsi, AI Engineer, Generative AI, RAG, LLM, LangChain, LangGraph, Machine Learning, Backend, Python" />

        <meta name="author" content="Assem Alhomsi" />

        {/* Open Graph (LinkedIn / Facebook preview) */}
        <meta property="og:title" content="Assem Alhomsi | AI Engineer" />
        <meta
          property="og:description"
          content="AI Engineer building production-ready GenAI systems — RAG pipelines, LLM deployment, and scalable backend infrastructure."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com" />

        {/* Twitter preview */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Assem Alhomsi | AI Engineer" />
        <meta
          name="twitter:description"
          content="Production-ready GenAI systems, RAG architecture, and LLM infrastructure."
        />
      </Head>

      {/* ===== Custom Cursor (optional, controlled by portfolio.json) ===== */}
      {data.showCursor && <Cursor />}

      {/* ===== Background Layer (gradient circle + top spacing) ===== */}
      <div className="relative">
        <div className="gradient-circle"></div>

        {/* Top cap height = gradient band */}
        <div className="h-40 tablet:h-48"></div>

        {/* =========================
            HERO SECTION (wide)
            - Header (nav)
            - Name + intro
            - Social links
           ========================= */}
        <div className="mx-auto max-w-screen-2xl px-4 laptop:px-8 mb-10 -mt-28 tablet:-mt-36">
          {/* Top Navigation */}
          <Header
            handleWorkScroll={handleWorkScroll}
            handleSkillsScroll={handleSkillsScroll}
            handleAboutScroll={handleAboutScroll}
          />

          {/* Hero content wrapper */}
          <div className="pt-0">
            <div className="mt-6 laptop:mt-8">
              <div className="mt-6 max-w-4xl">
                {/* Hero Title */}
                <h1
                  ref={textOne}
                  className="text-4xl tablet:text-5xl laptop:text-6xl font-bold leading-tight"
                >
                  {data.heroTitle}
                </h1>

                {/* Hero Subtitle */}
                <p
                  ref={textTwo}
                  className="mt-6 text-lg tablet:text-xl laptop:text-2xl text-gray-700 dark:text-gray-200 leading-relaxed max-w-3xl"
                >
                  {data.heroSubtitle}
                </p>
              </div>

              {/* Social links row */}
              <div className="mt-6">
                <div className="inline-block">
                  <p className="text-sm uppercase tracking-[0.35em] text-gray-900 dark:text-white">
                    Connect
                  </p>
                  <div className="mt-1 h-px w-full bg-gray-900/40 dark:bg-white/50" />
                </div>
              <Socials className="mt-3 text-gray-900 dark:text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* =========================
            MAIN CONTENT (wide)
            - Work
            - Services (will become Skills)
            - About
            - BackToTop + Footer
           ========================= */}
        <div className="mx-auto max-w-screen-2xl px-4 laptop:px-8">
          {/* =========================
              WORK SECTION
              - Title
              - Project cards grid (will be replaced with BoxMind contributions)
             ========================= */}
         <div id="work" className="mt-10 flex items-center gap-4 scroll-mt-24" ref={workRef}>
            <span className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-gray-900 dark:text-white font-semibold">
              <span className="inline-block h-1 w-6 bg-gray-900 dark:bg-white" />
                Selected work
              </span>
          <div className="h-px flex-1 bg-gray-900/20 dark:bg-white/20" />
          </div>
          <div className="mt-10 p-2 laptop:p-0">
            <div className="mt-5 laptop:mt-10 space-y-8">
              {data.projects.map((p) => (
                <ProjectItem
                  key={p.id}
                  title={p.title}
                  summary={p.summary}
                  impact={p.impact}
                  contributions={p.contributions}
                  stack={p.stack}
                />
              ))}
            </div>
          </div>

          {/* =========================
              SERVICES SECTION (TEMP)
              - Will be replaced with Skills categories
             ========================= */}
          <div id="skills" ref={skillsRef} className="mt-10 laptop:mt-30 p-2 laptop:p-0 scroll-mt-24">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-gray-900 dark:text-white font-semibold">
                <span className="inline-block h-1 w-6 bg-gray-900 dark:bg-white" />
                What I Build.
              </span>
              <div className="h-px flex-1 bg-gray-900/20 dark:bg-white/20" />
            </div>
            <div className="mt-5 grid grid-cols-1 laptop:grid-cols-2 gap-6">
              {data.coreSkills.map((skill, index) => (
                <ServiceCard
                  key={index}
                  name={skill.title}
                  description={skill.description}
                  hoverText={skill.hoverText}
                />
              ))}
            </div>
          </div>
          {/* =========================
              ABOUT SECTION
            ========================= */}
          <div id="about" className="mt-12 laptop:mt-16 p-2 laptop:p-0 scroll-mt-24" ref={aboutRef}>
            {/* Section label */}
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-gray-900 dark:text-white font-semibold">
                <span className="inline-block h-1 w-6 bg-gray-900 dark:bg-white" />
                About
              </span>
              <div className="h-px flex-1 bg-gray-900/20 dark:bg-white/20" />
            </div>

            {/* 2-col layout on laptop+ */}
            <div className="mt-5 grid grid-cols-1 laptop:grid-cols-[1.8fr_1fr] gap-10 items-start">
              {/* Left: Overview */}
              <div className="self-start">
                <h4 className="text-sm tablet:text-base font-semibold uppercase tracking-[0.3em] text-gray-900 dark:text-white/80">
                  Overview
                </h4>

                <p className="mt-3 text-xl tablet:text-2xl text-gray-900 dark:text-white leading-[1.65]">
                  {data.aboutpara}
                </p>
              </div>
              {/* Right: Highlights (editorial rail, not a card) */}
              <div className="self-start laptop:pl-8 relative">
              <span
                className="hidden laptop:block absolute left-0 top-1 w-px h-[240px]
                bg-gradient-to-b from-transparent via-gray-900/25 to-transparent
                dark:via-white/25"
              />
                <h4 className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-900 dark:text-white/80">
                  Context
                </h4>

                <div className="mt-4 space-y-4">
                  {/* Item */}
                  <div className="pl-4">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-gray-600 dark:text-purple-200/80">
                      What I focus on
                    </p>
                    <p className="mt-1 text-base tablet:text-lg text-gray-900 dark:text-white/80">
                      Shipping production GenAI systems — not demos.
                    </p>
                  </div>

                  <div className="pl-4">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-gray-600 dark:text-purple-200/80">
                      Where I add value
                    </p>
                    <p className="mt-1 text-base tablet:text-lg text-gray-900 dark:text-white/80">
                      RAG quality, evaluation loops, and agent orchestration.
                    </p>
                  </div>

                  <div className="pl-4">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-gray-600 dark:text-purple-200/80">
                      Currently
                    </p>
                    <p className="mt-1 text-base tablet:text-lg text-gray-900 dark:text-white/80">
                      Dearborn Heights, MI · open to AI/ML roles
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== Floating "Back to Top" button ===== */}
          <BackToTop />

          {/* ===== Footer ===== */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
