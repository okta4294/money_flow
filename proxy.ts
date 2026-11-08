import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV !== "production";

  const cspHeader = `
    default-src 'none';
    script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""} https://apis.google.com https://kit.fontawesome.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://ka-f.fontawesome.com;
    img-src 'self' blob: data: https://lh3.googleusercontent.com;
    font-src 'self' data: https://fonts.gstatic.com https://ka-f.fontawesome.com;
    connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://generativelanguage.googleapis.com https://ka-f.fontawesome.com;
    frame-src 'self' https://*.firebaseapp.com https://accounts.google.com;
    manifest-src 'self';
    worker-src 'self' blob:;
    media-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${!isDev ? "upgrade-insecure-requests;" : ""}
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(), usb=()"
  );

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

