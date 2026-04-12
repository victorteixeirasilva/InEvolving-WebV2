import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
