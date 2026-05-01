import { defineConfig, loadEnv, type PluginOption } from "vite";

const ADSENSE_CLIENT_PATTERN = /^ca-pub-\d{16}$/;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const adsenseClient = (env.VITE_ADSENSE_CLIENT || "").trim();
  const adsensePlugin: PluginOption[] = ADSENSE_CLIENT_PATTERN.test(adsenseClient)
    ? [{
        name: "adsense-head-tags",
        transformIndexHtml() {
          return [
            {
              tag: "meta",
              attrs: { name: "google-adsense-account", content: adsenseClient },
              injectTo: "head",
            },
            {
              tag: "script",
              attrs: {
                async: true,
                crossorigin: "anonymous",
                "data-managed-adsense": "true",
                src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClient)}`,
              },
              injectTo: "head",
            },
          ];
        },
      }]
    : [];

  return {
    plugins: adsensePlugin,
    server: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
      },
    },
    preview: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
      },
    },
    optimizeDeps: {
      exclude: ["@imgly/background-removal"],
    },
  };
});
