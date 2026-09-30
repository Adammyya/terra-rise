function NavigationRail({
  activeSection,
  onWorkspaceClick,
  onImageryClick,
  onAnalysisClick,
  onSettingsClick,
}) {
  const getButtonClass = (section) =>
    `transition-all duration-200 ${
      activeSection === section
        ? "text-white"
        : "text-white/30 hover:text-white"
    }`;

  return (
    <aside className="flex w-full md:w-16 h-16 md:h-auto flex-row md:flex-col items-center justify-between md:justify-start border-t md:border-t-0 md:border-r border-white/10 bg-[#0b0b0c] px-6 md:px-0 py-0 md:py-6 z-50">
      <button
        type="button"
        onClick={onWorkspaceClick}
        aria-label="Workspace"
        className={`hidden md:block mb-8 text-lg transition-all duration-200 ${
          activeSection === "workspace"
            ? "text-amber-400"
            : "text-white/30 hover:text-amber-400"
        }`}
      >
        ◉
      </button>

      <nav className="flex flex-row md:flex-col items-center gap-8 md:gap-6 text-xl md:text-sm w-full md:w-auto justify-center md:justify-start">
        <button
          type="button"
          onClick={onWorkspaceClick}
          aria-label="Workspace"
          className={getButtonClass("workspace")}
        >
          ◈
        </button>

        <button
          type="button"
          onClick={onImageryClick}
          aria-label="Imagery"
          className={getButtonClass("imagery")}
        >
          ◇
        </button>

        <button
          type="button"
          onClick={onAnalysisClick}
          aria-label="Analysis"
          className={getButtonClass("analysis")}
        >
          ⌁
        </button>
      </nav>

      <div className="mt-0 md:mt-auto hidden md:block">
        <button
          type="button"
          onClick={onSettingsClick}
          aria-label="Settings"
          className="text-sm text-white/30 transition-colors hover:text-white"
        >
          ⚙
        </button>
      </div>
    </aside>
  );
}

export default NavigationRail;