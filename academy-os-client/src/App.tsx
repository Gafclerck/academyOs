import AppRoutes from "./routes/appRoutes"
import { Toaster } from "@/components/ui/sonner"

const App = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#151528] text-slate-900 dark:text-white transition-colors duration-300">
      <AppRoutes />
      <Toaster position="bottom-right" richColors />
    </div>
  )
}

export default App