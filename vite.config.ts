import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

// Hosted on GitHub Pages at https://p-buisman.github.io/toonvast/
export default defineConfig({
  base: "/toonvast/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "Toonvast",
        short_name: "Toonvast",
        description: "Noten, toetsen en grepen leren met piano en gitaar",
        lang: "nl",
        start_url: "/toonvast/",
        scope: "/toonvast/",
        display: "standalone",
        background_color: "#faf7f1",
        theme_color: "#faf7f1",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // The piano samples are precached too, so the app works offline after the first visit.
        globPatterns: ["**/*.{js,css,html,svg,png,mp3,woff2}"],
      },
    }),
  ],
  test: { environment: "node" },
});
