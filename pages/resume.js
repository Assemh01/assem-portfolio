import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Cursor from "../components/Cursor";
import Header from "../components/Header";
import Socials from "../components/Socials";
import { useTheme } from "next-themes";
import Head from "next/head";
import data from "../data/portfolio.json";
import BackToTop from "../components/BackToTop";

const splitBullets = (bullets) => {
  if (!bullets) return [];
  if (Array.isArray(bullets)) {
    return bullets.map((b) => String(b).trim()).filter(Boolean);
  }
  return String(bullets)
    .split(/\n|,/g)
    .map((b) => b.trim())
    .filter(Boolean);
};

const ResumeExperience = ({ dates, type, position, bullets, isLast }) => {
  const list = useMemo(() => splitBullets(bullets), [bullets]);

  return (
    <div className="w-full">
      <div className="pt-5">
        <div className="flex flex-col tablet:flex-row tablet:items-baseline tablet:justify-between gap-2">
          <h3 className="text-lg tablet:text-xl font-semibold text-gray-900 dark:text-white">
            {position}
          </h3>

          <div className="text-sm text-gray-700/70 dark:text-white/60">
            <span>{dates}</span>
            <span className="mx-2 opacity-60">•</span>
            <span>{type}</span>
          </div>
        </div>

        {list.length > 0 && (
          <ul className="mt-4 space-y-2">
            {list.map((b, i) => (
              <li
                key={i}
                className="text-sm tablet:text-[15px] leading-relaxed text-gray-800/80 dark:text-white/75 flex gap-3"
              >
                <span className="mt-[0.45rem] h-1.5 w-1.5 rounded-full bg-gray-900/50 dark:bg-white/60 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        {!isLast && (
          <div className="mt-8 h-px w-full bg-gray-900/10 dark:bg-white/10" />
        )}
      </div>
    </div>
  );
};

const SkillGroupCard = ({ title, items }) => {
  if (!items?.length) return null;

  return (
    <div
      className="
        relative overflow-hidden
        rounded-2xl p-6 border backdrop-blur-xl

        /* LIGHT MODE: slightly darker + glassy (BORDERS UNCHANGED) */
        bg-white/60
        border-purple-500/25
        ring-1 ring-purple-500/10
        shadow-[0_14px_45px_rgba(17,24,39,0.12)]

        /* DARK MODE: keep your existing vibe (BORDERS UNCHANGED) */
        dark:bg-purple-500/10
        dark:border-white/35
        dark:ring-1 dark:ring-white/10
        dark:shadow-none
      "
    >
      {/* LIGHT MODE ONLY: subtle tint so it’s not pure white */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-200/25 via-white/0 to-white/0 dark:opacity-0" />
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-purple-500/10 blur-[90px] dark:opacity-0" />

      <div className="relative mb-6">
        <h4 className="text-sm font-semibold uppercase tracking-[0.35em] text-gray-900 dark:text-white">
          {title}
        </h4>

        {/* PURPLE BAR (kept) */}
        <div className="mt-3 h-[2px] w-14 rounded-full bg-purple-500 dark:bg-purple-400/70" />
      </div>

      <div className="relative flex flex-wrap gap-2 content-start">
        {items.map((x, i) => (
          <span
            key={i}
            className="
              inline-flex items-center justify-center
              text-sm leading-snug
              px-3 py-[0.45rem]
              rounded-full border
              max-w-full whitespace-normal break-words text-center

              /* LIGHT MODE: slightly darker pills */
              bg-white/55 border-purple-500/25 text-gray-900

              /* DARK MODE */
              dark:bg-white/10 dark:border-white/10 dark:text-white/90

              shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]
            "
          >
            {x}
          </span>
        ))}
      </div>
    </div>
  );
};

const Resume = () => {
  const router = useRouter();
  const theme = useTheme();
  const [mount, setMount] = useState(false);

  useEffect(() => {
    setMount(true);
    if (!data.showResume) router.push("/");
  }, []);

  return (
    <div
      className={`relative min-h-screen ${data.showCursor ? "cursor-none" : ""}`}
    >
      {data.showCursor && <Cursor />}
      <BackToTop />

      <Head>
        <title>{data.name} — Resume</title>
      </Head>

      {/* Full-page background (light + dark) */}
      <div className="relative min-h-screen overflow-hidden bg-white text-gray-900 dark:bg-black dark:text-white">
        {/* base gradient */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-purple-200 via-purple-50 to-white dark:from-purple-900/25 dark:via-black dark:to-black" />

        {/* keep your existing circle if you want (should be theme-safe in CSS) */}
        <div className="gradient-circle" />

        {/* ambient blobs (theme-safe) */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-[560px] w-[560px] rounded-full
          bg-purple-500/30 dark:bg-purple-500/20 blur-[140px]" />

        <div className="pointer-events-none absolute top-[18%] -right-24 h-[560px] w-[560px] rounded-full
          bg-fuchsia-500/25 dark:bg-fuchsia-500/15 blur-[140px]" />

        <div className="pointer-events-none absolute bottom-[-180px] left-[18%] h-[620px] w-[620px] rounded-full
          bg-indigo-500/25 dark:bg-indigo-500/15 blur-[160px]" />

        {/* light-mode helper blob */}
        <div className="pointer-events-none absolute top-[55%] right-[8%] h-[420px] w-[420px] rounded-full
          bg-purple-400/20 dark:bg-purple-400/0 blur-[140px]" />

        {/* vignette (light is subtle, dark is stronger) */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/0 dark:from-black/20 dark:via-black/45 dark:to-black/85" />

        <div className="relative">
          <div className="h-40 tablet:h-48" />

          <div className="mx-auto max-w-screen-2xl px-4 laptop:px-8 mb-10 -mt-28 tablet:-mt-36">
            <Header />

            {/* Page title */}
            <div className="mt-10 tablet:mt-14 flex flex-col items-center text-center">
              <h1 className="text-5xl tablet:text-6xl font-semibold text-gray-900 dark:text-white tracking-tight">
                Resume
              </h1>
              <div className="mt-3 flex justify-center">
                <div
                  className="
                    h-1
                    w-36 tablet:w-52
                    rounded-full

                    bg-gradient-to-r
                    from-purple-500/0
                    via-purple-500/60
                    to-purple-500/0

                    dark:from-purple-400/0
                    dark:via-purple-400/70
                    dark:to-purple-400/0
                  "
                />
              </div>
            </div>

            {mount && (
              <div className="mt-8 w-full flex flex-col items-center">
                {/* Main resume card */}
                <div
                  className={`w-full max-w-4xl rounded-2xl border p-8 tablet:p-10 laptop:p-12 backdrop-blur-xl shadow-[0_24px_90px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_90px_rgba(0,0,0,0.55)] ${
                    theme.theme === "dark"
                      ? "bg-black/60 border border-white/15"
                      : "bg-white/70 border-2 border-gray-900/20 ring-1 ring-gray-900/5"
                  }`}
                >
                  {/* Top */}
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 tablet:grid-cols-[1fr_auto] tablet:items-start gap-4">
                      <div>
                        <div className="flex items-center min-h-[3rem] tablet:min-h-[3.5rem]">
                          <h1 className="text-3xl tablet:text-4xl font-bold text-gray-900 dark:text-white">
                            {data.name}
                          </h1>
                        </div>

                        <p className="text-lg tablet:text-xl mt-2 text-gray-800/80 dark:text-white/80">
                          {data.resume.tagline}
                        </p>

                        <p className="mt-4 text-base tablet:text-lg text-gray-700 dark:text-gray-200/80 max-w-2xl leading-relaxed">
                          {data.resume.description}
                        </p>
                      </div>

                      <div className="tablet:pt-1 flex tablet:justify-end">
                        <a
                          href="/Assem_Alhomsi_AI_Resume.pdf"
                          download
                          className="
                            text-sm tablet:text-base px-4 py-2 rounded-lg font-medium
                            transition whitespace-nowrap
                            bg-gray-900 text-white hover:bg-gray-800
                            dark:bg-white dark:text-black dark:hover:bg-white/90
                          "
                        >
                          Download PDF
                        </a>
                      </div>
                    </div>

                    <div className="mt-1">
                      <Socials />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="mt-6 h-px w-full bg-gray-900/10 dark:bg-white/10" />

                  {/* Experience */}
                  <div className="mt-8">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-gray-900 dark:text-white font-semibold">
                        <span className="inline-block h-1 w-6 bg-gray-900 dark:bg-white" />
                        Experience
                      </span>
                      <div className="h-px flex-1 bg-gray-900/20 dark:bg-white/20" />
                    </div>

                    <div className="mt-2">
                      {data.resume.experiences.map((exp, idx) => (
                        <ResumeExperience
                          key={exp.id}
                          dates={exp.dates}
                          type={exp.type}
                          position={exp.position}
                          bullets={exp.bullets}
                          isLast={idx === data.resume.experiences.length - 1}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="mt-8">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-gray-900 dark:text-white font-semibold">
                        <span className="inline-block h-1 w-6 bg-gray-900 dark:bg-white" />
                        Education
                      </span>
                      <div className="h-px flex-1 bg-gray-900/20 dark:bg-white/20" />
                    </div>

                    <div className="mt-6">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {data.resume.education.universityName}
                      </p>
                      <p className="text-sm text-gray-700/70 dark:text-white/70">
                        {data.resume.education.universityDate}
                      </p>

                      {data.resume.education.universityPara && (
                        <p className="text-sm mt-2 text-gray-700/70 dark:text-white/70 leading-relaxed">
                          {data.resume.education.universityPara}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mt-8">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-gray-900 dark:text-white font-semibold">
                        <span className="inline-block h-1 w-6 bg-gray-900 dark:bg-white" />
                        Skills
                      </span>
                      <div className="h-px flex-1 bg-gray-900/20 dark:bg-white/20" />
                    </div>

                    <div className="mt-6 grid grid-cols-1 tablet:grid-cols-3 gap-6 items-stretch">
                      <SkillGroupCard title="LLM + RAG" items={data.resume.languages} />
                      <SkillGroupCard title="Backend + Infra" items={data.resume.frameworks} />
                      <SkillGroupCard title="ML + Tools" items={data.resume.others} />
                    </div>
                  </div>

                  <div className="mt-2" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resume;
