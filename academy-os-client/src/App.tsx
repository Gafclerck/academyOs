import Navbar from "./components/layouts/navbar"
import AppRoutes from "./routes/appRoutes"
import { Toaster } from "@/components/ui/sonner"

const App = () => {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#19192D] text-slate-900 dark:text-white transition-colors duration-300 flex flex-col">
      <Navbar />
      <div className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AppRoutes />
      </div>
      <Toaster position="bottom-right" richColors />
    </main>
  )
}

export default App