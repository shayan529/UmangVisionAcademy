import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "Umang Vision Academy",
        short_name: "UmangVision",
        description: "AI-Powered Coaching Platform",
        theme_color: "#0B1120",
        background_color: "#0B1120",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/Logo.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/Logo.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],

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
    minify: "esbuild",
    target: "es2020",
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 450,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("firebase")) return "firebase";
          if (id.includes("react-icons")) return "react-icons";
          if (id.includes("three")) return "three";
          if (id.includes("framer-motion")) return "framer-motion";
          if (id.includes("jspdf") || id.includes("html2canvas"))
            return "jspdf";
          if (id.includes("pdfjs-dist")) return "pdfjs";
          if (
            id.includes("socket.io-client") ||
            id.includes("engine.io-client")
          )
            return "socket-io";
          if (
            id.includes("@reduxjs") ||
            id.includes("react-redux") ||
            id.includes("immer")
          )
            return "redux";
          if (id.includes("react-router")) return "router";
          if (id.includes("lucide-react")) return "lucide";
          if (id.includes("i18next") || id.includes("react-i18next"))
            return "i18n";
          if (id.includes("react") || id.includes("scheduler"))
            return "react-vendor";

          return "vendor";
        },
      },
    },
  },
});
