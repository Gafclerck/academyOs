import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-slate-900">

      {/* MODE CLAIR */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex h-9 w-9 items-center justify-center rounded-full transition ${theme === 'light'
          ? 'bg-slate-100 text-orange-500'
          : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
          }`}
        aria-label="Mode clair"
      >
        <Sun className="size-4" />
      </button>

      {/* MODE SOMBRE */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex h-9 w-9 items-center justify-center rounded-full transition ${theme === 'dark'
          ? 'bg-slate-800 text-orange-400'
          : 'text-slate-400 hover:text-slate-700'
          }`}
        aria-label="Mode sombre"
      >
        <Moon className="size-4" />
      </button>

    </div>
  )
}

export default ThemeToggle