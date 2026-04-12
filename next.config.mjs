import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // Evita HTML da home em precache + NetworkFirst na URL inicial (desalinhamento de deploy / RSC).
  cacheStartUrl: false,
  dynamicStartUrl: false,
  // Recarregar ao voltar a rede costuma piorar UX em redes instáveis no PWA.
  reloadOnOnline: false,
  fallbacks: {
    document: "/offline",
  },
  // Com fallbacks.document, o next-pwa injeta handlerDidError em cada rota de runtimeCaching.
  // O cache padrão cobre JS/CSS/RSC; nesses pedidos o fallback não pode devolver HTML de /offline.
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
};

export default withPWA(nextConfig);
