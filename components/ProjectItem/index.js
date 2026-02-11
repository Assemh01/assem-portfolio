import React from "react";

const Chip = ({ children }) => (
  <span
    className="
      px-3 h-8 text-sm leading-none flex items-center rounded-full
      border border-gray-300/90
      bg-gray-100 text-gray-800
      dark:border-purple-300/30
      dark:bg-purple-400/10
      dark:text-purple-100
    "
  >
    {children}
  </span>
);

const ProjectItem = ({ title, summary, impact, contributions, stack }) => {
  return (
    <div
      className="
        rounded-2xl p-6 laptop:p-7
        bg-white/90
        border border-purple-200
        shadow-[0_12px_40px_rgba(0,0,0,0.08)]
        dark:bg-white/[0.04]
        dark:border-white/10
        dark:shadow-none
        dark:backdrop-blur
      "
    >
      {/* 2-column layout on laptop+ */}
      <div className="grid grid-cols-1 laptop:grid-cols-[1.9fr_auto_0.9fr] gap-8">
        {/* LEFT: Main content */}
        <div>
          <h3 className="text-xl tablet:text-2xl laptop:text-3xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>

          <p className="mt-3 text-base tablet:text-lg text-gray-700 dark:text-white/70 leading-relaxed">
            {summary}
          </p>

          {impact && (
            <p className="mt-4 text-base tablet:text-lg text-gray-800 dark:text-white/80 leading-relaxed">
              <span className="font-semibold text-gray-900 dark:text-white">
                Impact:
              </span>{" "}
              {impact}
            </p>
          )}

          <ul className="mt-5 space-y-3 text-base tablet:text-lg text-gray-800 dark:text-white/75 leading-relaxed">
            {contributions.map((c, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-[11px] h-1.5 w-1.5 rounded-full bg-gray-900/50 dark:bg-white/70 shrink-0" />
                <span>{c}</span>
              </li>
            ))}
          </ul>

          {/* Stack chips (mobile only) */}
          <div className="mt-6 flex flex-wrap gap-2 laptop:hidden">
            {stack.map((t, i) => (
              <Chip key={i}>{t}</Chip>
            ))}
          </div>
        </div>

        {/* Divider (laptop+ only) */}
        <div className="hidden laptop:block w-px bg-gray-900/20 dark:bg-purple-300/25 self-stretch" />

        {/* RIGHT: Tech Stack (laptop+) */}
        <div className="hidden laptop:flex flex-col">
            <h4 className="
                text-xs font-semibold uppercase tracking-[0.35em]
                text-gray-900
                dark:text-purple-200/70
                ">
                Tech Stack
            </h4>
          <div className="mt-4 flex flex-wrap gap-2">
            {stack.map((t, i) => (
              <Chip key={i}>{t}</Chip>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectItem;
