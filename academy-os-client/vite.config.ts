import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,        // Port fixe
    strictPort: true,  // Erreur si le port est déjà utilisé (au lieu de passer à 5174)
    host: true,        // Expose sur le réseau local (0.0.0.0)
  },
})
