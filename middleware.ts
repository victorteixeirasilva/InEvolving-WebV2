import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BUILD_STAMP = process.env.NEXT_PUBLIC_APP_BUILD_TIME ?? "unknown";

/**
 * Evita CDN/proxy/navegador servirem HTML ou payload RSC antigo apontando para chunks
 * de outro deploy (`ChunkLoadError` / 404 em `/_next/static/...`).
 */
export function middleware(_request: NextRequest) {
  const res = NextResponse.next();
  res.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, max-age=0, must-revalidate"
  );
  /** Algumas CDNs (ex.: hcdn) respeitam estes mais que só `Cache-Control` no documento. */
  res.headers.set("CDN-Cache-Control", "no-store");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  /** Confirme no DevTools → Network → documento → cabeçalhos da resposta se o deploy atual está ativo. */
  res.headers.set("X-InEvolving-Build", BUILD_STAMP);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
