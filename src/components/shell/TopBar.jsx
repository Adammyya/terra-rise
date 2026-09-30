import { useAuthStore } from "../../store/authStore";

function TopBar({ onHistoryClick, onSettingsClick }) {
  const { user, logout } = useAuthStore();

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0b0b0c] px-6">
      <div>
        <h1 className="text-sm font-semibold tracking-[0.3em] text-white">
          SATQUERY
        </h1>

        <p className="mt-1 text-[9px] tracking-[0.25em] text-white/35">
          REMOTE-SENSING INTELLIGENCE
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.15em] text-white/40">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          SYSTEM READY
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-xs text-amber-400">
              {user.name}
            </span>
            <button
              type="button"
              onClick={logout}
              className="text-xs text-white/45 transition-colors hover:text-white"
            >
              LOGOUT
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
            className="text-xs text-white/45 transition-colors hover:text-white"
          >
            LOGIN
          </button>
        )}

        <button
          type="button"
          onClick={onHistoryClick}
          className="text-xs text-white/45 transition-colors hover:text-white"
        >
          HISTORY
        </button>

        <button
          type="button"
          onClick={onSettingsClick}
          className="text-xs text-white/45 transition-colors hover:text-white"
        >
          SETTINGS
        </button>
      </div>
    </header>
  );
}

export default TopBar;