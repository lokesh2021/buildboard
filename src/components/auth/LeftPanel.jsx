export default function LeftPanel({ mode }) {
  return (
    <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface-container-low flex-col justify-between p-12">
      {/* Brand */}
      <div className="z-10">
        <div className="flex items-center gap-3">
          <div className="primary-gradient p-2 rounded-lg shadow-lg">
            <span
              className="material-symbols-outlined text-on-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              grid_view
            </span>
          </div>
          <span className="text-xl font-bold tracking-tight text-on-background">BuildBoard</span>
        </div>
      </div>

      {/* Content — switches between login/signup */}
      <div className="relative z-10 flex flex-col gap-8">
        {mode === 'login' ? <LoginBento /> : <SignupBento />}
      </div>

      {/* Footer */}
      <div className="z-10">
        <div className="flex items-center gap-2 text-on-surface-variant/60">
          <span className="material-symbols-outlined text-sm">lock</span>
          <span className="text-xs uppercase tracking-widest font-medium">
            Enterprise Grade Security &amp; Privacy
          </span>
        </div>
      </div>

      {/* Decorative blurs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-tertiary/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />
    </section>
  )
}

function LoginBento() {
  return (
    <>
      <div className="grid grid-cols-6 grid-rows-4 gap-4 w-full h-[400px]">
        {/* Main doc card */}
        <div className="col-span-4 row-span-3 bg-surface-container-lowest rounded-xl shadow-sm p-6 flex flex-col gap-4 border border-outline-variant/10">
          <div className="h-4 w-1/3 bg-primary/10 rounded" />
          <div className="space-y-3">
            <div className="h-2 w-full bg-surface-container-highest rounded" />
            <div className="h-2 w-5/6 bg-surface-container-highest rounded" />
            <div className="h-2 w-4/6 bg-surface-container-highest rounded" />
          </div>
          <div className="mt-auto flex -space-x-2">
            <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-primary-container" />
            <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-tertiary-container" />
            <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-secondary-container" />
          </div>
        </div>

        {/* Progress ring */}
        <div className="col-span-2 row-span-2 bg-surface-container-lowest rounded-xl shadow-sm p-4 border border-outline-variant/10 flex flex-col items-center justify-center gap-2">
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
              <circle
                className="text-surface-container-high"
                cx="32" cy="32" r="28"
                fill="transparent" stroke="currentColor" strokeWidth="6"
              />
              <circle
                className="text-primary"
                cx="32" cy="32" r="28"
                fill="transparent" stroke="currentColor" strokeWidth="6"
                strokeDasharray="175" strokeDashoffset="45"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-on-surface">
              75%
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant">
            Milestones
          </span>
        </div>

        {/* Task list */}
        <div className="col-span-2 row-span-2 bg-surface-container-lowest rounded-xl shadow-sm p-4 border border-outline-variant/10">
          <div className="space-y-3">
            {[['bg-primary', 'w-12'], ['bg-tertiary', 'w-16'], ['bg-outline-variant', 'w-10']].map(
              ([color, width], i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <div className={`h-1.5 ${width} bg-surface-container-highest rounded`} />
                </div>
              )
            )}
          </div>
        </div>

        {/* Horizontal bar */}
        <div className="col-span-4 row-span-1 bg-surface-container-lowest rounded-xl shadow-sm px-6 flex items-center gap-4 border border-outline-variant/10">
          <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
          <div className="h-2 w-32 bg-surface-container-highest rounded" />
        </div>
      </div>

      <div className="max-w-md">
        <h2 className="text-3xl font-bold text-on-surface leading-tight">
          Focus on what matters. Build together.
        </h2>
        <p className="mt-4 text-on-surface-variant text-lg">
          Centralize your team's knowledge, tasks, and documentation in one high-velocity workspace.
        </p>
      </div>
    </>
  )
}

function SignupBento() {
  return (
    <>
      <div className="mb-4">
        <h1 className="text-4xl lg:text-5xl font-extrabold text-on-background leading-tight mb-6">
          Your team's central hub for{' '}
          <span className="text-primary">tasks and docs</span>
        </h1>
        <p className="text-lg text-on-surface-variant max-w-lg leading-relaxed">
          The structured workspace designed for high-velocity teams. Bring clarity to your projects
          without the administrative overhead.
        </p>
      </div>

      <div className="grid grid-cols-6 gap-4 h-[300px]">
        {/* Glass workspace card */}
        <div className="col-span-4 glass-panel rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-error/40" />
              <div className="w-3 h-3 rounded-full bg-tertiary/40" />
              <div className="w-3 h-3 rounded-full bg-primary/40" />
            </div>
            <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest">
              Workspace / Q4 Roadmap
            </span>
          </div>
          <div className="space-y-4">
            <div className="h-4 w-3/4 bg-surface-container-highest rounded-full" />
            <div className="h-3 w-1/2 bg-surface-container rounded-full" />
            <div className="pt-2 grid grid-cols-2 gap-4">
              <div className="h-20 bg-surface-container-lowest rounded-lg border border-outline-variant/10 p-3 shadow-sm">
                <div className="h-2 w-full bg-primary/20 rounded mb-2" />
                <div className="h-2 w-2/3 bg-on-surface-variant/10 rounded" />
              </div>
              <div className="h-20 bg-surface-container-lowest rounded-lg border border-outline-variant/10 p-3 shadow-sm">
                <div className="h-2 w-full bg-tertiary/20 rounded mb-2" />
                <div className="h-2 w-1/2 bg-on-surface-variant/10 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="col-span-2 flex flex-col gap-4">
          <div className="flex-1 bg-primary-container/30 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span
              className="material-symbols-outlined text-primary mb-2 text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            <span className="text-xs font-semibold text-on-primary-container">Real-time Sync</span>
          </div>
          <div className="flex-1 bg-tertiary-container/40 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-tertiary mb-2 text-3xl">description</span>
            <span className="text-xs font-semibold text-on-tertiary-container">Auto-Docs</span>
          </div>
        </div>
      </div>
    </>
  )
}
