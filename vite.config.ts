import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Define a function that returns the plugin array without top-level await
function getPlugins() {
  const plugins = [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
  ];
  
  // Only add cartographer in development mode on Replit
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    // We'll use a dynamic require approach instead of top-level await
    try {
      const cartographer = require("@replit/vite-plugin-cartographer").cartographer;
      plugins.push(cartographer());
    } catch (err) {
      console.warn("Could not load cartographer plugin:", err);
    }
  }
  
  return plugins;
}

export default defineConfig({
  plugins: getPlugins(),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
