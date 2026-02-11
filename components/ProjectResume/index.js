import React from "react";

const ProjectResume = ({ dates, type, position, bullets = [] }) => {
  return (
    <div className="grid grid-cols-1 tablet:grid-cols-[220px_1fr] gap-6">
      {/* Left rail */}
      <div>
        <p className="text-sm tablet:text-base font-medium text-gray-900 dark:text-white">
          {dates}
        </p>
        <p className="text-xs mt-1 text-gray-700/70 dark:text-white/70">
          {type}
        </p>
      </div>

      {/* Right content */}
      <div>
        <p className="text-base tablet:text-lg font-semibold text-gray-900 dark:text-white">
          {position}
        </p>

        {bullets?.length > 0 && (
          <ul className="mt-3 space-y-2">
            {bullets.map((b, i) => (
              <li
                key={i}
                className="text-sm tablet:text-base text-gray-700 dark:text-gray-200/80 leading-relaxed flex gap-3"
              >
                <span className="mt-[0.35rem] h-1.5 w-1.5 rounded-full bg-gray-900/60 dark:bg-white/60 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProjectResume;
