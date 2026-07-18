import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
        changeOrigin: true,
      },
    },
  },

  build: {
    // Use esbuild (default, fastest) for minification
    minify: "esbuild",

    // Set a modern target so esbuild can apply more aggressive optimisations.
    // All major browsers since 2021 support ES2020.
    target: "es2020",

    // Show gzip-compressed sizes in the build output so you can track bundle
    // weight at a glance without adding an extra plugin.
    reportCompressedSize: true,

    // Warn when any single chunk exceeds 500 kB (gzip ~175 kB) — helps catch
    // regressions before they reach users.
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      output: {
        // ── Manual chunk splitting ──────────────────────────────────────────
        // Each bucket becomes a separate file that the browser can cache
        // independently. A user on the home page never downloads the PDF
        // viewer; a student doing a mock test never downloads Three.js.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // ── Heavy, rarely-together libraries ───────────────────────────
          // Three.js (~600 kB min) — only used on the landing/hero page
          if (id.includes("three")) return "three";

          // Framer-motion (~100 kB min) — animation library
          if (id.includes("framer-motion")) return "framer-motion";

          // PDF toolchain — jsPDF + html2canvas are only loaded when a
          // certificate is being downloaded
          if (id.includes("jspdf") || id.includes("html2canvas")) {
            return "jspdf";
          }

          // PDF.js viewer — only needed in the question-bank/notes viewer
          if (id.includes("pdfjs-dist")) return "pdfjs";

          // Socket.IO client — only active on authenticated pages
          if (id.includes("socket.io-client") || id.includes("engine.io-client")) {
            return "socket-io";
          }

          // Redux + RTK — small but loaded on every authenticated route
          if (
            id.includes("@reduxjs") ||
            id.includes("react-redux") ||
            id.includes("immer")
          ) {
            return "redux";
          }

          // React Router
          if (id.includes("react-router")) return "router";

          // Icon library — tree-shaken by Vite but still benefits from its
          // own cache entry so a lucide update doesn't bust the vendor chunk
          if (id.includes("lucide-react")) return "lucide";

          // i18next runtime + plugins
          if (id.includes("i18next") || id.includes("react-i18next")) {
            return "i18n";
          }

          // Everything else from node_modules goes into a single vendor chunk
          return "vendor";
        },
      },
    },
  },
});
