import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import withPWAInit from "@ducanh2912/next-pwa";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf8"));

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // Evita HTML da home em precache + NetworkFirst na URL inicial (desalinhamento de deploy / RSC).
  cacheStartUrl: false,
  dynamicStartUrl: false,
  // Recarregar ao voltar a rede costuma piorar UX em redes instáveis no PWA.
  reloadOnOnline: false,
  // Sem `fallbacks.document`: o plugin não injeta handlerDidError em massa nem precacheia HTML de /offline
  // como resposta genérica (evita SW “segurando” respostas erradas após deploy).
  extendDefaultRuntimeCaching: false,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === "navigate",
        handler: "NetworkOnly",
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version ?? "0.0.0",
    NEXT_PUBLIC_APP_BUILD_TIME: new Date().toISOString(),
  },
};

export default withPWA(nextConfig);
