import { useAuth } from '../../context/AuthContext'

export default function TopBar({ onNewProject }) {
  const { user } = useAuth()

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'You'

  const avatarUrl = user?.user_metadata?.avatar_url

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-6 py-3 border-b border-outline-variant/10 h-16">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 focus:ring-1 focus:ring-primary outline-none transition-all text-sm placeholder:text-on-surface-variant/40"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors active:scale-95">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors active:scale-95">
          <span className="material-symbols-outlined">help</span>
        </button>

        <div className="h-8 w-px bg-outline-variant/20 mx-1" />

        <div className="flex items-center gap-3 pl-1">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold leading-none text-on-surface">{displayName}</p>
          </div>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant/20"
            />
          ) : (
            <div className="w-8 h-8 rounded-full primary-gradient flex items-center justify-center text-on-primary text-xs font-bold">
              {initials}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
